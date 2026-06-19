# PROJECT.md — pastmonday.com (worked example)

> A filled brief for the `set-project-structure` skill. Copy to a target repo as `PROJECT.md`.
> Endpoints/secrets are NOT brief content — they live in `.env.local`. Real (non-secret) endpoint
> URLs discovered for this project are recorded at the bottom for convenience when filling `.env.local`.

## Identity
- **Name / domain:** pastmonday.com
- **One-liner:** a calendar app
- **Kind of app:** SaaS web app with free/paid tiers

## Business model
- **Plans:**
  | Plan | Allowance |
  |------|-----------|
  | Free | 1 calendar entry |
  | Pro  | 10 entries / month (resets each cycle); when exhausted, $3 one-time top-up for +10, or upgrade |
  | Max  | unlimited entries |
- **One-time charges / top-ups:** $3 → +10 entries
- **Referral / bonus rules:** referring a friend grants +1 entry
- **Allowance model (drives schema):** monthly resetting **quota** + non-expiring **credit
  balance**; top-ups +10 credits, referrals +1 credit; consume monthly quota first, then credits

## Design
- **Style adjectives:** simple, elegant, professional, warm — the energy of *writing*
- **Reference site(s):** https://www.pangram.com/
- **Palette:** primary = **green** (pangram uses orange; ours is green); secondary = orange;
  tertiary = brown; base = black / white / grays. Other colors where they genuinely serve a purpose.
- **Fonts:** body/readable = **Inter**; titles/display = **Fraunces** (`next/font`, exposed as
  Tailwind families e.g. `font-sans` / `font-display`)
- **Constraint:** use Tailwind as-is. No parallel design-token system.

## Data model
- **Entities:**
  - `profiles` — FK → `neon_auth.user`; email (for avatar), `plan` (`free|pro|max`),
    `referral_code` (unique), `referred_by` (nullable FK → profile)
  - `billing` — `monthly_quota`, `used_this_cycle`, `cycle_resets_at`, `extra_credits`,
    `stripe_customer_id`, `stripe_subscription_id`
  - `calendar_entries` — scoped by `user_id`; stub fields: `title`, `description`, `color`,
    `start_at`, `duration` (full shape in the Dashboard stage)
  - `referrals` — `referrer_id`, `referred_id`, `status`, `credit_granted`
  - `assets` — `user_id` (nullable), `object_key`, `content_type`, `size`, `kind`
- **Timestamps:** `created_at` / `updated_at` on each.
- **Schema non-goals:** multiple calendars per user — out for now (single implicit calendar).

## Stack & services
- **Framework:** Next.js (App Router, `src/`, TypeScript, ESLint)
- **Enabled Neon services:** Auth ✓, Data API ✓, Storage ✓, AI Gateway ✓
- **AI gateway:** future use = NL entry creation / summaries; default model id = `claude-haiku-4-5`
- **Payments:** Stripe — billing portal + webhooks; prices for Pro, Max, and the $3 top-up
- **UI libs:** Tailwind, Framer Motion, Font Awesome (free, CDN), shadcn/ui
- **Hosting:** Vercel

## Stages
1. Foundation ← this skill
2. Landing page
3. Dashboard (gated)
4. Payments
5. Deploy

## Gated areas
- **Routes requiring auth:** `/dashboard/*` → redirect to `/login`

---

## Environment values (for `.env.local`, not committed)
Endpoints are not secrets; tokens/keys are — keep tokens blank in committed files.
- `NEON_DATA_API_URL=https://ep-solitary-moon-ajs19s3p.apirest.c-3.us-east-2.aws.neon.tech/neondb/rest/v1`  (Data API / PostgREST)
- `AWS_ENDPOINT_URL_S3=https://br-withered-violet-aj4v226j.storage.c-3.us-east-2.aws.neon.tech`  (Storage S3 endpoint)
- `NEON_AI_GATEWAY_BASE_URL=https://br-withered-violet-aj4v226j-api.ai.c-3.us-east-2.aws.neon.tech`
- `AWS_REGION=us-east-2`
- `NEON_AI_GATEWAY_MODEL=claude-haiku-4-5`
- Tokens/keys to fill yourself: `NEON_AUTH_COOKIE_SECRET` (`openssl rand -base64 32`),
  `NEON_AI_GATEWAY_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`,
  `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_URL`, Stripe keys + price ids.
