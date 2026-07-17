import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own; reuse Next's env loading.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // Only manage the public schema on push/introspect — `neon_auth` belongs to
  // Neon Auth. Note: `generate` ignores this filter; see src/db/schema.ts.
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
