import type { MetadataRoute } from "next";

import { vaultOrigin } from "@/lib/vault/links";
import { listPublishedVaultProjects } from "@/lib/vault/store";

export const revalidate = 3600;

/** creative.markui.lk/sitemap.xml (rewritten here): the Vault and every published project. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = vaultOrigin();
  const projects = await listPublishedVaultProjects();
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    ...projects.map((p) => ({
      url: `${origin}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.9 : 0.7,
    })),
  ];
}
