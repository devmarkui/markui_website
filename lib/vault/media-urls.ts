import { driveImageUrl } from "./embeds";
import type { AlbumItem, GalleryUpload, MediaRef } from "./types";

/**
 * Picture sources for the Vault's pages. Uploads carry a 720px thumbnail and
 * a ≤2400px web copy (lib/vault/files.ts); Drive and Google Photos images are
 * sized by Google's own CDN through the URL. Nothing here goes through the
 * server's image optimiser. Client-safe.
 */

export interface Picture {
  /** A stable key for lists. */
  key: string;
  kind: "image" | "video";
  src: string;
  srcSet?: string;
  /** The largest version, for the lightbox. */
  full: string;
  w?: number;
  h?: number;
  caption?: string;
  /** A Drive video plays in Drive's own player. */
  embed?: string;
  /** An uploaded video plays natively. */
  video?: string;
  poster?: string;
  chapter?: string;
}

export function refPicture(ref: MediaRef, key: string, caption?: string): Picture {
  if (ref.kind === "video") {
    return {
      key,
      kind: "video",
      src: ref.poster ?? "",
      full: ref.poster ?? "",
      video: ref.url,
      poster: ref.poster,
      w: ref.w,
      h: ref.h,
      caption,
    };
  }
  const large = ref.display ?? ref.url;
  const srcSet = ref.thumb && ref.display ? `${ref.thumb} 720w, ${ref.display} 2400w` : undefined;
  return { key, kind: "image", src: large, srcSet, full: large, w: ref.w, h: ref.h, caption };
}

export function uploadPictures(items: GalleryUpload[]): Picture[] {
  return items.map((item) => refPicture(item.media, item.id, item.caption || undefined));
}

export function albumPictures(items: AlbumItem[], source: "drive" | "photos"): Picture[] {
  return items.map((item) => {
    const base: Pick<Picture, "key" | "w" | "h" | "caption" | "chapter"> = {
      key: item.id,
      w: item.w,
      h: item.h,
      caption: item.name?.replace(/\.[a-z0-9]+$/i, ""),
      chapter: item.folder,
    };
    if (source === "photos" && item.src) {
      return {
        ...base,
        kind: "image",
        src: `${item.src}=w1600`,
        srcSet: `${item.src}=w640 640w, ${item.src}=w1200 1200w, ${item.src}=w2000 2000w`,
        full: `${item.src}=w2560`,
      };
    }
    if (item.kind === "video") {
      return {
        ...base,
        kind: "video",
        src: driveImageUrl(item.id, 1200),
        full: driveImageUrl(item.id, 1600),
        embed: `https://drive.google.com/file/d/${item.id}/preview`,
      };
    }
    return {
      ...base,
      kind: "image",
      src: driveImageUrl(item.id, 1600),
      srcSet: `${driveImageUrl(item.id, 640)} 640w, ${driveImageUrl(item.id, 1200)} 1200w, ${driveImageUrl(item.id, 2000)} 2000w`,
      full: driveImageUrl(item.id, 2560),
    };
  });
}

/** The cover as a still: the image itself, or a video's poster. */
export function coverStill(ref: MediaRef | null | undefined): string | undefined {
  if (!ref) return undefined;
  if (ref.kind === "video") return ref.poster;
  return ref.display ?? ref.url;
}

export function absoluteUrl(origin: string, url: string | undefined) {
  if (!url) return undefined;
  return url.startsWith("/") ? `${origin}${url}` : url;
}
