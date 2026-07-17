# PROJECT.md — project brief

> Single source of truth for everything project-specific. The `set-project-structure` skill (and
> every later stage skill) reads this file. Endpoints and secrets do NOT go here — they go in
> `.env.local` (gitignored).

## Identity
- **Name / domain:** neon-app-template (working name; no domain yet)
- **One-liner:** A reusable Next.js foundation for building web apps on Neon's platform —
  Auth, Data API, Object Storage, and AI Gateway pre-wired.
- **Kind of app:** Template repository. Not a product — a clean starting point any project
  (SaaS, internal tool, AI app) can be built on.

## Business model
- None. This is a generic template; payments/plans/quotas are intentionally out of scope.
  Projects built on it add their own business model (and can add Stripe at that point).

## Design
- **Style adjectives:** clean, minimal, neutral — deliberately unopinionated so any brand can
  be layered on top.
- **Reference site(s):** none (template default look = stock shadcn/ui neutral theme).
- **Palette (Tailwind classes):** shadcn/ui default **neutral** base color (zinc/neutral grays,
  black/white). No brand primary — projects override in `globals.css` theme tokens.
- **Fonts:** body/readable = **Geist Sans**; mono/code = **Geist Mono** (via `next/font`,
  exposed as Tailwind font families). Projects swap display fonts later.
- **Constraint:** use Tailwind as-is (color classes, `rounded-*`, spacing). Do not invent a
  parallel design-token system.

## Data model
- **Entities:**
  - `profiles` — app-level profile keyed to the auth identity (FK → `neon_auth."user"`);
    display_name, avatar_url. One row per user, created on first login.
  - `assets` — object-storage metadata: user_id (FK → `neon_auth."user"`), object_key,
    content_type, size_bytes, kind. Rows point at objects in the Neon Object Storage bucket.
- **Timestamps:** `created_at` / `updated_at` on each entity.
- **Schema non-goals (explicit):** no billing/quota tables, no product entities, no referral
  system — those belong to projects built on the template, not the template itself.

## Stack & services
- **Framework:** Next.js 16 (App Router, `src/`, TypeScript, ESLint, `@/*` alias)
- **Enabled Neon services:** Auth ✓ · Data API ✓ · Object Storage ✓ · AI Gateway ✓
  (all currently Beta, region us-east-2)
- **AI gateway:** future use = whatever the project builds (chat, generation, extraction);
  default model id = `claude-haiku-4-5` (kept in `NEON_AI_GATEWAY_MODEL`, swappable).
  Accessed via Vercel AI SDK (`ai@^6`) + `@neon/ai-sdk-provider`.
- **Payments:** none (template non-goal; add Stripe per-project later).
- **ORM / DB tooling:** Drizzle ORM + drizzle-kit; `@neondatabase/serverless` driver.
- **UI libs:** Tailwind CSS v4, shadcn/ui (Base UI primitives, neutral theme).
- **Hosting:** Vercel (assumed default; nothing Vercel-specific hardcoded).

## Stages (the build roadmap — only the first is built by this skill)
1. Foundation ← this skill
2. Landing page (fills `(marketing)` route + `components/landing`)
3. App backend (wires auth flows, storage uploads, AI calls, business rules)
4. Dashboard (fills gated area + `components/dashboard`)
5. Deploy

## Gated areas
- **Routes requiring auth:** `/dashboard/*` → redirect to `/login`
