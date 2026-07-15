/* Session auth primitives. Sign-in is passwordless (email OTP —
   auth-actions.ts); sessions live in the DB and the cookie carries a random
   token whose sha256 is the session id. Everything the app trusts about
   "who is this" flows through getCurrentUser(). */
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db"; // adapt to the host repo's db export
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE = "app_session"; // rename per app
const SESSION_DAYS = 30;

const tokenId = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db
    .insert(sessions)
    .values({ id: tokenId(token), userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export type CurrentUser = {
  id: string;
  email: string;
  /* extend with the host app's user fields */
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, tokenId(token)))
    .limit(1);
  /* expiry is enforced HERE, server-side — the cookie's own expiry is
     client-controlled and merely cosmetic */
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.id, email: row.email };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, tokenId(token)));
  }
  store.delete(SESSION_COOKIE);
}
