/* Fixed-window rate limiting, in memory. Correct for a single replica; the
   in-database attempts cap is the real backstop either way. Scaling past one
   process/pod: swap the Map for Redis or a small table — the three-function
   seam below is the whole contract, the callers never change. */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/* keep the map from growing without bound under a spray of distinct keys */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** If `key` is already at/over `limit` in the current window, returns the
    seconds until it resets; otherwise null. Does not count the check. */
export function retryAfter(key: string, limit: number): number | null {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return null;
  if (bucket.count >= limit) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }
  return null;
}

/** Count one attempt against `key`, opening a fresh window if needed. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    bucket.count += 1;
  }
}

/** Wipe a key's counter — call on a legitimate success. */
export function clearAttempts(key: string): void {
  buckets.delete(key);
}
