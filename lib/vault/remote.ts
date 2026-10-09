import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { driveFolderId, isGooglePhotosUrl, parseMediaUrl } from "./embeds";
import type { AlbumItem } from "./types";

/**
 * Everything the Vault fetches from other sites, server side: expanding short
 * links, listing Google Drive folders and Google Photos albums, and checking
 * whether a website can be shown in a frame.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

async function get(url: string, init: RequestInit & { timeout?: number } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeout ?? 15000);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "user-agent": UA, "accept-language": "en", ...(init.headers ?? {}) },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

export class RemoteError extends Error {}

/** Loopback, private, link-local and other addresses that aren't the public internet. */
function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80")) return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(a);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  );
}

/**
 * Links typed in the dashboard are fetched from the server (website checks,
 * short links), so they must point at the public internet, never at this
 * machine or its network — at every redirect, too.
 */
async function assertPublic(url: string) {
  const { protocol, hostname } = new URL(url);
  if (protocol !== "https:" && protocol !== "http:") throw new RemoteError("Only web links can be checked.");
  const host = hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (!addresses.length || addresses.some(isPrivateAddress)) throw new RemoteError("That address isn't on the public internet.");
}

/** GET that follows redirects by hand, checking each hop is public. */
async function getPublic(url: string, init: RequestInit & { timeout?: number } = {}) {
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    await assertPublic(current);
    const res = await get(current, { ...init, redirect: "manual" });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return res;
    res.body?.cancel().catch(() => undefined);
    current = new URL(location, current).toString();
  }
  throw new RemoteError("That link redirects too many times.");
}

// ─── Short links ─────────────────────────────────────────────────────────────

/**
 * fb.watch, facebook.com/share/…, vm.tiktok.com and the like hide the real
 * address behind a redirect. Follows it and returns the full link, or the
 * link unchanged when it can't be expanded.
 */
export async function expandShortLink(raw: string): Promise<string> {
  const parsed = parseMediaUrl(raw);
  if (!parsed?.needsResolve) return raw;
  try {
    let current = raw;
    for (let hop = 0; hop < 6; hop++) {
      await assertPublic(current);
      const res = await get(current, { redirect: "manual", timeout: 8000 });
      const location = res.headers.get("location");
      if (!location) break;
      const next = new URL(location, current);
      // Facebook sends anonymous visitors to the login page with the real
      // address in `next`.
      const inner = next.searchParams.get("next");
      current = /\/login/.test(next.pathname) && inner ? inner : next.toString();
      const again = parseMediaUrl(current);
      if (again && !again.needsResolve) return current;
    }
  } catch {
    // Left as typed; the page shows a "Watch on …" link for it.
  }
  return raw;
}

// ─── Google Drive ────────────────────────────────────────────────────────────

const FOLDER_MIME = "application/vnd.google-apps.folder";
const IMAGE_NAME = /\.(jpe?g|png|webp|gif|heic|heif|tiff?|avif)$/i;
const VIDEO_NAME = /\.(mp4|mov|m4v|webm|avi|mkv)$/i;
const MAX_ITEMS = 2000;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number; time?: string };
  videoMediaMetadata?: { width?: number; height?: number };
}

async function driveList(folderId: string, key: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, imageMediaMetadata(width, height, rotation, time), videoMediaMetadata(width, height))",
      pageSize: "1000",
      orderBy: "name_natural",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      key,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await get(`https://www.googleapis.com/drive/v3/files?${params}`);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string; status?: string } };
      const message = body.error?.message ?? res.statusText;
      if (res.status === 404) throw new RemoteError(SHARE_HINT);
      if (/has not been used|is disabled/i.test(message)) {
        throw new RemoteError("The Google Drive API isn't switched on for the API key's Google Cloud project.");
      }
      if (/API key not valid/i.test(message)) throw new RemoteError("GOOGLE_DRIVE_API_KEY is not a valid API key.");
      throw new RemoteError(`Google Drive said: ${message}`);
    }
    const page = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(page.files ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken && files.length < MAX_ITEMS);
  return files;
}

