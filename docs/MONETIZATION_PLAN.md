# Vibes Audit — Monetization Implementation Plan

> Detailed technical plan for adding auth, payments, and feature gating to Vibes Audit.
> Written for a tech lead audience. Covers architecture decisions, data models, file-level
> implementation details, and phased rollout.

---

## Table of Contents

- [Current State](#current-state)
- [Proposed Model](#proposed-model)
- [Phase 1: Authentication (Supabase)](#phase-1-authentication-supabase)
- [Phase 2: Database Schema (Supabase Postgres)](#phase-2-database-schema-supabase-postgres)
- [Phase 3: Payments (Stripe Checkout)](#phase-3-payments-stripe-checkout)
- [Phase 4: Feature Gating](#phase-4-feature-gating)
- [API Route Changes](#api-route-changes)
- [Client Component Changes](#client-component-changes)
- [What Not to Build Yet](#what-not-to-build-yet)
- [Cost Estimates](#cost-estimates)
- [Risk & Open Questions](#risk--open-questions)

---

## Current State

| Layer | Current Implementation |
|-------|----------------------|
| **Auth** | None. Users are anonymous, identified by IP address. |
| **Database** | No persistent database. Upstash Redis stores ephemeral rate limit counters only. |
| **Rate Limiting** | Global: 50 req/hour (Upstash sliding window). Per-user: 10 lifetime audits per IP (`redis.incr`). |
| **Bypass** | Single shared `BYPASS_TOKEN` env var, passed via `?token=` query param. |
| **Payments** | None. "Paid access coming soon" copy in the UI. |
| **Data Persistence** | Zero. No audit history, no stored results. All results computed on-the-fly. |

**Key files:**

| File | Role |
|------|------|
| `src/app/api/vibe-audit/route.ts` | POST endpoint — rate limiting, Claude API call, Zod validation |
| `src/lib/rate-limit.ts` | Upstash rate limiting (global + per-user IP counter) |
| `src/lib/types.ts` | `VibeResult` interface, `DIMENSIONS` metadata |
| `src/components/VibeAuditTool.tsx` | Main client component — form, state, API calls, loading states |
| `src/components/ResultsPanel.tsx` | Results display — scores, radar chart, share/download |

**Stack:** Next.js 16.2.0, React 19, TypeScript, Tailwind 4, Claude Sonnet 4 (Anthropic SDK), Upstash Redis, Vercel.

---

## Proposed Model

### Freemium with Feature Gating + Usage Caps

**Free tier (no account required):**

- 5 audits per day (daily reset, tracked by IP for anonymous users or by account if signed in)
- Basic results only: overall vibe, emoji, tags, vibe summary
- No sharing, no radar chart, no per-dimension score breakdown

**Pro tier — $7/mo or $49/yr:**

- Unlimited audits
- Full score breakdown (all 6 dimensions with labels)
- Radar chart visualization
- Share/download results card
- Author archetype
- Audit history (last 50)

### Why This Model

1. **Free tier is generous enough to go viral.** The overall vibe ("Corporate Dad Energy 🎩") + summary + tags is the shareable hook. People can still use it and talk about it without paying.
2. **Detail is gated, not the core experience.** Users see the value before hitting the paywall — they know what they're missing.
3. **Daily reset keeps free users coming back** instead of the current lifetime cap that permanently locks out free users.
4. **$7/mo is impulse-buy range.** No procurement approval, no budget discussion. Low enough to convert casual users, high enough to cover Claude API costs with margin.
5. **Annual discount ($49 vs $84)** rewards commitment and reduces churn.

---

## Phase 1: Authentication (Supabase)

### Why Supabase

- Already on the Next.js / Vercel stack — first-class integration
- Auth + Postgres in one service — no separate auth provider needed
- Free tier covers this app's scale for a long time (50k monthly active users, 500MB database)
- Row Level Security (RLS) means the client can query audit history directly without custom API routes

### New Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### New Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Supabase Project Setup

1. Create project at [supabase.com](https://supabase.com)
2. Enable **Email** provider (magic link — no passwords)
3. Enable **Google** OAuth provider
4. Set redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://vibesaudit.com/auth/callback`

### Auth Strategy

- **Magic link (email) + Google OAuth** — covers 95% of users with minimal friction
- **No username/password** — less liability, fewer support tickets
- **Auth is optional** — free users can keep using the app without signing in (IP-based limits still work)
- Signing in unlocks: paid plan access, usage tied to account instead of IP, audit history
- Session stored in HTTP-only cookie via `@supabase/ssr`

### New Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser-side Supabase client (uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `src/lib/supabase/server.ts` | Server-side Supabase client (uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations in API routes) |
| `src/app/auth/callback/route.ts` | OAuth/magic link callback handler — exchanges code for session |
| `src/components/AuthButton.tsx` | Sign in / Sign out button, renders in the header area of `page.tsx` |

### `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `src/lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### `src/app/auth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
```

### `src/components/AuthButton.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">{user.email}</span>
        <button
          onClick={() => supabase.auth.signOut().then(() => setUser(null))}
          className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() =>
        supabase.auth.signInWithOtp({
          email: prompt("Enter your email") ?? "",
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
      }
      className="text-sm font-medium text-purple hover:text-purple-light transition-colors cursor-pointer"
    >
      Sign in
    </button>
  );
}
```

### Modified Files

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Add `<AuthButton />` to header area |
| `src/app/api/vibe-audit/route.ts` | Read Supabase session to get `user_id` (see [API Route Changes](#api-route-changes)) |

---

## Phase 2: Database Schema (Supabase Postgres)

### Tables

Run this in the Supabase SQL Editor:

```sql
-- ────────────────────────────────────────────────
-- profiles: tracks user plan and daily usage
-- ────────────────────────────────────────────────
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null,
  plan                   text not null default 'free',  -- 'free' | 'pro'
  stripe_customer_id     text,
  stripe_subscription_id text,
  audits_today           integer not null default 0,
  audits_today_reset_at  date not null default current_date,
  created_at             timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- audits: stores audit history for paid users
-- ────────────────────────────────────────────────
create table public.audits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  input_text text not null,
  result     jsonb not null,  -- full VibeResult object
  created_at timestamptz not null default now()
);

create index audits_user_created on public.audits (user_id, created_at desc);
```

### Row Level Security

```sql
alter table public.profiles enable row level security;
alter table public.audits enable row level security;

-- Users can only read their own profile
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only read their own audits
create policy "Users read own audits"
  on public.audits for select
  using (auth.uid() = id);
```

### Auto-Create Profile on Signup

Supabase trigger to create a `profiles` row when a new user signs up:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Why Postgres Instead of Keeping Redis

- **Subscriptions and audit history are persistent data.** Redis is for ephemeral counters.
- **Supabase Postgres is free** up to 500MB — years of audits at this scale.
- **RLS** means the client can query audit history directly — no custom API route needed.
- **Redis stays** for the global rate limiter and anonymous user IP counters (those are still ephemeral).

---

## Phase 3: Payments (Stripe Checkout)

### Why Stripe Checkout (Not Embedded)

- **Zero PCI compliance burden** — Stripe hosts the payment page entirely
- Handles tax collection, receipts, failed payment retries, cancellation flows
- Built-in customer portal for self-service subscription management
- ~2 hours to implement vs. days for a custom embedded form
- Stripe's hosted page converts better than custom forms (users trust it)

### New Dependency

```bash
npm install stripe
```

### New Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...
```

### Stripe Dashboard Setup

1. Create product **"Vibes Audit Pro"**
2. Add two prices:
   - **Monthly:** $7/mo recurring
   - **Yearly:** $49/yr recurring
3. Create webhook endpoint: `https://vibesaudit.com/api/stripe/webhook`
4. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Enable **Customer Portal** (Settings → Billing → Customer Portal)

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/stripe/checkout/route.ts` | Creates a Stripe Checkout Session, returns URL for redirect |
| `src/app/api/stripe/webhook/route.ts` | Receives Stripe webhook events, updates `profiles` table |
| `src/components/UpgradeButton.tsx` | "Go Pro" CTA, triggers checkout flow |

### `src/app/api/stripe/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Must be signed in" }, { status: 401 });
  }

  const { priceId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    metadata: { user_id: user.id },
    success_url: `${request.nextUrl.origin}/?upgraded=true`,
    cancel_url: `${request.nextUrl.origin}/`,
  });

  return NextResponse.json({ url: session.url });
}
```

### `src/app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role client — webhooks run without user context
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId) break;

      await supabase
        .from("profiles")
        .update({
          plan: "pro",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("profiles")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const plan = subscription.status === "active" ? "pro" : "free";
      await supabase
        .from("profiles")
        .update({ plan })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

### Checkout Flow (Sequence)

```
User clicks "Go Pro"
  → AuthButton checks: signed in?
    → No: prompt sign-in first, then redirect back
    → Yes: continue
  → POST /api/stripe/checkout { priceId }
  → Server creates Stripe Checkout Session with user_id in metadata
  → Returns session URL
  → Client redirects to Stripe hosted checkout
  → User completes payment on Stripe
  → Stripe redirects to /?upgraded=true
  → Stripe fires webhook → POST /api/stripe/webhook
  → Webhook updates profiles.plan = 'pro'
  → Next page load reads updated plan from profiles
```

### `src/components/UpgradeButton.tsx`

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Trigger sign-in flow first
      await supabase.auth.signInWithOtp({
        email: prompt("Enter your email to sign up") ?? "",
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 border border-gray-100">
      <p className="font-heading text-lg font-bold">Unlock full vibe analysis</p>
      <p className="text-sm text-muted text-center max-w-sm">
        Get detailed dimension scores, radar chart, shareable results card, and unlimited audits.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!)}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors disabled:opacity-50 cursor-pointer"
        >
          $7/month
        </button>
        <button
          onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!)}
          disabled={loading}
          className="px-5 py-2 rounded-lg border-2 border-purple text-purple text-sm font-medium hover:bg-purple/5 transition-colors disabled:opacity-50 cursor-pointer"
        >
          $49/year (save 42%)
        </button>
      </div>
    </div>
  );
}
```

---

## Phase 4: Feature Gating

### Free vs. Pro Feature Matrix

| Feature | Free | Pro |
|---------|------|-----|
| Overall vibe + emoji | Yes | Yes |
| Tags | Yes | Yes |
| Vibe summary | Yes | Yes |
| Individual dimension scores | Blurred / locked | Yes |
| Dimension labels (the funny ones) | Hidden | Yes |
| Radar chart | Hidden | Yes |
| Author archetype | Hidden | Yes |
| Share / download image | Hidden | Yes |
| Audit history | No | Last 50 |
| Daily limit | 5/day | Unlimited |

### Design Principle

The free result must feel complete enough to share by word-of-mouth. The overall vibe ("Corporate Dad Energy 🎩") + summary + tags is the viral hook. The detailed breakdown is the "I want more" pull toward upgrading.

---

## API Route Changes

### Modified: `src/app/api/vibe-audit/route.ts`

The route currently handles three concerns: bypass check, rate limiting, and Claude API call. The new version adds plan-aware logic:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { globalRateLimiter, checkUserLimit, isBypassToken } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { VIBE_AUDIT_SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";
import { vibeResultSchema } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const bypass = isBypassToken(request.headers.get("x-bypass-token"));

    // ── Identify user ─────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let plan: "free" | "pro" = "free";
    let profile = null;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("plan, audits_today, audits_today_reset_at")
        .eq("id", user.id)
        .single();
      profile = data;
      plan = (data?.plan as "free" | "pro") ?? "free";
    }

    // ── Rate limiting ─────────────────────────────────
    if (!bypass && plan !== "pro") {
      // Global rate limit: 50/hour
      const global = await globalRateLimiter.limit("global");
      if (!global.success) {
        return NextResponse.json(
          { error: "The vibe server is overloaded. Try again in a few minutes.", remaining: 0 },
          { status: 429 }
        );
      }

      if (user && profile) {
        // Signed-in free user: 5/day tracked in Postgres
        const today = new Date().toISOString().split("T")[0];
        const count = profile.audits_today_reset_at === today ? profile.audits_today : 0;

        if (count >= 5) {
          return NextResponse.json(
            { error: "You've used all 5 free audits for today. Upgrade for unlimited.", remaining: 0, plan: "free" },
            { status: 429 }
          );
        }

        // Increment (or reset if new day)
        await supabase
          .from("profiles")
          .update({
            audits_today: count + 1,
            audits_today_reset_at: today,
          })
          .eq("id", user.id);
      } else {
        // Anonymous: IP-based Redis limit (5/day instead of 10 lifetime)
        const userLimit = await checkUserLimit(ip);
        if (!userLimit.success) {
          return NextResponse.json(
            { error: "You've used all 5 free audits for today. Sign in for more.", remaining: 0 },
            { status: 429 }
          );
        }
      }
    }

    // ── Input sanitization ────────────────────────────
    const body = await request.json().catch(() => null);
    if (!body || typeof body.text !== "string") {
      return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
    }
    const sanitized = sanitizeInput(body.text);
    if ("error" in sanitized) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    // ── Claude API call ───────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: VIBE_AUDIT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(sanitized.text) }],
    });

    const rawText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // ── Parse & validate ──────────────────────────────
    let parsed: unknown;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Vibe analysis returned unexpected format." }, { status: 502 });
    }

    const result = vibeResultSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json({ error: "Vibe analysis returned invalid data." }, { status: 502 });
    }

    // ── Save audit history (pro users only) ───────────
    if (user && plan === "pro") {
      await supabase.from("audits").insert({
        user_id: user.id,
        input_text: sanitized.text,
        result: result.data,
      });
    }

    // ── Return result with plan info ──────────────────
    return NextResponse.json({
      result: result.data,
      plan,
      remaining: plan === "pro" ? null : (user && profile)
        ? Math.max(0, 5 - (profile.audits_today + 1))
        : null,
    });
  } catch (error) {
    console.error("Vibe audit error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
```

### Modified: `src/lib/rate-limit.ts`

Change the per-user limit from 10 lifetime to 5/day with daily reset:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const USER_DAILY_LIMIT = 5;
const BYPASS_TOKEN = process.env.BYPASS_TOKEN ?? "";

export function isBypassToken(token: string | null): boolean {
  return BYPASS_TOKEN.length > 0 && token === BYPASS_TOKEN;
}

// Global cap: 50 requests per hour across all users
export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  analytics: true,
  prefix: "vibe-audit-global",
});

// Anonymous per-IP daily limit (5/day, resets via TTL)
export async function checkUserLimit(ip: string) {
  const today = new Date().toISOString().split("T")[0];
  const key = `vibe-audit-user:${ip}:${today}`;
  const count = await redis.incr(key);

  // Set TTL on first use (expires end of day + buffer)
  if (count === 1) {
    await redis.expire(key, 86400);
  }

  if (count > USER_DAILY_LIMIT) {
    return { success: false, remaining: 0, used: count };
  }

  return { success: true, remaining: USER_DAILY_LIMIT - count, used: count };
}
```

---

## Client Component Changes

### Modified: `src/components/ResultsPanel.tsx`

Accept a `plan` prop and conditionally render features:

```typescript
interface ResultsPanelProps {
  result: VibeResult;
  inputText: string;
  plan: "free" | "pro";
}

export default function ResultsPanel({ result, inputText, plan }: ResultsPanelProps) {
  // ... existing code ...

  return (
    <div className="animate-fade-in-up mt-8 space-y-6">
      {/* Verdict Card — always visible */}
      <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="text-5xl mb-3">{result.vibeEmoji}</div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">{result.overallVibe}</h2>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {result.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 text-xs rounded-full bg-purple/10 text-purple font-medium">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-4 text-muted italic max-w-lg mx-auto leading-relaxed">
          &ldquo;{result.vibeSummary}&rdquo;
        </p>
      </div>

      {plan === "pro" ? (
        <>
          {/* Author Archetype — pro only */}
          {/* Score breakdown — pro only */}
          {/* Radar chart — pro only */}
          {/* Share bar — pro only */}
        </>
      ) : (
        <UpgradeButton />
      )}
    </div>
  );
}
```

### Modified: `src/components/VibeAuditTool.tsx`

- Track `plan` in state alongside `result` and `remaining`
- Pass `plan` to `ResultsPanel`
- Update the "audits remaining" copy to reference daily limit
- Show sign-in prompt when anonymous user hits limit

```typescript
// In the API response handler:
setResult(data.result);
setRemaining(data.remaining);
setPlan(data.plan ?? "free");

// In the JSX:
{result && (
  <div ref={resultsRef}>
    <ResultsPanel result={result} inputText={inputText} plan={plan} />
  </div>
)}
```

### New: Audit History Page (Optional, Pro Only)

| File | Purpose |
|------|---------|
| `src/app/history/page.tsx` | Server component — fetches last 50 audits via Supabase client-side query (RLS handles auth) |

This is a simple list page: date, input text preview, overall vibe. Clicking an entry shows the full result. Can be deferred to post-launch.

---

## What Not to Build Yet

| Feature | Why Not Now |
|---------|------------|
| Team plans | Wait until someone asks — zero signal this is needed |
| API access | Same — no demand signal yet |
| Custom Stripe portal | Use Stripe's hosted customer portal (one line of config) |
| Email drip campaigns | Overkill at this scale |
| Usage analytics dashboard | Vercel Analytics + Stripe Dashboard covers it |
| Refund handling | Stripe handles this in their dashboard |
| Annual billing toggle UI | Just show both price buttons side by side |
| Audit comparison / history charts | Feature creep — ship history as a simple list first |

---

## Cost Estimates

| Item | Monthly Cost |
|------|-------------|
| Claude API (~$0.003/audit × 1,000 audits) | ~$3 |
| Supabase (free tier: 50k MAU, 500MB DB) | $0 |
| Upstash Redis (free tier: 10k commands/day) | $0 |
| Vercel (hobby or pro) | $0–$20 |
| Stripe (2.9% + $0.30 per transaction) | Variable |
| **Break-even point** | **~2 paying users/month** |

At 100 paying users ($7/mo): $700/mo revenue, ~$50/mo costs = **$650/mo profit**.

---

## Risk & Open Questions

### IP-Based Limits Are Imperfect

Users behind corporate VPNs or shared networks may share a limit. This is acceptable for the free tier — it's a speed bump, not a wall. Signed-in users get their own counter.

### Daily Limit Reset Timing

The current plan resets at UTC midnight. Should it reset 24 hours from first use instead? UTC midnight is simpler and predictable. Recommend starting with UTC midnight.

### Global Rate Limit (50/hour)

This is currently very conservative. Once paying users exist, this needs to increase or be removed for pro users (the plan above already skips rate limiting for pro). Monitor and adjust.

### Claude API Cost at Scale

At $0.003/audit, costs stay low. But if the app goes viral and free tier usage spikes, costs could grow before revenue catches up. Mitigations:
- The 5/day free cap limits exposure
- Global rate limit provides a hard ceiling
- Can reduce to 3/day free if needed

### Webhook Reliability

Stripe webhooks can fail or be delayed. The app should handle this gracefully:
- User's plan update may lag by a few seconds after checkout
- Consider polling the profile on the client after redirect from Stripe (`/?upgraded=true` triggers a profile refresh)

### Migration Path for Existing Users

Current users have lifetime counters in Redis. When switching to daily limits:
- No migration needed — just deploy the new `checkUserLimit` with daily keys
- Old lifetime keys in Redis will naturally expire or become irrelevant
- Users who were previously locked out get a fresh start

---

## Implementation Order

| Phase | Effort Estimate | Depends On |
|-------|----------------|------------|
| 1. Auth (Supabase) | ~4 hours | Supabase project created |
| 2. Database schema + RLS | ~1 hour | Phase 1 |
| 3. Stripe integration | ~4 hours | Stripe account, Phase 1 + 2 |
| 4. Feature gating (UI) | ~3 hours | Phase 1 + 2 + 3 |
| **Total** | **~12 hours** | |

Phases are sequential — each builds on the previous. No architectural risks, no novel patterns. All integrations have well-documented SDKs and examples.
