/* Best available client IP from the proxy chain — this keys the rate
   limits, so getting it wrong turns the IP throttle into a header the
   attacker types. Behind Cloudflare the true client is CF-Connecting-IP
   (Cloudflare sets it and strips any client-sent copy), whereas
   X-Forwarded-For's leftmost entry is attacker-supplied unless YOUR edge
   overwrites it. Prefer the header your infra guarantees; fall back for
   local dev. Adjust the preferred header to the actual edge in front of
   the app (CF-Connecting-IP, X-Real-IP, Fly-Client-IP, ...). */
export function ipFromHeaders(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
