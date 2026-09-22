#!/usr/bin/env node
/**
 * Creates or updates the admin credentials in `.env.local`.
 *
 *   npm run admin:setup                 → username "admin", random password
 *   npm run admin:setup <user> <pass>   → your own username and password
 *
 * Only the scrypt hash and the session secret are written to disk; the
 * password itself is printed once and never stored.
 */
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.join(process.cwd(), ".env.local");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  // `:` not `$` — Next's dotenv loader expands `$...` and would truncate it.
  return `scrypt:${salt}:${hash}`;
}

function readablePassword() {
  const alphabet = "abcdefghijkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(18);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]);
  return [
    chars.slice(0, 6).join(""),
    chars.slice(6, 12).join(""),
    chars.slice(12, 18).join(""),
  ].join("-");
}

/** Replaces a KEY=... line if present, otherwise appends it. */
function upsert(contents, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${contents.replace(/\s*$/, "")}\n${line}\n`.replace(/^\n/, "");
}

const [, , usernameArg, passwordArg] = process.argv;
const username = usernameArg || "admin";
const password = passwordArg || readablePassword();
const generated = !passwordArg;

let env = "";
try {
  env = fs.readFileSync(ENV_FILE, "utf8");
} catch {
  env = "# Local environment — not committed.\n";
}

env = upsert(env, "ADMIN_USERNAME", username);
env = upsert(env, "ADMIN_PASSWORD_HASH", hashPassword(password));

// Keep an existing session secret so current logins are not invalidated.
if (!/^ADMIN_SESSION_SECRET=.+$/m.test(env)) {
  env = upsert(env, "ADMIN_SESSION_SECRET", randomBytes(32).toString("base64url"));
}

// A plain-text password left over from earlier setup would still be accepted.
env = env.replace(/^ADMIN_PASSWORD=.*$\n?/m, "");

fs.writeFileSync(ENV_FILE, env, "utf8");

// A login changed from Admin → Account is stored in the database and would
// override .env.local; clear it so these credentials take effect.
const databaseUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
if (databaseUrl) {
  try {
    const { createConnection } = await import("mysql2/promise");
    const connection = await createConnection(databaseUrl);
    await connection.query("DELETE FROM admin_account");
    await connection.end();
  } catch (error) {
    console.warn(
      `\n  Could not clear the saved admin login in the database (${error.message}).` +
        "\n  If one was set from Admin → Account, it still applies — delete the" +
        "\n  row in the admin_account table to use these credentials.",
    );
  }
}

console.log("\n  Admin credentials written to .env.local\n");
console.log(`    Username:  ${username}`);
console.log(`    Password:  ${password}`);
if (generated) {
  console.log("\n  This password is shown once — save it now.");
}
console.log("\n  Sign in at /admin/login. Restart the dev server to pick");
console.log("  up the new values.\n");
