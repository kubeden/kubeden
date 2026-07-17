import { createHash } from "node:crypto";

/** Deterministic Gravatar URL (identicon fallback). Server-side only. */
export function avatarUrl(email: string, size = 96): string {
  const hash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
