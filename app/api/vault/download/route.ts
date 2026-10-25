import path from "node:path";

import { downloadZip } from "client-zip";

import { openMedia } from "@/lib/media-remote";
import { downloadItems, galleryDownloads, safeFileName, type DownloadItem } from "@/lib/vault/downloads";
import { contentTypeOf } from "@/lib/vault/files";
import { fetchAlbumImage } from "@/lib/vault/remote";
import { findVaultProjectBySlug } from "@/lib/vault/store";
import { albumsFor } from "@/lib/vault/sync";
import type { GalleryBlock } from "@/lib/vault/types";

/**
 * Photos from a Vault gallery, for visitors: one photo on its own, or a
 * selection (or all of them) as a zip that is written as it downloads, one
 * photo at a time, so a gallery of hundreds never sits in memory.
 *
 *   POST /api/vault/download   project=<slug> gallery=<block id> photos=all|<key>,<key>…
 *
 * A form post into a hidden frame (components/vault/download.ts), so the
 * browser's own download manager shows the progress. Drafts, hidden sections
 * and galleries with downloads switched off answer 404.
 */
export const maxDuration = 900;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/tiff": ".tif",
};

function notFound() {
  return new Response("Those photos aren't available to download.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function attachment(name: string) {
  const ascii = name.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/** The file name, with an extension from the response when it had none. */
function named(item: DownloadItem, type?: string | null) {
  const ext = EXTENSIONS[(type ?? "").split(";")[0].trim().toLowerCase()];
  return path.extname(item.name) || !ext ? item.name : item.name + ext;
}

async function open(item: DownloadItem) {
  if (item.source.kind === "file") {
    // Off this server's disk, or from the media server once it's only there.
    const file = await openMedia(item.source.rel);
    if (!file) return null;
    return {
      name: item.name,
      body: file.body,
      size: file.size,
      type: contentTypeOf(item.source.rel) as string | undefined,
      lastModified: file.lastModified,
    };
  }
  const res = await fetchAlbumImage(item.source.urls);
  if (!res?.body) return null;
  const type = res.headers.get("content-type") ?? undefined;
  // No size: fetch undoes any transfer compression, so Content-Length can't be trusted.
  return { name: named(item, type), body: res.body, size: undefined, type, lastModified: new Date() };
}

/** Each name once per folder, ignoring case, as Windows and macOS would. */
function uniqueNamer() {
  const used = new Set<string>();
  return (name: string, folder?: string) => {
    const ext = path.extname(name);
    const base = name.slice(0, name.length - ext.length);
    let candidate = name;
    for (let n = 2; used.has(`${folder ?? ""}/${candidate}`.toLowerCase()); n++) candidate = `${base} (${n})${ext}`;
    used.add(`${folder ?? ""}/${candidate}`.toLowerCase());
    return folder ? `${folder}/${candidate}` : candidate;
  };
}

async function* zipEntries(items: DownloadItem[]) {
  const unique = uniqueNamer();
  const missing: string[] = [];
  for (const item of items) {
    const file = await open(item).catch(() => null);
    if (!file) {
      missing.push(item.folder ? `${item.folder}/${item.name}` : item.name);
      continue;
    }
    yield { name: unique(file.name, item.folder), input: file.body, size: file.size, lastModified: file.lastModified };
  }
  if (missing.length) {
    yield {
      name: unique("Could not be included.txt"),
      input: `These photos couldn't be fetched just now. Try downloading them again in a minute.\r\n\r\n${missing.join("\r\n")}\r\n`,
    };
  }
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value : "";
  };

  const found = await findVaultProjectBySlug(field("project"));
  const block = found?.project.blocks.find(
    (b): b is GalleryBlock => b.type === "gallery" && b.id === field("gallery") && !b.hidden,
  );
  if (!found || !block || !galleryDownloads(block)) return notFound();

  const albums = await albumsFor({ blocks: [block] });
  const all = downloadItems(block, albums);
  const wanted = field("photos");
  const keys = wanted === "all" ? null : new Set(wanted.split(",").filter(Boolean));
  const items = keys ? all.filter((item) => keys.has(item.key)) : all;
  if (!items.length) return notFound();

  if (items.length === 1) {
    const file = await open(items[0]).catch(() => null);
    if (!file) return new Response("That photo couldn't be fetched just now. Try again in a minute.", { status: 502 });
    const headers: Record<string, string> = {
      "Content-Type": file.type ?? "application/octet-stream",
      "Content-Disposition": attachment(file.name),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (file.size) headers["Content-Length"] = String(file.size);
    return new Response(file.body, { headers });
  }

  const title = safeFileName(block.title || block.label, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const zipName = `${found.project.slug}${title && title !== "gallery" ? `-${title}` : ""}-photos.zip`;
  const zip = downloadZip(zipEntries(items));
  return new Response(zip.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": attachment(zipName),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
