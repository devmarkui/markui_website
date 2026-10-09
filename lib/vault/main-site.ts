import { vaultOrigin, vaultUrl } from "./links";
import { getVaultProject, listPublishedVaultProjects } from "./store";

/**
 * How markui.lk points into the Vault: a project's "Explore the full
 * project" button, Top Work links, and the service pages' portfolio button.
 * Drafts are never linked to; unlisted projects are (that's what they're for).
 */

/** The Vault page for a main-site project, when it has a live one. */
export async function vaultPageFor(vaultProjectId: string | undefined): Promise<string | undefined> {
  if (!vaultProjectId) return undefined;
  const project = await getVaultProject(vaultProjectId).catch(() => null);
  return project && project.status !== "draft" ? vaultUrl(vaultOrigin(), project.slug) : undefined;
}

/** Top Work items whose project has a Vault page link to it, unless they set their own link. */
export async function applyVaultLinks<T extends { link?: string; vaultProjectId?: string }>(items: T[]): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const page = await vaultPageFor(item.vaultProjectId);
      return page ? { ...item, link: page } : item;
    }),
  );
}

/**
 * Where a service page's "See the full portfolio" goes: the Vault, filtered to
 * that service, when it has published work for it; otherwise the portfolio
 * link set in Settings (which may be empty, hiding the section).
 */
export async function servicePortfolioUrl(settingsUrl: string, service?: { id: string; slug: string }): Promise<string> {
  const published = await listPublishedVaultProjects().catch(() => []);
  const relevant = service ? published.filter((p) => p.serviceId === service.id) : published;
  if (!relevant.length) return settingsUrl;
  return service ? `${vaultOrigin()}/?service=${encodeURIComponent(service.slug)}` : vaultOrigin();
}
