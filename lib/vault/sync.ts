import { albumKey, parseMediaUrl } from "./embeds";
import { vaultOrigin } from "./links";
import { checkFrameable, expandShortLink, listAlbum, RemoteError } from "./remote";
import { getAlbums, saveAlbum } from "./store";
import type { ProjectFields } from "./sanitize";
import type { VaultAlbum, VaultBlock, VaultProject } from "./types";

/** An album older than this is listed again the next time its page is built. */
export const ALBUM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Lists a Drive folder or Photos album again and stores the result. */
export async function syncAlbum(url: string): Promise<VaultAlbum> {
  const key = albumKey(url);
  if (!key) throw new RemoteError("Paste a Google Drive folder link or a Google Photos album link.");
  await saveAlbum(key, url, { status: "syncing" });
  try {
    const items = await listAlbum(url);
    await saveAlbum(key, url, { status: "ready", items });
  } catch (error) {
    const message =
      error instanceof RemoteError ? error.message : "The album couldn't be read. Try again in a minute.";
    if (!(error instanceof RemoteError)) console.error("[vault] album sync failed", url, error);
    await saveAlbum(key, url, { status: "error", error: message });
  }
  return (await getAlbums([key])).get(key)!;
}

export function albumUrlsOf(blocks: VaultBlock[]): string[] {
  return blocks.flatMap((b) => (b.type === "gallery" && b.source !== "uploads" && b.url ? [b.url] : []));
}

/** The cached albums a project's galleries show, keyed by album key. */
export async function albumsFor(project: Pick<VaultProject, "blocks">): Promise<Record<string, VaultAlbum>> {
  const urls = albumUrlsOf(project.blocks);
  const map = await getAlbums(urls.map((u) => albumKey(u)!).filter(Boolean));
  return Object.fromEntries(map);
}

/** Albums that were never listed, or not for a day. */
export function staleAlbumUrls(project: Pick<VaultProject, "blocks">, albums: Record<string, VaultAlbum>) {
  return albumUrlsOf(project.blocks).filter((url) => {
    const album = albums[albumKey(url) ?? ""];
    if (!album) return true;
    if (album.status === "syncing") return false;
    return !album.syncedAt || Date.now() - Date.parse(album.syncedAt) > ALBUM_MAX_AGE_MS;
  });
}

/**
 * Work done on save, outside the editor: short video and post links are
 * expanded, websites are checked for framing, and new albums are listed.
 */
export async function prepareForSave(fields: ProjectFields, previous?: VaultProject | null): Promise<ProjectFields> {
  const blocks: VaultBlock[] = [];
  for (const block of fields.blocks) {
    if (block.type === "video") {
      const items = await Promise.all(
        block.items.map(async (item) =>
          item.url && parseMediaUrl(item.url)?.needsResolve ? { ...item, url: await expandShortLink(item.url) } : item,
        ),
      );
      blocks.push({ ...block, items });
    } else if (block.type === "social") {
      const items = await Promise.all(
        block.items.map(async (item) =>
          item.url && parseMediaUrl(item.url)?.needsResolve ? { ...item, url: await expandShortLink(item.url) } : item,
        ),
      );
      blocks.push({ ...block, items });
    } else if (block.type === "website" && block.url) {
      const before = previous?.blocks.find((b) => b.id === block.id);
      const unchanged = before?.type === "website" && before.url === block.url && before.frameable !== null;
      if (unchanged && block.frameable !== null) {
        blocks.push(block);
      } else {
        let frameable: boolean | null = null;
        try {
          frameable = await checkFrameable(block.url, vaultOrigin());
        } catch {
          frameable = null;
        }
        blocks.push({ ...block, frameable, checkedAt: new Date().toISOString() });
      }
    } else {
      blocks.push(block);
    }
  }

  // List any album this save adds, so the page has photos straight away.
  const known = await albumsFor({ blocks });
  for (const url of staleAlbumUrls({ blocks }, known)) {
    if (!known[albumKey(url) ?? ""]) await syncAlbum(url);
  }

  return { ...fields, blocks };
}
