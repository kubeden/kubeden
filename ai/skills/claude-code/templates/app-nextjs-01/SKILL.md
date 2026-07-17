---
name: app-nextjs-01
description: >-
  Bootstrap a new web app from the kubeden `app-nextjs-01` template — Next.js 16 (App Router,
  src/, TS) with Neon Auth, Data API, Object Storage, and AI Gateway pre-wired as lazy typed
  clients, Drizzle schema FK'd into neon_auth, Tailwind v4 + shadcn/ui (neutral), and a
  proxy.ts route gate. Locates the template (local kubeden checkout, else GitHub), copies it
  into the target directory, re-identifies it (package name, PROJECT.md brief, metadata),
  installs, and verifies build + boot. Use to start any Neon-based project without
  re-scaffolding stage 1; the web-development set-* skills (landing, backend, dashboard)
  build on the result by reading the same PROJECT.md brief.
argument-hint: "[target-dir] [project-name]"
---

# templates/app-nextjs-01 — Neon web-app foundation, pre-built

This skill **replaces stage 1** (`set-project-structure`) with a copy of an already-verified
foundation. Everything that skill scaffolds — directory seams, DB schema, env keys,
placeholder clients, the route gate — already exists in the template and has passed
`npm run build`, dev boot, and `drizzle-kit generate`. Your job is to fetch it, re-identify
it, and verify it still builds — **not** to rebuild or "improve" it.

> **Mental model:** the template is a frozen, known-good stage-1 output. Project-specific
> truth lives in the copied `PROJECT.md` brief, exactly as in the set-* skill family: later
> stages read the brief, never this skill. Change the brief, not the foundation.

Template home: `templates/web-development/app-nextjs-01` in the **kubeden repo**
(`github.com/kubeden/kubeden`).

---

## Step 0 — Locate the template source

Try in order; stop at the first hit:

1. **Local checkout** (preferred — no network):
   `~/Developer/personal/kubeden/kubeden/templates/web-development/app-nextjs-01`, else
   `find ~/Developer -maxdepth 6 -type d -name app-nextjs-01 -path '*templates/web-development*' 2>/dev/null`
2. **Sparse clone** into a temp dir:
   ```bash
   git clone --depth 1 --filter=blob:none --sparse https://github.com/kubeden/kubeden <tmp>
   git -C <tmp> sparse-checkout set templates/web-development/app-nextjs-01
   ```
   If the repo is private over HTTPS, retry with `git@github.com:kubeden/kubeden.git`.
3. Neither works → **stop and ask** for a path or access; do not substitute
   `create-next-app` or rebuild the template from memory.

Sanity-check the source before copying: `src/proxy.ts`, `PROJECT.md`, `.env.example`, and
`src/lib/ai/gateway.ts` must all exist. A partial copy is worse than no copy.

## Step 1 — Target directory

- Missing → create it. Empty → use it.
- **Non-empty → stop and confirm** before writing anything; never merge the template over
  existing files.
- Note the git context: inside an existing repo the copy becomes part of that repo (do NOT
  `git init`); standalone, finish with `git init` + a baseline commit.

## Step 2 — Copy

Copy **template files only** — when the source is a live checkout someone may have run
installs in, exclude runtime debris:

```bash
tar -C <source> -cf - --exclude node_modules --exclude .next --exclude .env.local . \
  | tar -xf - -C <target>
```

The copy legitimately includes dotfiles: `.npmrc` (see below), `.gitignore`, `.env.example`,
`AGENTS.md`/`CLAUDE.md` (Next.js 16 agent rules — keep them).

**`.npmrc` matters:** it pins `before=<date>` — a deliberate override of a user-level npm
supply-chain date pin, and the reason `npm install` reproduces the template's exact
dependency set. Keep it. Bump its date only as a conscious act when upgrading dependencies.

## Step 3 — Re-identify (the template ships as "neon")

Ask the user for the project name if not given, then update:

1. `package.json` → `"name"`
2. `PROJECT.md` → the **Identity** section (name/domain, one-liner, kind of app). If this is
   a real product, walk the rest of the brief with the user (business model, design, data
   model, stages) the way `set-project-structure` would — the brief is what every later
   stage reads. If it is a sandbox/experiment, the generic brief is fine as-is.
3. `src/app/layout.tsx` → `metadata.title` / `metadata.description`
4. `src/app/(marketing)/page.tsx` → the placeholder `<h1>` text
5. `README.md` → title line (keep the rest; it documents the foundation)

