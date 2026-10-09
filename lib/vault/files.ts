import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

import { UPLOADS_DIR } from "../db";
import { DEFAULT_MAX_UPLOAD_MB, extensionOf, fileTypeOf, VAULT_FILE_TYPES, VAULT_MEDIA_PREFIX } from "./media-types";
import type { VaultMedia } from "./types";

/**
 * Files uploaded for the Vault: stored in `.data/uploads/vault` (on the VPS a
 * symlink to /srv/markui/data, which nginx serves at /media/vault/), with a
 * web copy and a thumbnail made for every photo.
 */

export const VAULT_DIR = path.join(/* turbopackIgnore: true */ UPLOADS_DIR, "vault");

export class UploadError extends Error {}

export function maxUploadBytes() {
  const mb = Number(process.env.VAULT_MAX_UPLOAD_MB) || DEFAULT_MAX_UPLOAD_MB;
  return Math.max(1, mb) * 1024 * 1024;
}

const FILE_NAME = /^[a-f0-9-]{36}(-(display|thumb|poster))?\.[a-z0-9]+$/;

/** The absolute path of a stored file, or null when the name isn't one of ours. */
export function vaultFilePath(name: string): string | null {
  if (!FILE_NAME.test(name)) return null;
  const resolved = path.join(/* turbopackIgnore: true */ VAULT_DIR, name);
  return resolved.startsWith(VAULT_DIR + path.sep) ? resolved : null;
}

export function contentTypeOf(name: string): string {
  const ext = extensionOf(name);
  return VAULT_FILE_TYPES[ext]?.mime ?? "application/octet-stream";
}

/** Streams a request body to disk, stopping at `limit` bytes. */
async function writeBody(body: ReadableStream<Uint8Array>, dest: string, limit: number): Promise<number> {
  let bytes = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _enc, done) {
      bytes += chunk.length;
      if (bytes > limit) done(new UploadError(`That file is larger than ${Math.round(limit / 1024 / 1024)} MB.`));
      else done(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(body as unknown as WebReadableStream<Uint8Array>), counter, createWriteStream(dest));
  return bytes;
}

// sharp is loaded lazily and set to one job at a time: the server's memory cap
// is 1 GB and a 50-megapixel photo decodes to ~200 MB.
let sharpModule: typeof import("sharp") | null = null;
async function sharp() {
  if (!sharpModule) {
    sharpModule = (await import("sharp")).default;
    sharpModule.cache(false);
    sharpModule.concurrency(1);
  }
  return sharpModule;
}

