import { getServices } from "../db";
import { albumKey } from "./embeds";
import { listPublishedVaultProjects, getAlbums } from "./store";
import type { VaultAlbum, VaultProject } from "./types";

/**
 * What the Vault's public pages read: published projects with their
 * services, and a short "what's inside" line for each card.
 */

export async function serviceNames(): Promise<Map<string, { name: string; slug: string }>> {
  const services = await getServices({ includeInactive: true });
  return new Map(services.map((s) => [s.id, { name: s.name, slug: s.slug }]));
}

/** "3 films · 248 photos · Live site" */
export function contentsOf(project: VaultProject, albums: Map<string, VaultAlbum>): string[] {
  let films = 0;
  let photos = 0;
  let posters = 0;
  let posts = 0;
  let site = false;
  let prototype = false;
  for (const block of project.blocks) {
    if (block.hidden) continue;
    if (block.type === "video") films += block.items.filter((i) => i.url || i.file).length;
    else if (block.type === "posters") posters += block.items.filter((i) => i.image).length;
    else if (block.type === "social") posts += block.items.filter((i) => i.url).length;
    else if (block.type === "website" && block.url) site = true;
    else if (block.type === "embed" && (block.url || block.file)) prototype = true;
    else if (block.type === "gallery") {
      if (block.source === "uploads") photos += block.items.length;
      else {
        const album = block.url ? albums.get(albumKey(block.url) ?? "") : undefined;
        const n = album?.items.length ?? 0;
        photos += block.limit ? Math.min(block.limit, n) : n;
      }
    }
  }
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return [
    site ? "Live site" : "",
    prototype ? "Prototype" : "",
    films ? plural(films, "film", "films") : "",
    posters ? plural(posters, "poster", "posters") : "",
    photos ? plural(photos, "photo", "photos") : "",
    posts ? plural(posts, "post", "posts") : "",
  ].filter(Boolean);
}

export async function publishedWithAlbums() {
  const projects = await listPublishedVaultProjects();
  const keys = projects.flatMap((p) =>
    p.blocks.flatMap((b) => (b.type === "gallery" && b.source !== "uploads" && b.url ? [albumKey(b.url) ?? ""] : [])),
  );
  const albums = await getAlbums(keys);
  return { projects, albums };
}
