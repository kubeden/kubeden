import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

let instance: NeonAuth | null = null;

/**
 * Lazily-initialized Neon Auth server instance.
 *
 * Lazy because `createNeonAuth` validates its config eagerly — a module-scope
 * instance would make `next build` fail before the NEON_AUTH_* env vars are set.
 */
export function getAuth(): NeonAuth {
  return (instance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
  }));
}
