/* Drizzle + Postgres schema for the OTP flow — adapt table/column style to
   the host repo. Two tables; your existing `users` table stays the owner of
   identity (it only needs a unique, case-insensitive email). */
import { sql } from "drizzle-orm";
import {
  bigint,
  customType,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* case-insensitive email (citext extension: CREATE EXTENSION IF NOT EXISTS
   citext). If you'd rather not, use text() and lowercase the email in every
   read and write — pick one strategy and never mix them. */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

/* Email sign-in codes — only the sha256 of the code is stored; the unique
   email index is load-bearing (it makes "one live code per email" a single
   upsert: a resend replaces the old code instead of coexisting with it). */
export const loginCodes = pgTable(
  "login_codes",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    email: citext("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /* counted here, not in memory — the guess budget must survive restarts */
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("login_codes_email_idx").on(t.email)],
);

/* DB-backed sessions — id is the sha256 of the cookie token, never the
   token itself; a leaked sessions table must not replay into cookies. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/* Minimal users table if the repo doesn't have one yet — otherwise keep
   yours and just ensure the unique case-insensitive email index exists. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: citext("email").notNull(),
    /* optional: lets a cron sweep accounts that never proved their inbox
       beyond the first code (rarely needed — a verified code IS proof) */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);
