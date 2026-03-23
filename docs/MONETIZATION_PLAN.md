# Vibes Audit — Monetization & Feature Plan v2

**Date:** March 23, 2026
**Status:** Planning — ready to build

---

## The Strategy

Transform Vibes Audit from a single-mode novelty tool into a multi-mode writing analysis
platform with a clean freemium model. Three audit modes create stickiness. Two payment
options (audit pack + subscription) let users choose their comfort level.

---

## 1. New Audit Modes

### Roast Mode (existing — keep as-is)
The classic. Brutal, funny, no-holds-barred vibe analysis. This is the flagship and viral hook.

**Current dimensions:** Pretentiousness, Dad Energy, Chaos, Passive Aggression,
Corporate Buzzwords, Unhinged Factor.

### Life Coach Mode (new)
**Tone:** Warm, constructive, slightly tough-love. "Here's what your writing says about
where your head's at."

**Use cases:** Journal entries, texts to an ex (before sending), personal statements,
therapy homework, dating profiles.

**Dimensions (6):**
1. Emotional Clarity (0–100) — How clearly are emotions expressed?
2. Confidence Level (0–100) — Does this read as self-assured or uncertain?
3. Authenticity (0–100) — Does this feel genuine or performative?
4. Self-Awareness (0–100) — Is the author aware of how they come across?
5. Growth Mindset (0–100) — Forward-looking vs. stuck in a rut?
6. Boundaries (0–100) — Healthy boundaries or people-pleasing?

### Professional Mode (new)
**Tone:** Direct, constructive, corporate-savvy. "Here's how this lands in a
professional context."

**Use cases:** Emails to boss, LinkedIn posts, cover letters, Slack messages,
performance reviews.

**Dimensions (6):**
1. Clarity (0–100) — Is the message clear and well-structured?
2. Professionalism (0–100) — Appropriate tone for workplace?
3. Persuasiveness (0–100) — Does this move people to action?
4. Conciseness (0–100) — Efficient use of words?
5. Empathy (0–100) — Does the writer consider the reader's perspective?
6. Authority (0–100) — Does this project competence and confidence?

---

## 2. Schema Restructuring

The current VibeResult has 6 hardcoded dimension fields (pretentiousness, dadEnergy, etc.).
This needs to become a generic dimensions array so any mode can define its own 6 dimensions
without schema changes.

### New VibeResult type

```typescript
type AuditMode = "roast" | "life-coach" | "professional";

interface DimensionResult {
  key: string;        // e.g. "pretentiousness", "clarity"
  label: string;      // funny/insightful 3-6 word description
  score: number;      // 0-100
  color: string;      // hex color for UI
}

interface VibeResult {
  mode: AuditMode;
  overallVibe: string;        // 1-3 word label
  vibeEmoji: string;          // single emoji
  dimensions: DimensionResult[];  // exactly 6
  vibeSummary: string;        // 2-sentence analysis (mode-appropriate tone)
  authorArchetype: string;    // 5-15 word archetype
  tags: string[];             // 3-5 tags
}
```

### Why this matters
- ResultsPanel, RadarChart, and ScoreBar all read from the array instead of hardcoded fields
- Adding future modes requires zero schema/component changes
- Dimension colors come from the result data, not hardcoded in types.ts

---

## 3. Pricing Model

### Free Tier
- 5 lifetime audits (across all modes)
- All 3 modes available
- Full results — no feature gating, no degraded experience
- Share/download included
- **Hard cutoff** when audits run out

### Paid Option A: Audit Pack (one-time)
- **10 audits for $5** ($0.50/audit)
- No expiration, no subscription commitment
- Targets the "I just want a few more" user
- **This is the lowest-friction first purchase**

### Paid Option B: Pro Subscription
- **$4/month** for unlimited audits across all modes
- Skip global rate limiting
- Future: audit history, shareable report links
- Targets power users and content creators

### Paywall UX
- Both options shown side-by-side when audits run out
- Per-audit cost comparison: "$0.50/audit vs. unlimited for $4/mo"
- Anchor the pack as "Most Popular" to reduce subscription anxiety
- Sign-in required for any purchase (builds email list)

### Conversion psychology
- 5 free audits → user tries all 3 modes → runs out fast
- Hard cutoff with clean paywall, no degraded experience
- Pack purchase feels low-risk → after 2+ packs, subscription is obvious

---

## 4. Implementation Details

### Prompt System Changes (src/lib/prompt.ts)

