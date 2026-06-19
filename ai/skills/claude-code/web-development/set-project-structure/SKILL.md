---
name: set-project-structure
description: >-
  Scaffold the foundation (stage 1) of a modern web app — Next.js (App Router, src/, TS) with
  Neon (Auth / Data API / Storage / AI Gateway), Drizzle, Stripe, Tailwind + shadcn/ui, on
  Vercel. Reads project specifics from a PROJECT.md brief in the target repo (generates it via
  Q&A if missing), verifies current/compatible versions, lays the directory structure, DB
  schema, env keys, design tokens, and placeholder clients, then STOPS at an approval gate
  before building any UI. Use at the very start of a new web project, before landing/dashboard
  work. Does not build features — only the foundation/seams.
---

# Set Project Structure — web app foundation

This skill builds **only the foundation** of a web app: an initialized, well-structured
Next.js project that *anticipates* later work (landing page, dashboard, payments, deploy)
without building any of it. Later stages are **separate skills that read the same brief** — so
adding them never requires editing this one.

> **Mental model:** this skill is the reusable *HOW*. Everything project-specific (the *WHAT*:
> name, business model, design, schema) lives in a **`PROJECT.md` brief** in the target repo.
> Endpoints and secrets live in `.env.local`. Never hardcode project specifics in this skill.

---

## Step 0 — Load the project brief (required first)

Look for **`./PROJECT.md`** in the target repository root.

- **If present:** read it. It is the single source of truth for every project-specific value
  below (identity, business model, design tokens, data model, which services are enabled).
- **If absent:** generate it. Ask the user the questions from `PROJECT.template.md` (shipped
  beside this skill), write `PROJECT.md`, and **confirm it with the user before proceeding.**

Wherever this skill says "*per the brief*," read the value from `PROJECT.md` — do not invent or
assume it.

---

## Operating principles (apply throughout)

1. **Build less.** Foundation only. Create *seams* — empty dirs, schema stubs, env keys,
   placeholder clients — not features. Honor the Out-of-Scope list. When in doubt, build less.
2. **Verify, don't trust memory.** Websearch current stable versions and the current Neon
   service APIs/packages before installing. Report what you find. (Last-known patterns are in
   the Knowledge Appendix — a starting point, not gospel.)
3. **Get the contracts right.** Later stages depend on four stable contracts: **directory
   layout, DB schema, env keys, design tokens.** The **schema is the highest-coupling contract**
   (payments + dashboard lean on it hardest) — invest care there.
4. **Server-side enforcement.** Route any mutation that touches business rules (quotas,
   billing, referrals) through our own API routes. Never trust the client.

---

## Procedure

### 1. Load/generate the brief
Per Step 0.

### 2. Prepare the environment (OS-aware)
- Detect the package manager: **homebrew / apt / yum / pacman**.
- Prefer an **existing recent Node** (current LTS or newer). Install only if Node is missing or
  too old, and **never clobber a working version**.
- **Bare-machine edge case:** assume the user may have *nothing but this agent*. If even the
  package manager itself is absent (e.g. no Homebrew on macOS), install it first, then Node/npm,
  then proceed. Walk through every prerequisite the project needs.

### 3. Verify versions & compatibility (websearch)
- Confirm the latest **stable, secure** versions AND **mutual compatibility** for the whole
  stack per the brief's enabled technologies.
- ⚠️ **Highest-risk axis: Next.js ↔ shadcn/ui ↔ Tailwind major versions** — they break across
  majors. Pin a mutually compatible set; don't just grab "latest" of each.
- Confirm the **current Neon service packages/APIs** for each enabled service (see Knowledge
  Appendix for last-known patterns and the gotchas to check).

### 4. Approval gate — STOP and wait
Present a plan and **wait for explicit approval. Run nothing until approved.** The plan must state:
1. Exact versions you'll pin and **why they're mutually compatible** (call out Next ↔ shadcn ↔ Tailwind).
2. What you found about each enabled **Neon service** (Auth / Data API / Storage / AI Gateway) —
   exact packages, and whether each is GA or early-access — and how that affects scaffolding.
3. Which **Next.js major** → therefore whether the gate file is `proxy.ts` or `middleware.ts`.
4. The final **directory tree**.
5. The full **list of env keys** you'll write.
6. The exact **install / init commands** (incl. OS-aware prerequisite handling).
7. Anything you're **unsure about** or assuming.

### 5. Scaffold (only after approval)
- **Init Next.js** — App Router, `src/`, TypeScript, ESLint; path alias `@/*`.
- **Directory structure** — per the generic tree below; create one component dir per *stage*
  the brief lists (e.g. `components/landing`, `components/dashboard`).