const SHARE_HINT =
  "Google Drive won't show this folder. Open it in Drive → Share → General access → \"Anyone with the link\" (Viewer), then sync again.";

function toItem(file: DriveFile, folder?: string): AlbumItem | null {
  const isImage = file.mimeType.startsWith("image/") || IMAGE_NAME.test(file.name);
  const isVideo = file.mimeType.startsWith("video/") || VIDEO_NAME.test(file.name);
  if (!isImage && !isVideo) return null;
  const meta = isImage ? file.imageMediaMetadata : file.videoMediaMetadata;
  const turned = isImage && (file.imageMediaMetadata?.rotation ?? 0) % 2 === 1;
  const item: AlbumItem = { id: file.id, kind: isImage ? "image" : "video", name: file.name };
  if (meta?.width && meta?.height) {
    item.w = turned ? meta.height : meta.width;
    item.h = turned ? meta.width : meta.height;
  }
  if (folder) item.folder = folder;
  if (file.imageMediaMetadata?.time) item.takenAt = file.imageMediaMetadata.time;
  return item;
}

/** Lists a public Drive folder with the Drive API (needs GOOGLE_DRIVE_API_KEY). */
async function listDriveWithKey(folderId: string, key: string): Promise<AlbumItem[]> {
  const top = await driveList(folderId, key);
  const items: AlbumItem[] = [];
  for (const file of top) {
    if (file.mimeType === FOLDER_MIME) continue;
    const item = toItem(file);
    if (item) items.push(item);
  }
  // One level of subfolders, which become the gallery's chapters.
  for (const folder of top.filter((f) => f.mimeType === FOLDER_MIME)) {
    if (items.length >= MAX_ITEMS) break;
    const inner = await driveList(folder.id, key);
    for (const file of inner) {
      const item = file.mimeType === FOLDER_MIME ? null : toItem(file, folder.name);
      if (item) items.push(item);
    }
  }
  return items.slice(0, MAX_ITEMS);
}

