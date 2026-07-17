import {
  bigint,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * The `neon_auth` schema is owned and migrated by Neon Auth. It is declared
 * here only so app tables can FK into it. drizzle-kit still emits a CREATE
 * for it on a from-scratch `generate` — delete that statement from the SQL
 * (the committed 0000 migration already has it removed; the snapshot keeps
 * incremental generates from re-adding it).
 */
const neonAuthSchema = pgSchema("neon_auth");

export const authUsers = neonAuthSchema.table("user", {
  id: uuid("id").primaryKey(),
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

/** App-level profile — one row per auth user, created on first login. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

/** Metadata for objects in Neon Object Storage; the objects live in the bucket. */
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  contentType: text("content_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  kind: text("kind"),
  ...timestamps,
});