- **Design tokens (from the brief)** — wire the palette into the Tailwind theme; wire the body
  and display fonts via `next/font` and expose them as Tailwind font families. **Use Tailwind
  as-is** (its color classes, `rounded-*` scale, spacing) — do **not** invent a parallel token
  system. Initialize **shadcn/ui** (components land in `components/ui/`).
- **DB schema (from the brief)** — Drizzle schema for the brief's entities, scoped by user id,
  with FKs into the auth identity table (see Knowledge Appendix). `drizzle-kit` must **generate
  a migration without error**.
- **Env files** — `.env.local` with every required key, each preceded by a comment on **how to
  obtain it**; `.env.example` with the same keys but empty values. Ensure `.env*` (except
  `.env.example`) is gitignored.
- **Placeholder clients** in `lib/` for each enabled service — auth, data API, storage, AI
  gateway, Stripe, gravatar (avatar). They must import cleanly and type-check, with **no logic**.
- **Gate file** — `proxy.ts` (Next.js 16+) or `middleware.ts` (earlier) — redirect
  unauthenticated requests for protected routes (per the brief, e.g. `/dashboard/*`) to the
  login route. A minimal redirect stub is enough.

### 6. Verify & commit
- `npm run build` **succeeds**, dev server boots, migration generates, placeholders type-check.
- If already inside a git repo, **do not re-init** — just ensure `.gitignore` covers
  `node_modules`, `.env*` (except `.env.example`), `.next`, and build output, then commit the
  scaffold as a clean baseline.

---

## Definition of Done

1. Project initializes; **`npm run build` succeeds**; dev server boots cleanly.
2. Directory tree exists with **placeholder files** (no real UI).
3. Drizzle schema exists and **`drizzle-kit` generates a migration without error**.
4. `.env.local` + `.env.example` exist with **documented** keys for every enabled service.
5. Tailwind theme has the brief's palette + fonts wired; **shadcn/ui** initialized.
6. The gate file (`proxy.ts` / `middleware.ts` per Next major) redirects protected routes to login.
7. Placeholder clients for every enabled service import cleanly and type-check.

## Out of scope — do NOT build in this stage
Landing/dashboard UI; real auth flows beyond the redirect gate stub; Stripe webhook logic;
quota/credit/referral enforcement; any real LLM call or asset upload. **Placeholders only.**

---

## Generic directory structure

```
src/
  app/
    (marketing)/            # landing — a later stage fills this
    <gated-area>/           # e.g. dashboard — a later stage fills this; gated by middleware/proxy
    login/                  # auth entry point
    api/
      auth/[...path]/        # auth handler
      assets/                # presigned-upload route placeholder (object storage)
      stripe/webhook/        # webhook placeholder (if payments enabled)
      ...                    # our server-side business-rule routes
    layout.tsx
    globals.css
  components/
    <stage>/                # one dir per stage in the brief (landing, dashboard, ...)
    ui/                     # shadcn/ui components
  lib/
    auth/server.ts          # auth instance
    db/                     # drizzle client
    data-api.ts             # HTTP data API client (if enabled)
    storage/                # S3-compatible object-storage client (if enabled)
    ai/gateway.ts           # AI gateway client placeholder (if enabled)
    avatar.ts               # identicon/avatar helper
    stripe.ts               # stripe client + price-id map (if payments enabled)
  db/
    schema.ts               # drizzle schema
    migrations/             # drizzle-kit output
  proxy.ts / middleware.ts  # gate protected routes (filename per Next major)
```

Keep components for each stage in **separate directories** under `components/`.

---

## Env key template (generate only for services the brief enables)

Key *names* are durable; values are per-project (→ `.env.local`, never committed). Adjust names
to match current docs.

