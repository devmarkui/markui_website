/**
 * Upload constraints shared by the server (validation) and the admin forms
 * (`accept` attributes and hint text).
 *
 * Deliberately free of Node imports: the admin editors are Client Components,
 * so anything they import gets bundled for the browser.
 */

/** 25 MB — matches `serverActions.bodySizeLimit` in `next.config.ts`. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Accepted image MIME types → the extension we store them under. */
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/** Extension → content type, used when serving a stored file back. */
export const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export const ACCEPT_IMAGE = Object.keys(IMAGE_TYPES).join(",");

export const ACCEPT_VIDEO = Object.keys(VIDEO_TYPES).join(",");

export const ACCEPT_MEDIA = [
  ...Object.keys(IMAGE_TYPES),
  ...Object.keys(VIDEO_TYPES),
].join(",");

export const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);
