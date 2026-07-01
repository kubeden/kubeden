---
name: set-app-backend
description: >-
  Wire the backend (stage 3) of a web app whose foundation already exists (see
  set-project-structure). Turns every placeholder seam — auth, calendar/data + quota, object
  storage, AI gateway + token metering, Stripe payments — into a working, server-authoritative
  backend, with a schema delta + migration for anything the foundation left out (AI usage, entry
  attachments, webhook idempotency). Reads project specifics from PROJECT.md. Mounts the drop-in
  auth UI on /login so auth is testable, but builds NO bespoke UI — it exposes clean endpoint +
  server-helper contracts that the dashboard stage (set-dashboard) consumes. STOPS at one plan
  gate before building. Use after the landing stage, before the dashboard UI. The correctness
  half of the app: money and limits must be exactly right.
---

# Set App Backend — wire the seams into a server-authoritative app

This skill builds **only the backend** (stage 3). It assumes the foundation skill
(`set-project-structure`) already laid the seams: the `neon_auth`-referencing Drizzle schema,
the placeholder `lib/` clients, the 501 API routes, the auth handler + `proxy.ts` gate, a
`PROJECT.md` brief, and `.env.local` keys. The dashboard UI is a **separate later skill**
(`set-dashboard`) that reads the same brief and consumes this stage's contracts — adding it never
edits this one.

> **Mental model:** the foundation skill created *seams*; the landing skill was about *taste*.
> **This skill is about correctness under money and limits** — where a client-trusted quota check,
> an unverified webhook, a non-idempotent credit top-up, or a metered LLM call that spends before
> it checks are the failures that actually cost the user. Every rule that touches a quota, a
> credit, a token budget, or a dollar is enforced **on our server, never on the client.** This
> skill builds no dashboard; it builds the contracts the dashboard will stand on.

---

## Step 0 — Load the brief & verify the foundation (required first)

1. Read **`./PROJECT.md`** in the target repo. It is the single source of truth for identity,
   business model / plans, allowance model, entities, and which Neon services are enabled.
   Wherever this skill says "*per the brief*," read it from `PROJECT.md` — never invent it.
2. **Verify the foundation contracts exist** before wiring anything:
   - Drizzle schema with the brief's entities FK'd into `neon_auth.user`; `drizzle-kit` runs.
   - Placeholder `lib/` clients (`auth/server.ts`, `db/`, `data-api.ts`, `storage/`, `ai/gateway.ts`,
     `stripe.ts`, `avatar.ts`) that import + type-check.
   - The auth handler (`app/api/auth/[...path]/route.ts`) and the gate file (`proxy.ts` /
     `middleware.ts`) protecting the brief's gated routes.
   - The 501 business/asset/webhook route placeholders and `.env.local` keys for every enabled service.
   If these are missing, **stop** and tell the user to run the foundation skill first. This skill
   wires seams; it does not lay foundation.
3. **Resolve the brief's one likely gap — AI allowance per plan.** The foundation's business model
   usually meters the *primary entity* (e.g. calendar entries), not AI tokens. If `PROJECT.md` does
   not state a **per-plan AI token allowance**, ask the user, propose sensible defaults (a small
   trial for Free, a generous cycle budget for paid, effectively-unlimited for the top tier), and
   **write it into `PROJECT.md`** before proceeding. Business numbers live in the brief, never
   hardcoded in this skill.

---

## Operating principles (apply throughout)

1. **Server-authoritative, always.** Every mutation that touches a business rule — quota, credit,
   token budget, plan, dollar — runs in our own route handler / server action behind
   `requireUser()`. The client may *request*; it never *decides*. Reads that gate features (what
   plan am I, how much quota is left) are also server-resolved.
2. **Enforce before you spend.** Check the quota before the write; check the token budget before the
   LLM call; verify the webhook signature before you trust a cent. Never spend-then-check.
3. **Make money idempotent.** Webhooks retry and arrive out of order. Any handler that *increments*
   (credits, tokens) must dedupe on the provider event id; handlers that *set absolute state*
   (plan, subscription id) are naturally safe. Assume every event can arrive twice.
4. **Guard against races.** Two concurrent requests must not both pass the same last-unit quota
   check. Consume with an **atomic conditional update** (`UPDATE … WHERE used < quota RETURNING`)
   or a row lock inside a transaction — never read-then-write across an `await` boundary.
