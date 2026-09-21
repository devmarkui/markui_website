import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { LOGIN_PATH } from "@/lib/auth";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth-token";

/**
 * Optimistic guard for the admin area: visitors without a valid session cookie
 * never reach a dashboard route, and a signed-in admin who opens the login page
 * is sent straight to the dashboard.
 *
 * This is a first line of defence only — every admin page and Server Action
 * re-checks the session with `requireAdmin()`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifyToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

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
