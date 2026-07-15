# Security model — why every rule in the skill exists

The threat model for email OTP is small and concrete. Each defense in the skill
maps to a specific attack; if you are tempted to drop one, name the attack it
covers and say why it no longer applies.

## The attacks

**Guessing.** A six-digit code is one of 1,000,000 values. Undefended, an
attacker who can call `verify` freely wins in minutes. Defenses, layered:

- 5 attempts per code, counted **in the database row** — survives process
  restarts and multiple replicas; memory counters do not.
- Per-IP verify throttle (30 failures / 15 min) — slows distributed guessing.
- 10-minute TTL — bounds the total guessing window per code.
- One live code per email — a resend must not hand the attacker a second
  simultaneous target.

Combined: ≤5 guesses against 10⁶ values per code, 1-in-200,000 per issued code.
An attacker triggering resends does not accumulate chances, because each resend
replaces the previous code.

**Database theft.** If `login_codes` leaks, plaintext codes let the thief log
in as anyone with a pending code. Stored as `sha256(code)`, the rows are
useless: with ≤10 minutes of validity and the verify endpoint rate-limited, an
offline brute force of a hash worth one login attempt is not a trade anyone
makes. (No salt needed at this TTL and value — the hash is a tripwire, not a
password vault. If that ever changes, the TTL was set wrong, not the hash.)

**Timing.** `codeHash === inputHash` leaks equality position through response
time. It is a marginal oracle over HTTP, but `crypto.timingSafeEqual` costs one
line — spend it and stop thinking about it.

**Replay.** A verified code must die. `consumed_at` is written before the
session is created; the same code re-submitted (double-click, retried request,
attacker replaying a sniffed form body) hits the `stale` branch. Single-use is
non-negotiable.

**Enumeration.** "We couldn't find that account" tells an attacker which emails
have accounts. This flow's shape removes the leak: every well-formed email gets
"sent", because unknown emails are simply future accounts (minted on first
verified code). Keep verify errors account-agnostic too — "wrong code" and
"expired" reference the code, never the account.

**Quota burning / mail-bombing.** Every request sends a real, paid email. Two
throttles, both required:

- per-IP (10 / 15 min): one attacker cannot drain the mail quota.
- per-email (3 / 15 min): many IPs (a botnet) cannot bomb one victim inbox and
  cannot use your app as a harassment cannon. The IP limit does NOT cover this.

**Session theft.** The cookie token is the crown jewel once auth succeeds:

- 32 random bytes (`crypto.randomBytes`), base64url — unguessable.
- `httpOnly` (no script access), `SameSite=Lax` (CSRF posture for top-level
  navigations), `Secure` in production.
- The database stores `sha256(token)` as the session id, so a leaked sessions
  table cannot be replayed into cookies.
- Expiry enforced server-side on every `getCurrentUser()` — never trust the
  cookie's own expiry, that is client-controlled.

**Spoofed client identity.** Rate-limit keys use the client IP. Behind a proxy
or CDN, the leftmost `X-Forwarded-For` entry is attacker-supplied; prefer the
edge-set header your infra guarantees (`CF-Connecting-IP` behind Cloudflare),
then fall back. See `templates/client-ip.ts`. Getting this wrong turns the IP
throttle into a header the attacker types.

## What this flow deliberately does not defend against

Name these honestly rather than pretending:

- **A compromised inbox.** Email OTP's root of trust is inbox control — same as
  every password-reset flow ever shipped. If the mailbox is stolen, the account
  is stolen. That ceiling is shared with passwords-plus-reset; OTP just removes
  the password's extra attack surface (reuse, stuffing, weak choices).
- **Phishing in real time.** A proxy site can relay a live code within its TTL.
  Mitigations (origin-bound codes, passkeys) are a different tier of auth;
  if the product needs phishing resistance, add passkeys alongside — do not
  bolt complexity onto the OTP.
- **The mail provider reading codes.** smtpfa.st transports the plaintext code
  by definition. TTL + single-use bounds that exposure; it is the same trust
  every email-based auth extends to its mail rail.

## Operational notes

- The in-memory limiter is **per-process**. Single replica: fine, and the DB
  attempt cap backstops it anyway. Multiple replicas: swap the Map for Redis or
  a small table behind the same three-function seam. Do not ship multi-replica
  believing the memory limiter is global — it quietly divides every limit by
  the replica count.
- Sweep consumed/expired `login_codes` rows opportunistically (a delete on
  insert, or a daily job) — the table should stay near one row per active
  sign-in.
- Log auth *events* (request throttled, code expired, attempts exceeded) —
  never the code, and in production never the email alongside such events
  without a reason.