5. **Verify, don't trust memory.** Websearch the *current* Neon Auth / Auth-UI / Data API / AI
   provider / Stripe SDK APIs before wiring each one — they move. The Knowledge Appendix is
   last-known truth and a drift detector, not gospel. Report what you find.
6. **Fail closed, surface honestly.** When quota/budget is exhausted, return a typed `402` the UI
   can act on (upgrade / top-up) — never a silent success or a 500. Log server-side; leak no secrets.
7. **No bespoke UI.** Mount only the drop-in auth UI so flows are testable end-to-end. The
   dashboard, modals, chat surface, and all taste belong to `set-dashboard`. Stay in your lane.

---

## Procedure

### 1. Load brief & verify foundation
Per Step 0, including resolving the AI-allowance gap into the brief.

### 2. Verify current service APIs (websearch — do before planning)
Confirm, for each enabled service, the **current** package + API surface, and note any drift from
the Appendix:
- **Neon Auth:** the session-reading API for server code (e.g. `auth.getSession()` /
  `auth.api.getSession()`), the sign-in/sign-up components in `@neondatabase/auth-ui`, and the
  sign-out call. Confirm identity table shape (`neon_auth.user`: `id`, `email`, name fields).
- **AI provider:** whether **`@neondatabase/ai-sdk-provider`** is installable now (the foundation
  flagged it was blocked by an npm registry time-cap). If yes, use it (`neon('<model>')`). If still
  blocked, use the **AI-SDK OpenAI-compatible provider** (`@ai-sdk/openai`'s `createOpenAI`) pointed
  at `NEON_AI_GATEWAY_BASE_URL` with `NEON_AI_GATEWAY_TOKEN`. Confirm the `usage` field names for
  the installed **`ai`** major (v5+: `inputTokens`/`outputTokens`; older: `promptTokens`/`completionTokens`).
- **Stripe:** the pinned SDK major and its default API version; Checkout Session + Billing Portal +
  `webhooks.constructEvent` signatures; how to read the **raw** request body in this Next major.
- **Neon Data API / Storage:** the `@neondatabase/neon-js` `createClient({ auth, dataApi })` shape,
  and the S3 presigner call (`getSignedUrl` + `PutObjectCommand`).

### 3. Gate — STOP and wait (present the backend plan)
Present and **wait for explicit approval. Wire nothing until approved.** The plan must state:
1. **Schema delta** — the exact new tables/columns and the migration you'll generate (see §5.1).
2. **Plan-limits map** — the per-plan entry allowance *and* AI-token allowance (from the brief),
   expressed as the single code constant that both enforcement and billing read.
3. **Endpoint inventory** — every route/action, its method, its auth, and its **enforcement rule**.
4. **AI provider resolution** — which path you confirmed in §2, and the `usage` field names.
5. **Webhook event map** — each Stripe event → the exact state change, and the **idempotency mechanism**.
6. **Cycle model** — how the monthly quota + AI budget reset (lazy-on-access vs `invoice.paid`), and
   how the two interact.
7. Anything you're **unsure about or assuming** (esp. Neon Auth session/UI API names).

### 4. Schema delta + migration (highest coupling — do first)
Everything downstream depends on the schema. Extend the foundation's `db/schema.ts` **additively**
(don't rewrite it), then generate **one** migration.

**4.1 Add (adapt names to the brief):**
- **`ai_usage`** — per-call metering: `user_id` (FK → `neon_auth.user`), `tokens_in`, `tokens_out`,
  `model`, optional `kind`/`request_id`, `created_at`.
- **AI-budget columns on `billing`** — `ai_tokens_quota` (from the plan-limits map),
  `ai_tokens_used_cycle` (resets with the entry cycle). Keep them beside the existing
  `monthly_quota` / `used_this_cycle` / `cycle_resets_at` so one cycle reset covers both.
- **Attachment link on the primary entity** — e.g. `calendar_entries.asset_id` (nullable FK →
  `assets.id`, `on delete set null`) per the storage decision in the brief.
- **`processed_stripe_events`** (or equivalent) — `event_id` primary key, `type`, `created_at` — the
  idempotency ledger for incrementing webhook handlers.

**4.2 Generate + verify:** `drizzle-kit generate` produces a clean migration; `drizzle-kit migrate`
(or `push` per the project's convention) applies it without error. Do **not** hand-edit generated SQL.

### 5. Wire the backend (only after approval)

**5.1 Auth flows.**
- **Login:** replace the `/login` stub with the Neon **Auth-UI** sign-in/sign-up component. This is
  the *only* UI this skill ships; keep it a thin mount, no bespoke styling beyond the wired tokens.
- **Session helpers** (`lib/auth/*`): `requireUser()` (resolve the current Neon Auth user or
  redirect/401), and `getOrCreateProfile(user)` — a **provisioner** that, on first authenticated
  request, inserts the `profiles` row (email, `plan=free`, generated unique `referral_code`,
  `referred_by` from a `?ref=` cookie) **and** the `billing` row (entry + AI quotas from the
  plan-limits map, `used=0`, `extra_credits=0`). Make it idempotent (upsert / `on conflict do nothing`).
- **Referral grant:** when `referred_by` is set on first provision, create the `referrals` row and
  grant the *referrer* the bonus credit — **once** (guard on `credit_granted`), and **reject
  self-referral**. Grant sits behind the same server rules as every other credit mutation.
- **Logout:** a server action that calls Neon Auth sign-out and clears the session (consumed by the
  dashboard dropup later).

**5.2 Primary-entity CRUD + quota (the core enforcement).**
- Routes/actions for the brief's primary entity (e.g. `app/api/entries` — create / edit / delete),
  every one scoped by `user_id` from `requireUser()` (never a client-supplied id).
- **Create** runs the allowance gate, atomically (principle 4):
  1. **Lazy cycle reset** — if `cycle_resets_at` is null or past, reset `used_this_cycle` **and**
     `ai_tokens_used_cycle` to 0 and set the next `cycle_resets_at`.
  2. **Consume** — quota first, then credits: if `plan==='max'` allow (unlimited, no decrement);
     else if `used_this_cycle < monthly_quota` increment used; else if `extra_credits > 0` decrement
     credits; else **fail closed with `402`** (`{ reason: 'quota_exhausted', canTopUp, canUpgrade }`).
  3. Only on success insert the entry — in the **same transaction** as the consume.
- **Edit/Delete:** ownership-checked; deletes do **not** refund quota (allowance is consumption, not
  a live count) unless the brief says otherwise — state the choice.
- Expose a **`getBillingState()`** read helper returning `{ plan, entriesUsed, entriesLimit,
  creditsRemaining, cycleResetsAt, aiTokensUsed, aiTokensLimit }` — the shape the dashboard renders.

**5.3 Object storage (per the brief's storage decision).**
- `app/api/assets` (POST): behind `requireUser()`, validate `contentType` against an allowlist,
  return a **presigned PUT** (`getSignedUrl(s3, new PutObjectCommand({ Bucket: S3_BUCKET, Key,
  ContentType }), { expiresIn })`) with a scoped key (e.g. `users/${userId}/entries/${id}/${uuid}`),
  and insert the `assets` metadata row linked to the entity (`asset_id`).
- **Size can't be enforced on a presigned PUT** — either use a presigned **POST** with a
  `content-length-range` policy, or verify size via a `HeadObject` after upload and reject/delete
  oversize objects. Pick one and say which. Never serve user objects from a public bucket if the
  brief implies privacy — presign reads too.

**5.4 AI gateway + token metering.**
- Wire `lib/ai/gateway.ts` with the provider path confirmed in §2. Keep the **model id in
  `NEON_AI_GATEWAY_MODEL`** so it's swappable.
- `app/api/chat` (POST, streaming): behind `requireUser()`.
  1. **Budget gate before the call** — if `ai_tokens_used_cycle >= ai_tokens_quota` (and not the
     unlimited tier) → `402` (`reason: 'ai_budget_exhausted'`). Set a **`maxOutputTokens` cap** so a
     single call's overage is bounded.
  2. **Inject calendar context** — fetch *this user's* entries for a bounded window and format them
     into the system prompt (scoped to the user only; keep the context within a token budget).
  3. **Stream** via the AI SDK (`streamText`), and in **`onFinish`** read `usage`, insert an
     `ai_usage` row, and increment `ai_tokens_used_cycle` (`tokens_in + tokens_out`). Metering
     happens on finish, not before — record actuals.
- Note: Neon AI Gateway also tracks tokens/cost server-side for observability, but **in-app
  enforcement is ours** — the gateway dashboard is not the quota.

**5.5 Payments (Stripe).**
- **`app/api/stripe/checkout`** (POST, `requireUser()`): create a Checkout Session — `mode:
  'subscription'` for plan prices (`STRIPE_PRICE_PRO/MAX`), `mode: 'payment'` for the one-time
  top-up (`STRIPE_PRICE_TOPUP`). Attach/create the Stripe customer, store `stripe_customer_id`, and
  put `{ userId, kind }` in `metadata`. Return the URL.
- **`app/api/stripe/portal`** (POST, `requireUser()`): `billingPortal.sessions.create({ customer,
  return_url })` — where the user manages / cancels the subscription.
- **`app/api/stripe/webhook`** (POST, **no auth**, **raw body**): `constructEvent(rawBody, sig,
  STRIPE_WEBHOOK_SECRET)`; reject bad signatures with `400`. **Dedupe on `event.id`** via
  `processed_stripe_events` before any increment. Handle:
  | Event | State change |
  |-------|--------------|
  | `checkout.session.completed` | subscription → set `plan`, store `subscription_id`, set entry + AI quotas from the plan-limits map. payment (top-up) → `extra_credits += N` (**idempotent**). |
  | `customer.subscription.updated` | reconcile `plan`/quotas from the price; honor `cancel_at_period_end`. |
  | `customer.subscription.deleted` | downgrade to `free`, reset quotas to the free tier. |
  | `invoice.paid` / `payment_succeeded` | renew the cycle: reset `used_this_cycle` + `ai_tokens_used_cycle`, advance `cycle_resets_at`. |
  - Keep the **plan → (entry quota, AI quota) map** as one code constant; map Stripe **price ids →
    plan** from env. Never derive plan from client input.

**5.6 Data API (optional).** Prefer server routes/actions (Drizzle + `requireUser()`) for
authoritative reads too, for one consistent enforcement path. If the brief wants direct
authenticated client reads, wire `createDataApiClient()` with the Neon Auth adapter — but that
requires **RLS policies** (`auth.user_id()` = row owner) on the exposed tables; note that as a Neon
console/SQL step and keep all *mutations* in our routes regardless.

### 6. Verify end-to-end & commit
- `npm run build` succeeds; `tsc --noEmit` clean; `drizzle-kit generate` yields no pending diff.
- **Auth:** sign up → a `profiles` + `billing` row is provisioned exactly once; sign out works.
- **Quota:** creating past the allowance returns the typed `402`; a top-up/upgrade path restores it;
  concurrent creates never over-consume (race check).
- **Storage:** presign → client PUT → object lands under the scoped key → `assets` row links it.
- **AI:** chat streams with calendar context; `ai_usage` rows accrue; exceeding the budget `402`s.
- **Stripe:** drive the webhook with the **Stripe CLI** (`stripe listen` / `trigger`) — signature
  verifies, a replayed event is a no-op (idempotency), plan/credits/cycle update correctly.
- Commit as its own clean change on top of the landing baseline. **Touch no dashboard UI.**

---

## Definition of Done
1. `npm run build` + `tsc --noEmit` pass; the migration generates cleanly and applies.
2. **Auth works end-to-end:** Auth-UI login mounts; provisioning creates `profiles`+`billing`
   idempotently; referral grants once and rejects self-referral; logout works.
3. **All enforcement is server-side and atomic:** quota consume (quota→credits→402) can't be raced;
   AI budget gates before the call; both reset on one cycle.
4. **Storage** issues scoped presigned uploads, records `assets`, links attachments, and has a
   stated size-enforcement strategy.
5. **AI chat** streams with per-user calendar context, caps output, and meters real `usage` into
   `ai_usage` + `billing` on finish.
6. **Stripe** checkout (sub + top-up), portal, and a **signature-verified, idempotent** webhook all
   work against the Stripe CLI; plan/credits/cycle transitions (including cancel) are correct.
7. **Contract seam is stable and documented** (see below) so `set-dashboard` can build against it.
8. No secrets on the client; failures return typed, actionable responses; nothing silently succeeds.
9. **No bespoke UI** beyond the login mount was built.

## Contract seam — what this stage exposes for `set-dashboard`
The dashboard depends only on these; never on internals:
- **Server helpers:** `requireUser()`, `getOrCreateProfile()`, `getBillingState()`.
- **Endpoints/actions:** primary-entity CRUD (`/api/entries` …), `/api/assets` (presign),
  `/api/chat` (stream), `/api/stripe/checkout`, `/api/stripe/portal`, logout action.
- **Data shapes:** the entity row; `getBillingState()`'s `{ plan, entriesUsed, entriesLimit,
  creditsRemaining, cycleResetsAt, aiTokensUsed, aiTokensLimit }`; the typed `402` bodies
  (`quota_exhausted` / `ai_budget_exhausted` with `canTopUp` / `canUpgrade`).

Keep these **stable**. If a shape must change, it's a deliberate contract change — say so.

## Out of scope — do NOT build in this stage
The dashboard/app shell, calendar UI, glassmorphic settings/billing modal, AI chat surface, dropup —
**all of it belongs to `set-dashboard`.** Also out: deployment/hosting config (a later stage),
multi-tenant/team features, and any schema the brief marks a non-goal. Mount the auth UI; build no
other screen.

---

## Knowledge Appendix — current wiring patterns

> A starting point, not gospel — **re-verify at runtime** (Step 2). Confirm versions match the set
> the foundation pinned; don't introduce a conflicting major of `ai`, the Neon SDKs, or Stripe.

- **Neon Auth (server session).** Read the user in route handlers / server components via the auth
  instance's session API (verify the exact name, e.g. `auth.getSession()` / `auth.api.getSession()`);
  return/redirect on absence in `requireUser()`. Server components that read auth need
  `export const dynamic = 'force-dynamic'`. Identity is `neon_auth.user` — FK into it; never mirror it.
- **Neon Auth UI.** `@neondatabase/auth-ui` ships prebuilt sign-in/sign-up components — mount them on
  `/login`; confirm the component + props names at runtime. It talks to `app/api/auth/[...path]`.
- **Provisioning pattern.** First-request `getOrCreateProfile()` (upsert `profiles` + `billing`) is
  simpler and race-safe than a signup webhook; make it idempotent so concurrent first requests can't
  double-insert (`on conflict (user_id) do nothing`, then select).
- **Atomic quota consume.** One statement, no read-then-write gap:
  ```sql
  UPDATE billing
     SET used_this_cycle = used_this_cycle + 1
   WHERE profile_id = $1 AND used_this_cycle < monthly_quota
  RETURNING id;               -- 0 rows → quota full; then try extra_credits similarly, else 402
  ```
- **AI provider resolution.** Preferred: `@neondatabase/ai-sdk-provider` → `neon(NEON_AI_GATEWAY_MODEL)`.
  Fallback (provider not yet installable): AI-SDK OpenAI-compatible provider against the gateway:
  ```ts
  // verify field names for the installed `ai` major
  const res = streamText({
    model,                                   // neon(MODEL) or openai-compatible(MODEL)
    system: calendarContext,                 // this user's entries, bounded
    messages, maxOutputTokens: CAP,
    onFinish: async ({ usage }) => {         // v5+: usage.inputTokens / usage.outputTokens
      await recordAiUsage(userId, usage);    // insert ai_usage + bump ai_tokens_used_cycle
    },
  });
  ```
- **Stripe webhook (raw body + idempotency).** Read the **raw** body (`await req.text()`), then:
  ```ts
  const event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET); // throws → 400
  if (await alreadyProcessed(event.id)) return ok();      // dedupe before any increment
  // …handle by type; setting absolute state is safe, increments must be behind the dedupe…
  await markProcessed(event.id);
  ```
  Checkout: `mode:'subscription'` for plans, `mode:'payment'` for top-ups; carry `{ userId, kind }`
  in `metadata` and always store `stripe_customer_id`. Portal handles cancel/manage — don't rebuild it.
- **Storage presign.** `getSignedUrl(s3, new PutObjectCommand({ Bucket: S3_BUCKET, Key, ContentType }),
  { expiresIn })`. The SDK auto-reads `AWS_ENDPOINT_URL_S3` / `AWS_*`. Scope keys per user; size limits
  need presigned-POST policy or a post-upload `HeadObject` check.
- **Cycle model.** Lazy reset (compare `now` vs `cycle_resets_at` on access) covers Free/idle users
  with no cron; `invoice.paid` renews paid subscribers on billing. Reset entry **and** AI counters
  together so the two allowances share one cycle.

**Sources (re-fetch for current truth):**
- Neon Auth + Next.js: https://neon.com/guides/neon-auth-nextjs
- Neon Data API: https://neon.com/docs/data-api/get-started
- Neon AI Gateway: https://neon.com/docs/ai-gateway/get-started
- Vercel AI SDK (streamText / usage / providers): https://ai-sdk.dev/docs
- Neon S3-compatible storage: https://neon.com/docs/guides/aws-s3
- Stripe Checkout: https://stripe.com/docs/checkout · Billing Portal: https://stripe.com/docs/customer-management · Webhooks: https://stripe.com/docs/webhooks
