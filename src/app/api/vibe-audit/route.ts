import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { globalRateLimiter, checkUserLimit, isBypassToken } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { getSystemPrompt, buildUserMessage } from "@/lib/prompt";
import type { AuditMode } from "@/lib/types";
import { vibeResultSchema } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const bypass = isBypassToken(request.headers.get("x-bypass-token"));

    // ── Identify user ─────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let plan: "free" | "pro" = "free";
    let remaining: number | null = null;
    let auditCredits = 0;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("plan, audit_credits")
        .eq("id", user.id)
        .single();
      plan = (data?.plan as "free" | "pro") ?? "free";
      auditCredits = data?.audit_credits ?? 0;
    }

    // ── Rate limiting ─────────────────────────────────
    if (!bypass && plan !== "pro") {
      // Global rate limit: 50/hour
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

      // If user has purchased credits, use those first
      if (user && auditCredits > 0) {
        await getSupabaseAdmin()
          .from("profiles")
          .update({ audit_credits: auditCredits - 1 })
          .eq("id", user.id);
        remaining = auditCredits - 1;
      } else {
        // Fall through to Redis lifetime limit (5 free audits)
        const limitKey = user ? `user:${user.id}` : ip;
        const userLimit = await checkUserLimit(limitKey);
        if (!userLimit.success) {
          return NextResponse.json(
            {
              error: user
                ? "You've used all your free vibe audits."
                : "You've used all your free vibe audits. Sign in for more options.",
              remaining: 0,
            },
            { status: 429 }
          );
        }

        remaining = userLimit.remaining;
      }
    }

    // ── Input sanitization ────────────────────────────
    const body = await request.json().catch(() => null);
    if (!body || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field in request body." },
        { status: 400 }
      );
    }

    const VALID_MODES: AuditMode[] = ["roast", "life-coach", "professional"];
    const mode: AuditMode = VALID_MODES.includes(body.mode) ? body.mode : "roast";

    const sanitized = sanitizeInput(body.text);
    if ("error" in sanitized) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    // ── Claude API call ───────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: getSystemPrompt(mode),
      messages: [
        { role: "user", content: buildUserMessage(sanitized.text) },
      ],
    });

    const rawText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // ── Output validation ─────────────────────────────
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

    // ── Return validated result ───────────────────────
    return NextResponse.json({
      result: result.data,
      plan,
      remaining: plan === "pro" ? null : remaining,
    });
  } catch (error) {
    console.error("Vibe audit error:", error);
    return NextResponse.json(
      { error: "Something went wrong. The vibes were too powerful." },
      { status: 500 }
    );
  }
}