```ini
# --- Database (provider connection string) ---
DATABASE_URL=

# --- Auth (generate cookie secret with: openssl rand -base64 32) ---
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=

# --- Data API (HTTP/PostgREST) ---
NEON_DATA_API_URL=
NEON_AUTH_URL=                  # auth/JWKS URL the data API client uses

# --- Object storage (S3-compatible). AWS SDK auto-reads these AWS_* vars. ---
AWS_ENDPOINT_URL_S3=            # storage endpoint (service-specific endpoint override)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=                  # bucket/namespace (passed in code, not auto-read)

# --- AI gateway (used via Vercel AI SDK + provider). Provider keys NOT required. ---
NEON_AI_GATEWAY_BASE_URL=
NEON_AI_GATEWAY_TOKEN=
NEON_AI_GATEWAY_MODEL=          # default model id; swappable

# --- Account/management API key (optional; provisioning/management, not per-request) ---
NEON_API_KEY=

# --- Optional: direct provider keys (BYOK / fallback). NOT needed when using the gateway. ---
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=

# --- Payments (if enabled) ---
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
# + one price-id var per plan/one-time charge defined in the brief, e.g.
# STRIPE_PRICE_<PLAN>=

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Knowledge Appendix — current integration patterns

> Captured 2026-06-19. **A starting point, not gospel — re-verify at runtime** (Step 3). Provided
> so the agent knows what "good" looks like and can detect drift.

- **Next.js 16:** `middleware.ts` → **`proxy.ts`** (Node.js runtime; exported function renamed
  `proxy`). `middleware.ts` deprecated but still works for Edge. **Detect the Next major and use
  the right file** — don't blindly create `middleware.ts`.
- **Neon Auth (current):** packages `@neondatabase/auth` (+ `@neondatabase/auth-ui`,
  `@neondatabase/serverless`). Single **`createNeonAuth()`** API (replaced older `neonAuth()` /
  `authApiHandler()` / `neonAuthMiddleware()` / `createAuthServer()`). Instance in
  `lib/auth/server.ts`; handler at `app/api/auth/[...path]/route.ts` (`auth.handler()`);
  protection via `auth.middleware({ loginUrl })`. Env: `NEON_AUTH_BASE_URL`,
  `NEON_AUTH_COOKIE_SECRET`. Identity lives in the **`neon_auth` schema** (e.g. `neon_auth.user`);
  **app tables FK into it** — do not create a parallel identity table, only an app-level profile
  that references it. Server components using auth need `export const dynamic = 'force-dynamic'`.
- **Neon Data API (current):** PostgREST-compatible (Rust reimplementation). `@neondatabase/neon-js`
  (`createClient({ auth, dataApi })`) with Neon Auth, or `@neondatabase/postgrest-js` otherwise.
  Enabled at **branch level**. RLS via `auth.user_id()` matching the JWT `sub`. Use it for simple
  authenticated reads, but make **our own API routes** authoritative for business-rule mutations.
  (URL pattern `…apirest…/<db>/rest/v1` is the Data API — not storage.)
- **Object storage (S3-compatible, e.g. Neon Storage):** use the **AWS S3 SDK**
  (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`). It **auto-reads** `AWS_ENDPOINT_URL_S3`
  (service-specific endpoint override → points the client at the provider instead of AWS),
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`. Bucket passed in code
  (`AWS_S3_BUCKET`). Store **asset metadata rows in Postgres** (an `assets` table) pointing at
  object keys. Ship-with-app static images go in `public/`; storage is for dynamic/uploaded assets.
- **AI gateway (e.g. Neon AI Gateway):** use the **Vercel AI SDK** (`ai`) with the provider
  package **`@neondatabase/ai-sdk-provider`** — NOT the OpenAI SDK. Select model via `neon('<model-id>')`:

  ```ts
  // lib/ai/gateway.ts — placeholder, not called in this stage
  // env: NEON_AI_GATEWAY_BASE_URL, NEON_AI_GATEWAY_TOKEN
  import { generateText } from 'ai';
  import { neon } from '@neondatabase/ai-sdk-provider';
  const { text } = await generateText({ model: neon('claude-haiku-4-5'), prompt: '...' });
  ```

  The gateway **manages provider credentials** (built on ngrok tech) — `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY` are **not required** (BYOK optional). **Confirm the provider package name at
  install** (new; an OpenAI-SDK + `/ai-gateway/mlflow/v1` path also exists, but the AI-SDK path is
  preferred). Keep the model id in `NEON_AI_GATEWAY_MODEL` so it's swappable.

**Sources (re-fetch for current truth):**
- Next.js 16 middleware→proxy: https://nextjs.org/docs/messages/middleware-to-proxy
- Neon Auth + Next.js: https://neon.com/guides/neon-auth-nextjs
- Neon Data API: https://neon.com/docs/data-api/get-started
- Neon AI Gateway: https://neon.com/docs/ai-gateway/get-started
- Vercel AI SDK providers: https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway
- Neon S3-compatible storage patterns: https://neon.com/docs/guides/aws-s3 , https://neon.com/guides/next-upload-aws-s3
- AWS service-specific endpoints (`AWS_ENDPOINT_URL_S3`): https://docs.aws.amazon.com/sdkref/latest/guide/feature-ss-endpoints.html
