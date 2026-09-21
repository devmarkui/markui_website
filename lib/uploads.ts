import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { UPLOADS_DIR } from "./db";
import {
  CONTENT_TYPES,
  IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  VIDEO_TYPES,
} from "./media";
import type { MediaItem } from "./types";

/**
 * Media uploaded from the admin dashboard is stored in `.data/uploads` and
 * served back through `/api/uploads/<file>`. Writing outside `public/` keeps the
 * files readable after a rebuild and keeps the dev server from recompiling
 * whenever the admin saves something.
 */

export const UPLOAD_URL_PREFIX = "/api/uploads/";

export class UploadError extends Error {}

/** A `File` that a browser sends for an empty file input has size 0. */
export function isFilled(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

/**
 * Persists one uploaded file and returns the media item pointing at it.
 * Throws `UploadError` with a human-readable message on invalid input.
 */
export async function saveUpload(
  file: File,
  allow: "image" | "media" = "media",
): Promise<MediaItem> {
  const isImage = file.type in IMAGE_TYPES;
  const isVideo = file.type in VIDEO_TYPES;

  if (allow === "image" && !isImage) {
    throw new UploadError(
      `"${file.name}" is not a supported image (use JPG, PNG, WEBP, GIF or AVIF).`,
    );
  }
  if (!isImage && !isVideo) {
    throw new UploadError(
      `"${file.name}" is not a supported image or video file.`,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `"${file.name}" is larger than ${MAX_UPLOAD_MB}MB.`,
    );
  }

  const ext = isImage ? IMAGE_TYPES[file.type] : VIDEO_TYPES[file.type];
  const filename = `${randomUUID()}${ext}`;

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(UPLOADS_DIR, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  return {
    url: `${UPLOAD_URL_PREFIX}${filename}`,
    type: isImage ? "image" : "video",
    name: file.name,
  };
}

/**
 * Removes a file this app previously stored. Paths under `public/` (the seeded
 * demo thumbnails) and anything else are left alone, and a missing file is not
 * an error — deleting a project should never fail over its leftover media.
 */
export async function deleteUpload(url: string | undefined | null) {
  if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) return;

  const filename = path.basename(url.slice(UPLOAD_URL_PREFIX.length));
  if (!filename || filename.includes("/") || filename.startsWith(".")) return;

  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    // Already gone — nothing to clean up.
  }
}

/**
 * Resolves a requested upload filename to an absolute path, or `null` if it
 * escapes the uploads directory or has an extension we do not serve.
 */
export function resolveUploadPath(segments: string[]): string | null {
  if (segments.length !== 1) return null;

  const filename = segments[0];
  if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return null;
  }
  if (!(path.extname(filename).toLowerCase() in CONTENT_TYPES)) return null;

  const resolved = path.join(UPLOADS_DIR, filename);
  return resolved.startsWith(UPLOADS_DIR + path.sep) ? resolved : null;
}