Schema changes belong to later stages — extend `src/db/schema.ts` when a stage needs it,
via `npx drizzle-kit generate` (see the caveat below), not during bootstrap.

## Step 4 — Install and environment

```bash
npm install                  # .npmrc makes this reproduce the pinned tree
cp .env.example .env.local   # every key has a how-to-obtain comment
npx drizzle-kit migrate      # only once DATABASE_URL points at a real Neon branch
```

Filling `.env.local` requires a Neon project with **Auth**, **Data API** (per branch), an
**Object Storage** bucket, and an **AI Gateway** token — all Beta, currently `us-east-2`
only. The app intentionally builds and boots with an **empty** env; do not block bootstrap
on credentials.

## Step 5 — Verify (must pass before calling it done)

- `npm run build` succeeds — with an empty env; that is a feature, not luck.
- Dev server boots; probe:

  | Route | Expect |
  |---|---|
  | `/` and `/login` | 200 placeholders |
  | `/dashboard` (env empty) | 500 with a descriptive "Missing required config" from the auth SDK |
  | `/dashboard` (env set) | redirect to `/login` when unauthenticated |
  | `GET /api/assets` | 405 (only `POST` exists — a 501 upload seam) |

- Standalone target: `git init` + baseline commit. Inside a repo: commit only if asked.

---

## Context digest — what the copy contains

Read the copied `README.md` and `PROJECT.md` for the full picture; the load-bearing facts:

- **Clients** (`src/lib/`, all lazy so empty-env builds pass; they fail loudly with the
  SDK's own message on first real use): `auth/server.ts` `getAuth()`; `db/index.ts`
  `getDb()` (Drizzle over Neon HTTP driver); `data-api.ts` `createDataApiClient()`
  (PostgREST-style, browser-safe for RLS reads); `storage/client.ts` `getStorage()`
  (S3 SDK, `forcePathStyle`, endpoint from `AWS_ENDPOINT_URL_S3`); `ai/gateway.ts`
  `gatewayModel()` (Vercel AI SDK v6 + `@neon/ai-sdk-provider`, model id from
  `NEON_AI_GATEWAY_MODEL`).
- **Schema** (`src/db/schema.ts`): `profiles` and `assets`, both FK → `neon_auth."user"`
  (identity is Neon Auth's, never a parallel users table). Committed migration in
  `src/db/migrations/`.
- **Seams**: `(marketing)/` landing placeholder, gated `/dashboard`, `/login` (drop-in
  auth UI mounts there later), live auth handler at `/api/auth/[...path]`, 501
  `POST /api/assets`, empty `components/landing/` + `components/dashboard/`,
  `src/proxy.ts` gate (`/dashboard/*` → `/login`).
- **Conventions**: server-authoritative mutations (Data API is for reads); Tailwind
  as-is, no parallel token system; shadcn components into `components/ui/`.

**Caveats that will bite if forgotten:**

1. **`neon_auth` is read-only.** drizzle-kit `generate` ignores `schemaFilter` and will
   emit `CREATE TABLE "neon_auth"."user"` on a from-scratch generate — delete that
   statement from the SQL. The committed 0000 migration already has it removed; the
   snapshot prevents incremental generates from re-adding it.
2. **`ai` is pinned to v6** because `@neon/ai-sdk-provider` peer-depends on `ai@^6`.
   Do not "upgrade" to `ai@7+` until the provider does.
3. All four Neon services are **Beta, `us-east-2` only**; APIs may drift — pins are exact.
4. `npm audit` reports advisories in `better-auth` *inside* Neon's beta auth SDK — not
   fixable downstream; recheck when Neon bumps `@neondatabase/auth`.

## Composition

After bootstrap the project is exactly where `set-project-structure` leaves off: continue
with `set-landing-page` → `set-app-backend` → `set-dashboard`, all reading the copied
`PROJECT.md`.

## Refusals

- **No re-scaffolding.** Never run `create-next-app` or `shadcn init` over the copy; the
  template exists so those decisions stay made.
- **No dependency upgrades during bootstrap.** The pins are the tested state; upgrades are
  a separate, deliberate task (start by bumping `.npmrc`'s `before=` date).
- **No DDL against `neon_auth`**, ever (caveat 1).
- **No committing `.env.local`** — `.gitignore` already excludes it; only `.env.example`
  is tracked.
