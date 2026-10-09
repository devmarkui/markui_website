import { signLink, verifyLink } from "../auth-token";

/**
 * Signed preview links for drafts. The dashboard is on markui.lk and its
 * session cookie never reaches creative.markui.lk, so a draft opens there
 * through /preview/<id>?t=<expiry>.<signature> instead.
 */

const PURPOSE = "vault-preview";
const LIFETIME_SECONDS = 60 * 60 * 24 * 7;

export function previewToken(projectId: string): string {
  const exp = Math.floor(Date.now() / 1000) + LIFETIME_SECONDS;
  return `${exp}.${signLink(PURPOSE, `${projectId}.${exp}`)}`;
}

export function checkPreviewToken(projectId: string, token: string | undefined): boolean {
  if (!token) return false;
  const [exp, signature] = token.split(".");
  if (!exp || !signature || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return verifyLink(PURPOSE, `${projectId}.${exp}`, signature);
}
