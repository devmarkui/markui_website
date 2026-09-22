import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isCurrentSession } from "./admin-account";
import {
  createToken,
  LOGIN_PATH,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifyToken,
  type SessionPayload,
} from "./auth-token";

/**
 * Cookie-backed helpers for the admin session. The Proxy does a cheap
 * optimistic check on the same cookie; these are the authoritative checks and
 * every admin page and Server Action must call `requireAdmin()`.
 */

export { LOGIN_PATH } from "./auth-token";

export async function createSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * The current admin session, or `null` when signed out — or when the session
 * predates a username/password change made in Admin → Account.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = verifyToken(cookieStore.get(SESSION_COOKIE)?.value);
  return session && (await isCurrentSession(session)) ? session : null;
}

/**
 * Guards a page or Server Action. Unauthenticated callers are redirected to the
 * login page, with the page they wanted preserved so they land back on it.
 */
export async function requireAdmin(returnTo?: string): Promise<SessionPayload> {
  const session = await getSession();
  if (session) return session;

  redirect(
    returnTo
      ? `${LOGIN_PATH}?next=${encodeURIComponent(returnTo)}`
      : LOGIN_PATH,
  );
}
