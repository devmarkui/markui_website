import type { MediaKind } from "./types";

/**
 * What the Vault's uploader accepts, shared by the upload route (validation)
 * and the media picker (the `accept` attribute and hints). Client-safe.
 *
 * Browsers can show images, videos and PDFs; everything else (camera RAW,
 * Photoshop and Illustrator files, archives, Office documents) is stored as a
 * download. HEIC and TIFF photos get a JPEG/WebP copy for display.
 */

export interface FileType {
  kind: MediaKind;
  mime: string;
  /** A display copy is made on upload (the browser can't show the original). */
  convert?: boolean;
}

export const VAULT_FILE_TYPES: Record<string, FileType> = {
  // Images
  ".jpg": { kind: "image", mime: "image/jpeg" },
  ".jpeg": { kind: "image", mime: "image/jpeg" },
  ".png": { kind: "image", mime: "image/png" },
  ".webp": { kind: "image", mime: "image/webp" },
  ".gif": { kind: "image", mime: "image/gif" },
  ".avif": { kind: "image", mime: "image/avif" },
  ".svg": { kind: "image", mime: "image/svg+xml" },
  ".tif": { kind: "image", mime: "image/tiff", convert: true },
  ".tiff": { kind: "image", mime: "image/tiff", convert: true },
  ".heic": { kind: "image", mime: "image/heic", convert: true },
  ".heif": { kind: "image", mime: "image/heif", convert: true },
  // Video
  ".mp4": { kind: "video", mime: "video/mp4" },
  ".m4v": { kind: "video", mime: "video/mp4" },
  ".mov": { kind: "video", mime: "video/quicktime" },
  ".webm": { kind: "video", mime: "video/webm" },
  // Documents
  ".pdf": { kind: "pdf", mime: "application/pdf" },
  // Downloads
  ".zip": { kind: "file", mime: "application/zip" },
  ".rar": { kind: "file", mime: "application/vnd.rar" },
  ".7z": { kind: "file", mime: "application/x-7z-compressed" },
  ".psd": { kind: "file", mime: "image/vnd.adobe.photoshop" },
  ".ai": { kind: "file", mime: "application/postscript" },
  ".eps": { kind: "file", mime: "application/postscript" },
  ".indd": { kind: "file", mime: "application/x-indesign" },
  ".fig": { kind: "file", mime: "application/octet-stream" },
  ".xd": { kind: "file", mime: "application/octet-stream" },
  ".sketch": { kind: "file", mime: "application/octet-stream" },
  ".cr2": { kind: "file", mime: "image/x-canon-cr2" },
  ".cr3": { kind: "file", mime: "image/x-canon-cr3" },
  ".nef": { kind: "file", mime: "image/x-nikon-nef" },
  ".arw": { kind: "file", mime: "image/x-sony-arw" },
  ".dng": { kind: "file", mime: "image/x-adobe-dng" },
  ".raf": { kind: "file", mime: "image/x-fuji-raf" },
  ".orf": { kind: "file", mime: "image/x-olympus-orf" },
  ".rw2": { kind: "file", mime: "image/x-panasonic-rw2" },
  ".pptx": { kind: "file", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  ".docx": { kind: "file", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ".xlsx": { kind: "file", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  ".key": { kind: "file", mime: "application/octet-stream" },
  ".mp3": { kind: "file", mime: "audio/mpeg" },
  ".wav": { kind: "file", mime: "audio/wav" },
};

export function extensionOf(name: string): string {
  const m = /\.[a-z0-9]+$/i.exec(name.trim());
  return m ? m[0].toLowerCase() : "";
}

export function fileTypeOf(name: string): FileType | null {
  return VAULT_FILE_TYPES[extensionOf(name)] ?? null;
}

export const ACCEPT_ALL = Object.keys(VAULT_FILE_TYPES).join(",");
export const ACCEPT_IMAGES = Object.entries(VAULT_FILE_TYPES)
  .filter(([, t]) => t.kind === "image")
  .map(([ext]) => ext)
  .join(",");
export const ACCEPT_VIDEOS = Object.entries(VAULT_FILE_TYPES)
  .filter(([, t]) => t.kind === "video")
  .map(([ext]) => ext)
  .join(",");

export const DEFAULT_MAX_UPLOAD_MB = 500;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/** The URL prefix uploads are served under (nginx in production, a route in development). */
export const VAULT_MEDIA_PREFIX = "/media/vault/";