function decodeHtml(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Without an API key: Drive's embeddable folder view lists a public folder's
 * files by id and name. No sizes, so the gallery measures each photo as it
 * loads.
 */
async function listDriveEmbedded(folderId: string, depth = 0, folder?: string): Promise<AlbumItem[]> {
  const res = await get(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  if (!res.ok) throw new RemoteError(SHARE_HINT);
  const html = await res.text();
  if (!html.includes("flip-entry")) {
    if (/ServiceLogin|accounts\.google\.com/.test(html)) throw new RemoteError(SHARE_HINT);
    return [];
  }
  const items: AlbumItem[] = [];
  const subfolders: { id: string; name: string }[] = [];
  const entry = /<div class="flip-entry" id="entry-([\w-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  for (const m of html.matchAll(entry)) {
    const [, id, href, rawName] = m;
    const name = decodeHtml(rawName).trim();
    if (href.includes("/folders/")) subfolders.push({ id, name });
    else if (IMAGE_NAME.test(name)) items.push({ id, kind: "image", name, ...(folder ? { folder } : {}) });
    else if (VIDEO_NAME.test(name)) items.push({ id, kind: "video", name, ...(folder ? { folder } : {}) });
  }
  if (depth === 0) {
    for (const sub of subfolders) {
      if (items.length >= MAX_ITEMS) break;
      items.push(...(await listDriveEmbedded(sub.id, 1, sub.name)));
    }
  }
  return items.slice(0, MAX_ITEMS);
}

export async function listDriveFolder(folderId: string): Promise<AlbumItem[]> {
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  return key ? listDriveWithKey(folderId, key) : listDriveEmbedded(folderId);
}

// ─── Google Photos ───────────────────────────────────────────────────────────

/**
 * A shared Google Photos album, read from its public page. Google closed the
 * API for shared albums on 2025-03-31, so this depends on the page's markup
 * and may need adjusting if Google changes it. Drive folders are sturdier.
 */
export async function listGooglePhotosAlbum(url: string): Promise<AlbumItem[]> {
  const res = await get(url, { redirect: "follow", timeout: 20000 });
  if (!res.ok) throw new RemoteError("Google Photos didn't open that album. Check that it is shared by link.");
  const html = (await res.text()).replace(/\\u003d/g, "=").replace(/\\u0026/g, "&").replace(/\\\//g, "/");

  const items: AlbumItem[] = [];
  const seen = new Set<string>();
  // Each photo appears in the page data as ["AF1Qip…",["https://lh3…/pw/…",width,height,…
  const entry = /\["(AF1Qip[\w-]+)",\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[\w-]+)",(\d+),(\d+)/g;
  for (const m of html.matchAll(entry)) {
    const [, id, src, w, h] = m;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({ id, kind: "image", src, w: Number(w), h: Number(h) });
  }
  if (!items.length) {
    // Older markup: any full-size photo link on the page.
    for (const m of html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/pw\/[\w-]{40,}/g)) {
      const src = m[0];
      const id = src.slice(-40);
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({ id, kind: "image", src });
    }
  }
  if (!items.length) {
    throw new RemoteError("No photos were found in that album. Check that it is shared by link and isn't empty.");
  }
  return items.slice(0, MAX_ITEMS);
}

export async function listAlbum(url: string): Promise<AlbumItem[]> {
  const folder = driveFolderId(url);
  if (folder) return listDriveFolder(folder);
  if (isGooglePhotosUrl(url)) return listGooglePhotosAlbum(url);
  throw new RemoteError("Paste a Google Drive folder link or a Google Photos album link.");
}

// ─── Websites ────────────────────────────────────────────────────────────────

/**
 * Whether a site lets other sites show it in a frame: no X-Frame-Options and
 * no CSP frame-ancestors that would leave the Vault out.
 */
export async function checkFrameable(url: string, vaultOrigin: string): Promise<boolean> {
  const res = await getPublic(url, { timeout: 12000 });
  // Only the headers are needed.
  res.body?.cancel().catch(() => undefined);
  const xfo = res.headers.get("x-frame-options")?.toLowerCase() ?? "";
  if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;
  const csp = res.headers.get("content-security-policy") ?? "";
  const directive = csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith("frame-ancestors"));
  if (!directive) return true;
  const sources = directive.split(/\s+/).slice(1);
  if (sources.includes("*")) return true;
  const vaultHost = new URL(vaultOrigin).host;
  return sources.some((s) => {
    const clean = s.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return clean === vaultHost || (clean.startsWith("*.") && vaultHost.endsWith(clean.slice(1)));
  });
}

/**
 * A full-page screenshot through Microlink (free for light use; set
 * MICROLINK_API_KEY for more). Returns the image as a stream.
 */
export async function captureScreenshot(
  url: string,
  device: "desktop" | "mobile",
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.MICROLINK_API_KEY?.trim();
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "false",
    "screenshot.fullPage": "true",
    "screenshot.type": "jpeg",
    waitForTimeout: "2500",
    "viewport.width": device === "desktop" ? "1440" : "390",
    "viewport.height": device === "desktop" ? "900" : "844",
    "viewport.deviceScaleFactor": device === "desktop" ? "1" : "2",
    "viewport.isMobile": device === "mobile" ? "true" : "false",
  });
  const endpoint = key ? "https://pro.microlink.io" : "https://api.microlink.io";
  const res = await get(`${endpoint}/?${params}`, {
    timeout: 90000,
    headers: key ? { "x-api-key": key } : {},
  });
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: { screenshot?: { url?: string } };
  };
  const shot = body.data?.screenshot?.url;
  if (body.status !== "success" || !shot) {
    throw new RemoteError(
      res.status === 429
        ? "The free screenshot allowance for today is used up. Upload screenshots instead, or set MICROLINK_API_KEY."
        : `The screenshot couldn't be taken${body.message ? `: ${body.message}` : "."}`,
    );
  }
  const image = await get(shot, { timeout: 60000 });
  if (!image.ok || !image.body) throw new RemoteError("The screenshot couldn't be downloaded.");
  return image.body;
}