let imageQueue: Promise<unknown> = Promise.resolve();
function queued<T>(fn: () => Promise<T>): Promise<T> {
  const run = imageQueue.then(fn, fn);
  imageQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

interface ImageInfo {
  width?: number;
  height?: number;
  displayUrl?: string;
  thumbUrl?: string;
}

const DISPLAY_EDGE = 2400;
const THUMB_EDGE = 720;

/** Size, a ≤2400px WebP copy and a 720px thumbnail of a stored photo. */
async function processImage(file: string, id: string, ext: string, convert: boolean): Promise<ImageInfo> {
  return queued(async () => {
    const s = await sharp();
    let input: Buffer | string = file;
    if (ext === ".heic" || ext === ".heif") {
      const heic = (await import("heic-convert")).default;
      const jpeg = await heic({ buffer: await fs.readFile(file), format: "JPEG", quality: 0.9 });
      input = Buffer.from(jpeg);
    }
    if (ext === ".svg") {
      const meta = await s(input).metadata().catch(() => null);
      return { width: meta?.width, height: meta?.height };
    }

    const animated = ext === ".gif";
    const meta = await s(input, { animated: false }).metadata();
    // EXIF orientation 5–8 means the stored pixels are rotated a quarter turn.
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;
    const longEdge = Math.max(width ?? 0, height ?? 0);
    const stat = typeof input === "string" ? await fs.stat(input) : { size: input.length };

    // A full-page website screenshot is many times taller than wide: its copy
    // is limited by width (WebP tops out at 16383px a side), a photo's by its
    // long edge.
    const tall = Boolean(width && height && height > width * 2.5);
    const display = tall
      ? { width: 1600, height: 16000, fit: "inside" as const }
      : { width: DISPLAY_EDGE, height: DISPLAY_EDGE, fit: "inside" as const };
    const thumb = tall
      ? { width: THUMB_EDGE, height: Math.round(THUMB_EDGE * 1.25), fit: "cover" as const, position: "top" as const }
      : { width: THUMB_EDGE, height: THUMB_EDGE, fit: "inside" as const };

    const info: ImageInfo = { width, height };
    if (convert || (!animated && (longEdge > DISPLAY_EDGE || stat.size > 1.5 * 1024 * 1024))) {
      const name = `${id}-display.webp`;
      await s(input, { limitInputPixels: 400_000_000 })
        .rotate()
        .resize({ ...display, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(/* turbopackIgnore: true */ VAULT_DIR, name));
      info.displayUrl = VAULT_MEDIA_PREFIX + name;
    }
    if (longEdge > THUMB_EDGE || convert || animated) {
      const name = `${id}-thumb.webp`;
      await s(input, { animated: false, limitInputPixels: 400_000_000 })
        .rotate()
        .resize({ ...thumb, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path.join(/* turbopackIgnore: true */ VAULT_DIR, name));
      info.thumbUrl = VAULT_MEDIA_PREFIX + name;
    }
    return info;
  });
}

/**
 * Stores one upload and returns its library row (not yet saved). Throws
 * `UploadError` with a message for the uploader.
 */
export async function storeUpload(
  body: ReadableStream<Uint8Array>,
  originalName: string,
): Promise<Omit<VaultMedia, "createdAt">> {
  const type = fileTypeOf(originalName);
  const ext = extensionOf(originalName);
  if (!type) {
    throw new UploadError(`"${originalName}" isn't a file type the Vault accepts.`);
  }

  await fs.mkdir(VAULT_DIR, { recursive: true });
  const id = randomUUID();
  const storedExt = ext === ".jpeg" ? ".jpg" : ext === ".tiff" ? ".tif" : ext;
  const name = `${id}${storedExt}`;
  const dest = path.join(/* turbopackIgnore: true */ VAULT_DIR, name);
  const part = `${dest}.part`;

  let bytes: number;
  try {
    bytes = await writeBody(body, part, maxUploadBytes());
    if (bytes === 0) throw new UploadError(`"${originalName}" is empty.`);
    await fs.rename(part, dest);
  } catch (error) {
    await fs.rm(part, { force: true });
    throw error;
  }

  let info: ImageInfo = {};
  if (type.kind === "image") {
    try {
      info = await processImage(dest, id, ext, Boolean(type.convert));
    } catch (error) {
      if (type.convert) {
        await removeStoredFiles(VAULT_MEDIA_PREFIX + name);
        throw new UploadError(`"${originalName}" couldn't be read as a photo.`);
      }
      // A photo sharp can't read is still kept and shown as it is.
      console.error("[vault] image processing failed", originalName, error);
    }
  }

  return {
    id,
    url: VAULT_MEDIA_PREFIX + name,
    kind: type.kind,
    name: originalName.slice(0, 200),
    mime: type.mime,
    bytes,
    width: info.width,
    height: info.height,
    displayUrl: info.displayUrl,
    thumbUrl: info.thumbUrl,
  };
}

/** Stores a video's poster frame (posted by the admin's browser) as WebP. */
export async function storePoster(body: ReadableStream<Uint8Array>, mediaId: string): Promise<string> {
  await fs.mkdir(VAULT_DIR, { recursive: true });
  const tmp = path.join(/* turbopackIgnore: true */ VAULT_DIR, `${randomUUID()}.part`);
  try {
    await writeBody(body, tmp, 15 * 1024 * 1024);
    const name = `${mediaId}-poster.webp`;
    await queued(async () => {
      const s = await sharp();
      await s(tmp)
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(/* turbopackIgnore: true */ VAULT_DIR, name));
    });
    return VAULT_MEDIA_PREFIX + name;
  } finally {
    await fs.rm(tmp, { force: true });
  }
}

/** Deletes a stored file and the copies made from it. */
export async function removeStoredFiles(url: string) {
  if (!url.startsWith(VAULT_MEDIA_PREFIX)) return;
  const id = /^([a-f0-9-]{36})/.exec(url.slice(VAULT_MEDIA_PREFIX.length))?.[1];
  if (!id) return;
  const names = await fs.readdir(VAULT_DIR).catch(() => [] as string[]);
  await Promise.all(
    names
      .filter((n) => n.startsWith(id))
      .map((n) => fs.rm(path.join(/* turbopackIgnore: true */ VAULT_DIR, n), { force: true })),
  );
}

/** How much the Vault's uploads take up, and how much room the disk has left. */
export async function diskUsage(): Promise<{ used: number; free: number | null }> {
  let used = 0;
  const names = await fs.readdir(VAULT_DIR).catch(() => [] as string[]);
  for (const n of names) {
    const st = await fs.stat(path.join(/* turbopackIgnore: true */ VAULT_DIR, n)).catch(() => null);
    if (st?.isFile()) used += st.size;
  }
  let free: number | null = null;
  try {
    await fs.mkdir(VAULT_DIR, { recursive: true });
    const st = await fs.statfs(VAULT_DIR);
    free = st.bavail * st.bsize;
  } catch {
    free = null;
  }
  return { used, free };
}
