import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { globalRateLimiter, checkUserLimit, isBypassToken } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { VIBE_AUDIT_SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";
import { vibeResultSchema } from "@/lib/schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const bypass = isBypassToken(request.headers.get("x-bypass-token"));

    // ── Global rate limit: 50/hour ──────────────────────────
    if (!bypass) {
      const global = await globalRateLimiter.limit("global");
      if (!global.success) {
        return NextResponse.json(
          {
            error: "The vibe server is overloaded. Try again in a few minutes.",
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }

    // ── Per-user lifetime limit: 10 free ────────────────────
    const user = bypass ? null : await checkUserLimit(ip);
    if (user && !user.success) {
      return NextResponse.json(
        {
          error: "You've used all 10 free vibe audits. Want unlimited? Paid access coming soon.",
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // ── Layer 3: Input Sanitization ─────────────────────────
    const body = await request.json().catch(() => null);
    if (!body || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field in request body." },
        { status: 400 }
      );
    }

    const sanitized = sanitizeInput(body.text);
    if ("error" in sanitized) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    // ── Layer 4: Hardened Prompt → Anthropic API ────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: VIBE_AUDIT_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserMessage(sanitized.text) },
      ],
    });

    const rawText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // ── Layer 5: Output Validation ──────────────────────────
    let parsed: unknown;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude response as JSON:", rawText.slice(0, 200));
      return NextResponse.json(
        { error: "Vibe analysis returned unexpected format. Try again." },
        { status: 502 }
      );
    }

    const result = vibeResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Zod validation failed:", result.error.flatten());
      return NextResponse.json(
        { error: "Vibe analysis returned invalid data. Try again." },
        { status: 502 }
      );
    }

    // ── Return validated, sanitized result ───────────────────
    return NextResponse.json({
      result: result.data,
      remaining: user?.remaining ?? null,
    });
  } catch (error) {
    console.error("Vibe audit error:", error);
    return NextResponse.json(
      { error: "Something went wrong. The vibes were too powerful." },
      { status: 500 }
    );
  }
}