One base system prompt with mode-specific instruction blocks:
- Anti-injection guardrails stay consistent across all modes
- Mode-specific sections define: personality, dimensions, output tone, scoring criteria
- `buildUserMessage(text, mode)` includes mode in the request

### API Changes (src/app/api/vibe-audit/route.ts)

- Accept `mode` field in request body (default: "roast" for backward compat)
- Validate mode is one of: "roast" | "life-coach" | "professional"
- Pass mode to prompt builder
- Rate limiting logic extended:
  - Pro users: unlimited, bypass all limits
  - Users with audit_credits > 0: decrement 1 credit, no rate limit
  - Free users: 5 lifetime audits (tracked by user ID or IP in Redis)

### Database Changes (Supabase profiles table)

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS audit_credits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
```

- `plan`: "free" | "pro" (already exists)
- `audit_credits`: purchased one-time audits remaining
- Stripe fields for managing subscriptions

### UI Changes

**Mode selector** (src/components/VibeAuditTool.tsx):
- 3 tabs/segmented control above the textarea
- Visual differentiation per mode:
  - Roast: current purple/dark, flame icon
  - Life Coach: warm green/teal, plant/growth icon
  - Professional: clean blue/slate, briefcase icon
- Sample texts change per mode

**Results** (src/components/ResultsPanel.tsx):
- Read dimensions from array, not hardcoded fields
- Mode badge in results header
- Colors from dimension data

**RadarChart** (src/components/RadarChart.tsx):
- Accept dynamic labels and colors from result data
- No hardcoded dimension references

**Paywall modal** (new component):
- Shown when free audits exhausted
- Two CTAs: "Buy 10 Audits — $5" and "Go Pro — $4/mo"
- Sign-in prompt if not authenticated
- After purchase: redirect back, auto-submit pending text

### Stripe Integration

**Products to create:**
1. "Audit Pack" — one-time, $5
2. "Vibes Audit Pro" — recurring, $4/month

**New files:**
- `src/app/api/stripe/checkout/route.ts` — creates Checkout Session
- `src/app/api/stripe/webhook/route.ts` — handles events:
  - `checkout.session.completed` → activate purchase (set plan or add credits)
  - `customer.subscription.deleted` → downgrade to free
  - `invoice.payment_failed` → handle failed renewal

**Flow:**
1. User clicks upgrade → POST /api/stripe/checkout
2. Redirect to Stripe hosted checkout
3. Payment completes → Stripe webhook fires
4. Webhook updates profiles table
5. User redirected back to app

---

## 5. Build Order

### Phase 1: Mode System (~8 hours, no payments)
1. Restructure VibeResult schema to dimensions array
2. Write mode-specific prompt instructions
3. Update API route to accept mode parameter
4. Build mode selector UI
5. Update ResultsPanel + RadarChart to be mode-agnostic
6. Create per-mode sample texts
7. Update Zod validation
8. Test all three modes end-to-end

### Phase 2: Payments (~6 hours)
1. Set up Stripe account + products
2. Build checkout route
3. Build webhook endpoint
4. Update Supabase schema (audit_credits, stripe fields)
5. Update rate limiting for credits
6. Build paywall modal
7. Change free tier to 5 lifetime audits
8. Test both purchase flows

### Phase 3: Polish (~3 hours)
1. Update landing page copy + FAQ
2. Add "Pro" badge + remaining audits counter
3. Basic conversion tracking
4. Monitor and adjust

---

## 6. Cost Analysis

### Per-Audit API Cost
- Claude Sonnet: ~$0.003–0.01 per audit
- Audit pack ($5 for 10): $0.50/audit → ~98% gross margin
- Pro sub ($4/mo): breaks even at ~400 audits/month (nobody does this)

### Infrastructure
- Vercel: free tier for low traffic
- Supabase: free tier (50k MAU, 500MB)
- Upstash Redis: free tier (10k commands/day)
- Stripe fees: 2.9% + $0.30/transaction
  - On $5 pack: Stripe gets $0.45, you get $4.55
  - On $4/mo sub: Stripe gets $0.42, you get $3.58

### Break-even: 1 paying customer = profitable

---

## 7. Future Opportunities (post-launch)

- API tier ($19/mo) for developers integrating vibe-checking
- Chrome extension: vibe-check emails/Slack before sending
- Shareable report URLs (drives organic traffic)
- Custom dimensions for pro users
- Team plans for content teams
- Audit history + trend tracking

---

*Priority: get to first dollar as fast as possible. Phase 1 makes the product worth paying
for. Phase 2 lets people pay. Phase 3 maximizes conversion. Total estimated effort: ~17 hours.*
