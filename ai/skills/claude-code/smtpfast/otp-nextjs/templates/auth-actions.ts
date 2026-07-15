"use server";

/* The whole OTP flow: two server actions. requestLoginCode mints a hashed
   six-digit code and mails it via smtpfa.st; verifyLoginCode checks it with
   password discipline (timing-safe, attempt-capped, single-use) and mints
   the account on a first-timer's verified code — one form serves login and
   signup, and no answer ever reveals whether an account exists. */

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db"; // adapt to the host repo's db export
import { loginCodes, users } from "@/db/schema";
import { createSession, destroySession } from "./auth";
import { ipFromHeaders } from "./client-ip";
import { sendLoginCode } from "./mailer";
import { clearAttempts, recordAttempt, retryAfter } from "./rate-limit";

export type AuthState = { error: string } | { sent: true } | undefined;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const RL_WINDOW = 15 * 60_000; // 15 minutes
const CODE_TTL_MS = 10 * 60_000; // codes die after 10 minutes
const MAX_CODE_ATTEMPTS = 5; // per code, counted in the DB row

async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

const inMinutes = (sec: number) => Math.max(1, Math.ceil(sec / 60));

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/* ---------- step 1: email in, six digits out ---------- */

export async function requestLoginCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "That email doesn't look right." };

  /* codes cost an email each — throttle by sender IP AND by target inbox.
     The per-email cap is what stops a botnet using the app to mail-bomb one
     victim; the IP cap alone does not cover it. */
  const ipKey = `otp-request:ip:${await clientIp()}`;
  const emailKey = `otp-request:email:${email}`;
  const wait = retryAfter(ipKey, 10) ?? retryAfter(emailKey, 3);
  if (wait) {
    return {
      error: `Too many codes requested. Try again in ${inMinutes(wait)} minute(s).`,
    };
  }
  recordAttempt(ipKey, RL_WINDOW);
  recordAttempt(emailKey, RL_WINDOW);

  /* crypto-grade randomness — Math.random() is predictable, and a
     predictable OTP is no OTP */
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  /* one live code per email — a new request REPLACES the old code (and
     resets its guess budget) via upsert on the unique email index */
  await db
    .insert(loginCodes)
    .values({ email, codeHash: sha256(code), expiresAt })
    .onConflictDoUpdate({
      target: loginCodes.email,
      set: {
        codeHash: sha256(code),
        expiresAt,
        attempts: 0,
        consumedAt: null,
        createdAt: new Date(),
      },
    });

  if (!(await sendLoginCode(email, code))) {
    return { error: "Couldn't send the email — try again in a moment." };
  }
  /* same answer whether the account exists or not — requesting a code must
     never double as an account-existence oracle */
  return { sent: true };
}

/* ---------- step 2: verify the code; first-timers get an account ---------- */

export async function verifyLoginCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
    return { error: "That code doesn't look right." };
  }

  const ipKey = `otp-verify:ip:${await clientIp()}`;
  const wait = retryAfter(ipKey, 30);
  if (wait) {
    return {
      error: `Too many attempts. Try again in ${inMinutes(wait)} minute(s).`,
    };
  }

  const [row] = await db
    .select()
    .from(loginCodes)
    .where(eq(loginCodes.email, email))
    .limit(1);

  /* a code is dead if it never existed, was already spent, timed out, or
     ran out of guesses — all reported with the same account-agnostic copy */
  const stale =
    !row ||
    row.consumedAt !== null ||
    row.expiresAt.getTime() < Date.now() ||
    row.attempts >= MAX_CODE_ATTEMPTS;
  const match =
    !stale &&
    timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(sha256(code)));

  if (!match) {
    recordAttempt(ipKey, RL_WINDOW);
    if (row && !stale) {
      await db
        .update(loginCodes)
        .set({ attempts: row.attempts + 1 })
        .where(eq(loginCodes.id, row.id));
    }
    return {
      error: stale
        ? "That code expired — request a fresh one."
        : "Wrong code. Check the email and try again.",
    };
  }

  /* consume BEFORE minting the session — a code works exactly once, and a
     double-submitted form must hit the stale branch on its second pass */
  await db
    .update(loginCodes)
    .set({ consumedAt: new Date() })
    .where(eq(loginCodes.id, row.id));
  clearAttempts(ipKey);

  /* returning face → straight in */
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    await createSession(existing.id);
    redirect("/"); // send returning users wherever the app calls home
  }

  /* ────────────────────────────────────────────────────────────────────
     ACCOUNT-MINTING SEAM — first verified code for this email. Put the
     host app's defaults here: username generation, profile rows, plan
     selection, welcome flows. Handle a unique-email race (two tabs
     verifying simultaneously) by re-selecting and signing into the row
     that won. The verified code already proves inbox control, so
     verifiedAt can be set immediately.
     ──────────────────────────────────────────────────────────────────── */
  const [created] = await db
    .insert(users)
    .values({ email, verifiedAt: new Date() })
    .returning({ id: users.id });

  await createSession(created.id);
  redirect("/"); // or the app's onboarding route
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
