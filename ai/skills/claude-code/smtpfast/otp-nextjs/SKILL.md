---
name: smtpfast-otp-nextjs
description: >-
  Passwordless, OTP-only email auth for a Next.js App Router app, with smtpfa.st as the mail
  rail. Installs the full loop: six-digit codes hashed at rest, one live code per email,
  attempt caps counted in the database, timing-safe verification, per-IP and per-email rate
  limits, DB-backed sessions behind an httpOnly cookie, and a two-step sign-in form with
  paste-aware code boxes. Login and signup collapse into one flow — the account is minted on
  the first verified code. Works locally with zero mail config (codes print to the server
  log). Use when an app wants email sign-in without passwords; not a bolt-on second factor,
  and not an OAuth replacement — it composes next to OAuth fine.
---

# smtpfast/otp-nextjs — passwordless email codes, done paranoid

This skill wires **OTP-only authentication**: the user types an email, a six-digit code
lands in their inbox via [smtpfa.st](https://smtpfa.st), they type it back, and they are in.
No passwords anywhere — no hashing libraries, no reset flows, no credential-stuffing
surface. First-time emails get an account minted at the moment their code verifies, so one
form serves login and signup.

> **Mental model:** a login code is a password you issued yourself, with a ten-minute life.
> Treat it with password discipline — hash it at rest, cap the guesses, compare in constant
> time, spend it exactly once — and the flow is boring. Treat it casually and you have built
> a password system with a six-character alphabet and no lockout.

The whole system is two server actions, three small tables' worth of primitives, one mailer,
and one form. Everything the app later trusts hangs off `getCurrentUser()`.

---

## Step 0 — Discovery gate (required first)

Inspect before writing:

- **Next.js App Router with server actions?** This skill is built on `"use server"` actions
  and `useActionState`. Pages Router needs API-route adaptation — say so and get agreement
  before improvising.
- **Database + ORM.** Templates are Drizzle + Postgres. Any SQL store works; adapt the two
  tables to the house ORM rather than importing Drizzle into a Prisma repo.
- **Existing auth?** If NextAuth, Clerk, Lucia, or a hand-rolled session system exists,
  **stop and confirm you are replacing it** — never run two auth systems side by side. If
  OAuth sign-in exists and stays, this flow composes next to it: same `users` table, same
  session primitives, OTP as the always-works path.
- **Where sessions will be checked.** Identify the gated routes/layouts now; the last step
  wires them through `getCurrentUser()`.

## Step 1 — Environment

```
SMTPFAST_API_KEY=sf_live_...   # smtpfa.st dashboard → API keys
MAIL_FROM=App <no-reply@yourdomain.com>
APP_URL=https://yourdomain.com # absolute-URL base in prod
```

Two rules here:

- `MAIL_FROM` must use a **domain verified in the smtpfa.st dashboard** — an unverified
  domain sends nothing and returns `403`. Add the domain and its DNS records before blaming
  the code. Details in [references/smtpfast-api.md](references/smtpfast-api.md).
- **The flow must work with no key at all.** The mailer's dev fallback prints the code to
  the server log when `SMTPFAST_API_KEY` is unset, so local sign-in works on day zero.
  Never make mail config a prerequisite for running the app.

## Step 2 — Schema

Two tables, from [templates/schema.ts](templates/schema.ts):

- `login_codes` — one row per email (unique index; the upsert target), holding
  `code_hash`, `expires_at`, `attempts`, `consumed_at`. The unique-per-email index is
  load-bearing: it is what makes "a new request replaces the old code" a one-statement
  upsert instead of a cleanup job.
- `sessions` — `id` is the **sha256 of the cookie token**, never the token itself, plus
  `user_id` and `expires_at`.

Your `users` table needs at minimum a unique, case-insensitive email (citext, or lowercase
before every read and write — pick one and be consistent). Add `verified_at` if you want to
sweep abandoned accounts later; a verified code already proves inbox control, so this flow
does not require a separate verification step to log someone in.

## Step 3 — The mailer

[templates/mailer.ts](templates/mailer.ts) is a plain `fetch` against
`POST https://smtpfa.st/api/v1/emails` with a Bearer key — **no SDK dependency**. Request
shape: `{ from, to: [email], subject, html, text }`. Both bodies always: `html` for people,
`text` for their filters.

Copy rules for the code email, all deliberate:

- **The code goes in the subject line** — "482913 is your App sign-in code". Most users
  never open the email; the notification is the UI.
- Large, monospaced, letter-spaced code in the body. It is being read across a phone
  notification and retyped, or copied — make both trivial.
- State the expiry ("expires in 10 minutes") and the no-action line ("if you didn't ask
  for it, ignore this — nothing happens without the code").
- No links in the code email. A code email with links trains users to click links in auth
  emails, which is the phishing posture you are trying to retire.

## Step 4 — The two actions

[templates/auth-actions.ts](templates/auth-actions.ts) carries the whole flow. These ten
rules are the skill — when in doubt, the rule wins over convenience. The reasoning behind
each lives in [references/security-model.md](references/security-model.md).

1. Codes come from **`crypto.randomInt(0, 1_000_000)`**, zero-padded to six digits. Never
   `Math.random()` — it is predictable, and a predictable OTP is no OTP.
2. The database stores **`sha256(code)` only**. A leaked `login_codes` table must be
   worthless ten minutes later at most.
3. **One live code per email.** The insert is an upsert on the email's unique index:
   a resend replaces the old code, resets `attempts`, clears `consumed_at`. Two valid
   codes for one inbox is two chances per guess window.
4. **Ten-minute TTL.** Long enough for a slow inbox, short enough that a stolen phone
   notification goes stale.
5. **Five attempts per code, counted in the database row** — not in memory. Process
   restarts must not refill the guess budget. At six digits and five tries, brute force
   odds are 1 in 200,000 per code.
6. Compare hashes with **`timingSafeEqual`**, never `===`.
7. **Verification consumes the code** — set `consumed_at` before minting the session. A
   code works exactly once, including replays from the same user double-clicking.
8. **Rate limit both actions.** Requesting: per-IP (10 / 15 min) AND per-email (3 / 15 min)
   — every request costs a real email, and the per-email throttle is what stops someone
   burning your smtpfa.st quota into a stranger's inbox. Verifying: per-IP (30 / 15 min)
   on failures, cleared on success. Templates:
   [templates/rate-limit.ts](templates/rate-limit.ts),
   [templates/client-ip.ts](templates/client-ip.ts).
9. **Answers never reveal whether an account exists.** Requesting a code returns the same
   "sent" for every well-formed email — new emails simply get an account minted when their
   first code verifies. Wrong-code errors are the same shape regardless of account state.
10. Sessions, from [templates/auth.ts](templates/auth.ts): a 32-byte random token in an
    **httpOnly, SameSite=Lax, Secure cookie**; the database stores its sha256 as the
    session id; expiry is checked server-side on every read. The account-minting seam in
    the verify action is marked — put your username/profile defaults there.

## Step 5 — The form

[templates/EmailOtpForm.tsx](templates/EmailOtpForm.tsx): two steps in one component —
email in, then six code boxes. The details that make it feel right:

- `autoComplete="one-time-code"` on the first box — iOS and Android offer the code straight
  from the notification.
- Paste fans out across all six boxes; backspace walks left; a full code enables submit.
- "Resend code" (which silently invalidates the old code — rule 3) and "Different email"
  affordances under the boxes.
- The template ships neutral Tailwind — restyle it to the host design system; the behavior
  is the part to keep.

## Step 6 — Verify end to end

Run the app with no mail key and walk the loop before calling it done:

- Request a code → it prints in the server log → verify → session cookie set →
  `getCurrentUser()` returns the user in a gated route.
- Wrong code five times → the sixth try reports the code stale even with the right digits.
- Resend, then try the first code → rejected; the resent code works.
- Let a code expire (drop the TTL to seconds temporarily) → clear "expired" message.
- Hammer request past the per-email cap → throttle message with minutes remaining.
- With a real key: send to a real inbox, confirm subject-line code and both bodies render.

## Refusals — what this skill argues back on

- **No magic links as the primary factor.** Corporate mail scanners and prefetchers open
  links; a code that must be typed into the existing tab cannot be consumed by a scanner or
  hijacked into someone else's browser. Links are fine for a secondary "verify this
  address" nicety — not for authentication.
- **No 4-digit codes, no 5.** Six digits against a 5-attempt cap is the floor. Below that
  the guess odds stop being a rounding error.
- **Never store or log a plaintext code server-side** — the dev-mode console print exists
  only when mail is unconfigured, which is never production.
- **Never put the code in a URL** — URLs land in histories, proxies, and referrer logs.
- **No password fallback.** If the product later wants passwords, that is a different auth
  system, not an edit to this one. The absence of passwords is the security posture.
- **Don't skip the per-email throttle** because "the IP limit covers it" — it does not; a
  botnet has many IPs and your victim has one inbox and you have one mail quota.

## Escape hatches

- **Multi-replica deployments:** the in-memory rate limiter is per-process by design (and
  says so). The seam is three functions — `retryAfter`, `recordAttempt`, `clearAttempts` —
  swap the Map for Redis or a DB table without touching the actions. The in-DB attempts cap
  is the real backstop either way.
- **Session length** defaults to 30 days sliding-from-issue; tune `SESSION_DAYS`.
- **Code TTL / attempt budget** are two constants at the top of the actions file; loosen
  them only with a reason you can say out loud.
- **smtpfa.st tiers:** free is 3,000 emails/month — that is 3,000 sign-ins. Watch the
  dashboard when auth traffic grows; overflow is $1 per 1,000.
