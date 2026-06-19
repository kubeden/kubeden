# PROJECT.md — project brief

> Single source of truth for everything project-specific. The `set-project-structure` skill (and
> every later stage skill) reads this file. Fill it once. **Endpoints and secrets do NOT go here**
> — they go in `.env.local` (gitignored). Inline `e.g.` notes are examples; replace them.

## Identity
- **Name / domain:** <!-- e.g. pastmonday.com -->
- **One-liner:** <!-- e.g. a calendar app -->
- **Kind of app:** <!-- e.g. SaaS web app with free/paid tiers -->

## Business model
<!-- Define plans/tiers and any usage limits. Be explicit about how allowances accrue/reset —
     this directly shapes the DB schema. Delete if the app has no billing. -->
- **Plans:**
  | Plan | Allowance |
  |------|-----------|
  | <!-- Free --> | <!-- e.g. 1 unit --> |
  | <!-- Pro -->  | <!-- e.g. 10/month; $X one-time top-up for 10 more --> |
  | <!-- Max -->  | <!-- e.g. unlimited --> |
- **One-time charges / top-ups:** <!-- e.g. $3 for +10 -->
- **Referral / bonus rules:** <!-- e.g. +1 unit per referred friend -->
- **Allowance model (drives schema):** <!-- e.g. monthly resetting quota + non-expiring credit
  balance; consume quota first, then credits -->

## Design
- **Style adjectives:** <!-- e.g. simple, elegant, professional, warm -->
- **Reference site(s):** <!-- e.g. https://www.pangram.com/ -->
- **Palette (Tailwind classes — primary/secondary/tertiary):** <!-- e.g. primary green; secondary
  orange; tertiary brown; base black/white/grays -->
- **Fonts:** body/readable = <!-- e.g. Inter -->; titles/display = <!-- e.g. Fraunces -->
- **Constraint:** use Tailwind as-is (color classes, `rounded-*`, spacing). Do not invent a
  parallel design-token system.

## Data model
<!-- List the entities the schema should scaffold and their key fields. Note scoping and FKs.
     Keep entry/content shapes as stubs if a later stage owns the detail. -->
- **Entities:**
  - `profiles` — app-level profile keyed to the auth identity (FK → auth user); <!-- e.g. email,
    plan, referral_code, referred_by -->
  - <!-- e.g. billing — monthly_quota, used_this_cycle, cycle_resets_at, extra_credits, stripe ids -->
  - <!-- e.g. <main entity> — scoped by user_id; stub fields, full shape in a later stage -->
  - <!-- e.g. referrals — referrer, referred, status, credit_granted -->
  - <!-- e.g. assets — object_key, content_type, size, kind (for object storage) -->
- **Timestamps:** include `created_at` / `updated_at` on each entity.
- **Schema non-goals (be explicit):** <!-- e.g. multiple calendars per user — out for now -->

## Stack & services
- **Framework:** <!-- e.g. Next.js (App Router, src/, TS) -->
- **Enabled Neon services:** <!-- Auth? Data API? Storage? AI Gateway? -->
- **AI gateway (if enabled):** future use = <!-- e.g. NL entry creation -->; default model id =
  <!-- e.g. claude-haiku-4-5 -->
- **Payments:** <!-- Stripe? portal + webhooks? -->
- **UI libs:** <!-- e.g. Tailwind, Framer Motion, Font Awesome (free, CDN), shadcn/ui -->
- **Hosting:** <!-- e.g. Vercel -->

## Stages (the build roadmap — only the first is built by this skill)
<!-- List stages so the foundation creates the right seams (component dirs, gated areas). Each
     later stage is a SEPARATE skill that reads this same brief. -->
1. Foundation <!-- this skill -->
2. <!-- e.g. Landing page -->
3. <!-- e.g. Dashboard (gated) -->
4. <!-- e.g. Payments -->
5. <!-- e.g. Deploy -->

## Gated areas
- **Routes requiring auth:** <!-- e.g. /dashboard/* → redirect to /login -->
