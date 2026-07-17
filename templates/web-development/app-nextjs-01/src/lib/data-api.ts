import { createClient } from "@neondatabase/neon-js";

/**
 * Neon Data API (PostgREST-compatible) client, authorized by Neon Auth JWTs.
 * Safe for browser use on RLS-protected tables — but business-rule mutations
 * belong in our own API routes, not here.
 */
export function createDataApiClient() {
  return createClient({
    auth: { url: process.env.NEXT_PUBLIC_NEON_AUTH_URL! },
    dataApi: { url: process.env.NEXT_PUBLIC_NEON_DATA_API_URL! },
  });
}
