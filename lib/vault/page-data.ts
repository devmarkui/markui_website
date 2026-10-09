import { after } from "next/server";
import type { Metadata } from "next";

import type { NextProject } from "@/components/vault/ProjectView";

import { siteOrigin, vaultOrigin } from "./links";
import { absoluteUrl, coverStill } from "./media-urls";
import { serviceNames } from "./public";
import { getVaultSettings, listPublishedVaultProjects } from "./store";
import { albumsFor, staleAlbumUrls, syncAlbum } from "./sync";
import type { VaultProject } from "./types";

/**
 * Everything a Vault project page needs, for the public page and the draft
 * preview alike. Albums that haven't been listed for a day are refreshed
 * after the response is sent, so new Drive photos turn up on their own.
 */
export async function projectPageData(project: VaultProject) {
  const [albums, services, published, settings] = await Promise.all([
    albumsFor(project),
    serviceNames(),
    listPublishedVaultProjects(),
    getVaultSettings(),
  ]);

  const stale = staleAlbumUrls(project, albums);
  if (stale.length && process.env.NEXT_PHASE !== "phase-production-build") {
    after(async () => {
      for (const url of stale) await syncAlbum(url).catch(() => undefined);
    });
  }

  const at = published.findIndex((p) => p.id === project.id);
  const candidate = published.length > 1 || at === -1 ? published[(at + 1) % published.length] : undefined;
  const nextProject: NextProject | null =
    candidate && candidate.id !== project.id
      ? {
          slug: candidate.slug,
          title: candidate.title,
          client: candidate.client,
          service: services.get(candidate.serviceId)?.name ?? "",
          cover: candidate.cover,
        }
      : null;

  return {
    albums,
    serviceName: services.get(project.serviceId)?.name ?? "",
    next: nextProject,
    siteOrigin: siteOrigin(),
    cta: { label: settings.ctaLabel, url: settings.ctaUrl },
  };
}

export function projectMetadata(project: VaultProject): Metadata {
  const description = (project.summary.split(/\n\s*\n/)[0] || `${project.title}: the full project by Mark UI.`).slice(0, 300);
  const image = absoluteUrl(vaultOrigin(), coverStill(project.cover?.media));
  return {
    title: project.client ? `${project.title} for ${project.client}` : project.title,
    description,
    alternates: { canonical: `/${project.slug}` },
    robots: project.status === "published" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url: `/${project.slug}`,
      siteName: "Mark UI Creative Vault",
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: project.title, description, images: image ? [image] : undefined },
  };
}

/** schema.org CreativeWork for the page. */
export function projectJsonLd(project: VaultProject, serviceName: string) {
  const origin = vaultOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    url: `${origin}/${project.slug}`,
    description: project.summary.split(/\n\s*\n/)[0] || undefined,
    image: absoluteUrl(origin, coverStill(project.cover?.media)),
    dateCreated: project.date || undefined,
    genre: serviceName || undefined,
    creator: { "@type": "Organization", name: "Mark UI", url: siteOrigin() },
    ...(project.client ? { sourceOrganization: { "@type": "Organization", name: project.client } } : {}),
  };
}
