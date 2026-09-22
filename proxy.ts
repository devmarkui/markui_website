import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { LOGIN_PATH, SESSION_COOKIE, verifyToken } from "@/lib/auth-token";

/**
 * Optimistic guard for the admin area: visitors without a valid session cookie
 * never reach a dashboard route.
 *
 * This is a first line of defence only — every admin page and Server Action
 * re-checks the session with `requireAdmin()`. The login page is always let
 * through: a signed cookie can still be stale after a password change, which
 * only the page's own check can tell, so the page does the redirect.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === LOGIN_PATH) return NextResponse.next();

  const session = verifyToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
