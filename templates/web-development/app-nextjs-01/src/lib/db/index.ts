import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

let instance: ReturnType<typeof createDb> | null = null;

function createDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

/**
 * Server-side Drizzle client over Neon's HTTP driver.
 * Call inside request handlers, not at module scope.
 */
export function getDb() {
  return (instance ??= createDb());
}
