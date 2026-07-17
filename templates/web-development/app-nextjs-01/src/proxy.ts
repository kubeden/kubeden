import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/server";

/** Redirects unauthenticated requests for gated routes to /login. */
export default function proxy(request: NextRequest) {
  return getAuth().middleware({ loginUrl: "/login" })(request);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
