import {
  envUsername,
  hasConfiguredCredentials,
  hashPassword,
  verifyAgainst,
  verifyCredentials,
  type SessionPayload,
} from "./auth-token";
import { loadAdminAccount, saveAdminAccount, withClient } from "./mysql-store";

/**
 * The admin login. Once it has been changed from Admin → Account it lives in
 * the `admin_account` table; until then the ADMIN_* variables in `.env.local`
 * apply. `npm run admin:setup` clears the table, falling back to `.env.local`.
 */

export const USERNAME_PATTERN = /^[A-Za-z0-9._@-]{3,64}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;

const loadAccount = () => withClient(loadAdminAccount);

/** The username currently allowed to sign in. */
export async function currentUsername(): Promise<string> {
  return (await loadAccount())?.username ?? envUsername();
}

export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const account = await loadAccount();
  return account
    ? verifyAgainst(username, password, account.username, account.passwordHash)
    : verifyCredentials(username, password);
}

/** False when no login has been set anywhere (the dev-only `admin` default). */
export async function hasCredentials(): Promise<boolean> {
  return hasConfiguredCredentials() || (await loadAccount()) !== null;
}

/**
 * A signed session is only honoured for the current username, and — once the
 * login has been changed here — only when issued after that change, so a new
 * password signs out every other browser.
 */
export async function isCurrentSession(session: SessionPayload): Promise<boolean> {
  const account = await loadAccount();
  if (!account) return session.u === envUsername();
  return (
    session.u === account.username &&
    session.iat >= Math.floor(account.updatedAt.getTime() / 1000)
  );
}

export async function updateCredentials(username: string, password: string): Promise<void> {
  await withClient((client) => saveAdminAccount(client, username, hashPassword(password)));
}
