import path from "node:path";

import { albumKey } from "./embeds";
import { vaultFilePath } from "./files";
import type { GalleryBlock, VaultAlbum } from "./types";

/**
 * What a gallery hands out when visitors download its photos: the photo
 * itself, in the order the page shows it. Uploads are sent as the original
 * file off disk; Drive and Google Photos images are fetched from Google.
 * Videos stay on the page. Keys match the gallery's `Picture.key`s.
 */

export interface DownloadItem {
  key: string;
  /** The file name, without a folder. */
  name: string;
  /** A chapter's folder inside the zip. */
  folder?: string;
  source: { kind: "file"; path: string } | { kind: "remote"; urls: string[] };
}

/** Whether a gallery offers downloads; sections saved before the switch existed do. */
export function galleryDownloads(block: Pick<GalleryBlock, "downloads">) {
  return block.downloads !== false;
}

/** Characters no file system accepts, and control characters. */
export function safeFileName(name: string, fallback: string) {
  const clean = name
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 120)
    .trim();
  return clean || fallback;
}

export function downloadItems(block: GalleryBlock, albums: Record<string, VaultAlbum>): DownloadItem[] {
  const number = (i: number) => `photo-${String(i + 1).padStart(3, "0")}`;

  if (block.source === "uploads") {
    const items = block.limit ? block.items.slice(0, block.limit) : block.items;
    return items.flatMap((item, i) => {
      const media = item.media;
      const file = media.kind === "image" ? vaultFilePath(path.posix.basename(media.url)) : null;
      if (!file) return [];
      const ext = path.extname(file);
      let name = safeFileName(media.name || item.caption, number(i));
      if (path.extname(name).toLowerCase() !== ext.toLowerCase()) name += ext;
      return [{ key: item.id, name, source: { kind: "file" as const, path: file } }];
    });
  }

  const album = block.url ? albums[albumKey(block.url) ?? ""] : undefined;
  if (!album?.items.length) return [];
  const items = block.limit ? album.items.slice(0, block.limit) : album.items;
  return items.flatMap((item, i) => {
    if (item.kind !== "image" || !/^[\w-]+$/.test(item.id)) return [];
    const folder = block.chapters && item.folder ? safeFileName(item.folder, "") || undefined : undefined;
    const name = safeFileName(item.name ?? "", number(i));
    if (block.source === "photos") {
      if (!item.src?.startsWith("https://lh3.googleusercontent.com/")) return [];
      // `=d` is the original as uploaded; the large web size if Google refuses it.
      return [{ key: item.id, name, folder, source: { kind: "remote" as const, urls: [`${item.src}=d`, `${item.src}=w2560`] } }];
    }
    return [
      {
        key: item.id,
        name,
        folder,
        source: {
          kind: "remote" as const,
          urls: [
            `https://drive.usercontent.google.com/download?id=${item.id}&export=download`,
            `https://lh3.googleusercontent.com/d/${item.id}=w2560`,
          ],
        },
      },
    ];
  });
}
