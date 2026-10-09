/**
 * Addresses in and out of the Vault. The Vault answers on its own host
 * (creative.markui.lk, see next.config.ts), so links from the main site and
 * the dashboard are absolute; links between Vault pages stay relative.
 */

export const DEFAULT_VAULT_ORIGIN = "https://creative.markui.lk";
export const DEFAULT_SITE_ORIGIN = "https://markui.lk";

function trim(origin: string) {
  return origin.replace(/\/+$/, "");
}

/** Server only: where the Vault lives (VAULT_ORIGIN, for local testing). */
export function vaultOrigin(): string {
  return trim(process.env.VAULT_ORIGIN || DEFAULT_VAULT_ORIGIN);
}

/** Server only: where the main site lives. */
export function siteOrigin(): string {
  return trim(process.env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN);
}

export function vaultUrl(origin: string, slug?: string): string {
  return slug ? `${trim(origin)}/${slug}` : trim(origin);
}

/** Paths the Vault host can't give to a project (routes, files, the old layout). */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "media",
  "vault",
  "projects",
  "project",
  "landing-home",
  "robots",
  "sitemap",
  "favicon",
  "icon",
  "apple-icon",
  "_next",
  "new",
  "preview",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidVaultSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && slug.length <= 120 && !RESERVED_SLUGS.has(slug);
}
