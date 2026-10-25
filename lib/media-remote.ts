import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { UPLOADS_DIR } from "./db";

/**
 * Uploaded media lives on ServerByt, served by media.markui.lk; the site
 * itself stays on this server. Every upload is written here first (sharp
 * needs a file to read), then copied to ServerByt over SSH and checked by
 * SHA-256 there. Only after that check passes is the upload accepted, and
 * only then — when MEDIA_LOCAL_COPIES=remove — is the local copy dropped.
 *
 * Paths are the same on both sides, relative to the uploads folder:
 *   <uuid>.<ext>                               site uploads (/api/uploads/…)
 *   vault/<uuid>[-display|-thumb|-poster].<ext> Vault uploads (/media/vault/…)
 * so existing URLs in the database keep working: they are answered from the
 * local copy when there is one, and from media.markui.lk when there isn't.
 *
 * Settings (.env.local):
 *   MEDIA_REMOTE_HOST          user@host for SSH, e.g. markui.lk@ssh.us.stackcp.com
 *   MEDIA_REMOTE_DIR           folder on that host, relative to its home
 *   MEDIA_REMOTE_SSH_KEY       private key file (never in source or logs)
 *   MEDIA_REMOTE_KNOWN_HOSTS   pinned host key; unknown keys are refused
 *   MEDIA_PUBLIC_ORIGIN        https://media.markui.lk
 *   MEDIA_LOCAL_COPIES         "keep" (default) or "remove"
 *   MEDIA_REMOTE_REQUIRED      "1" (default): an upload fails if it can't be
 *                              stored remotely; "0": accept it and let the
 *                              sync timer copy it later
 * Without MEDIA_REMOTE_HOST (development) everything stays local.
 */

/** A storage path the app itself creates. Nothing else is ever sent to a shell. */
const MEDIA_PATH = /^(?:[0-9a-f-]{36}\.[a-z0-9]{1,10}|vault\/[0-9a-f-]{36}(?:-(?:display|thumb|poster))?\.[a-z0-9]{1,10})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isMediaPath(rel: string): boolean {
  return MEDIA_PATH.test(rel) && !rel.includes("..");
}

export class RemoteStorageError extends Error {}

interface RemoteConfig {
  host: string;
  dir: string;
  key: string;
  knownHosts: string;
}

function remoteConfig(): RemoteConfig | null {
  const host = process.env.MEDIA_REMOTE_HOST?.trim();
  const dir = process.env.MEDIA_REMOTE_DIR?.trim().replace(/\/+$/, "");
  const key = process.env.MEDIA_REMOTE_SSH_KEY?.trim();
  const knownHosts = process.env.MEDIA_REMOTE_KNOWN_HOSTS?.trim();
  if (!host || !dir || !key || !knownHosts) return null;
  // These end up in an ssh command line: allow only plain characters.
  if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(host)) return null;
  if (!/^[A-Za-z0-9._/-]+$/.test(dir) || dir.includes("..") || dir.startsWith("/")) return null;
  return { host, dir, key, knownHosts };
}

export function remoteEnabled(): boolean {
  return remoteConfig() !== null;
}

function remoteRequired(): boolean {
  return process.env.MEDIA_REMOTE_REQUIRED !== "0";
}

/** Whether a verified upload also stays on this server's disk. */
export function keepLocalCopies(): boolean {
  return process.env.MEDIA_LOCAL_COPIES !== "remove";
}

/** https://media.markui.lk, or null when not configured. */
export function mediaOrigin(): string | null {
  const raw = process.env.MEDIA_PUBLIC_ORIGIN?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.hostname === "localhost" ? url.origin : null;
  } catch {
    return null;
  }
}

export function localMediaPath(rel: string): string {
  if (!isMediaPath(rel)) throw new Error("not a media path");
  return path.join(/* turbopackIgnore: true */ UPLOADS_DIR, rel);
}

export async function sha256File(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

// ─── SSH ─────────────────────────────────────────────────────────────────────

interface SshResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runSsh(cfg: RemoteConfig, script: string, input: string | null, timeoutMs: number): Promise<SshResult> {
  return new Promise((resolve, reject) => {
    // Typed by hand: @types/node 20's spawn overloads collapse to `never` here.
    const child = (spawn as unknown as (cmd: string, args: string[], opts: object) => ChildProcessWithoutNullStreams)(
      "ssh",
      [
        "-F", "/dev/null",
        "-i", cfg.key,
        "-o", "IdentitiesOnly=yes",
        "-o", "BatchMode=yes",
        "-o", "StrictHostKeyChecking=yes",
        "-o", `UserKnownHostsFile=${cfg.knownHosts}`,
        "-o", "ConnectTimeout=20",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=4",
        "-o", "LogLevel=ERROR",
        cfg.host,
        script,
      ],
      { env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: process.env.HOME ?? "/tmp" } },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      if (stdout.length < 1_000_000) stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      if (stderr.length < 10_000) stderr += d.toString();
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.on("error", () => {
      // ssh died before reading everything; its exit code says why.
    });
    if (input === null) child.stdin.end();
    else {
      const file = createReadStream(input);
      file.on("error", () => child.kill("SIGKILL"));
      file.pipe(child.stdin);
    }
  });
}

/**
 * ServerByt now and then refuses a connection outright, or drops one, so
 * connection-level failures (ssh's own exit 255, a kill on timeout) are
 * retried with a pause. Exit codes from the remote script are answers and
 * returned as they are.
 */
async function sshWithRetry(cfg: RemoteConfig, script: string, input: string | null, timeoutMs: number, label: string) {
  const pauses = [3_000, 10_000, 30_000];
  let last: SshResult | null = null;
  for (let attempt = 0; attempt <= pauses.length; attempt++) {
    last = await runSsh(cfg, script, input, timeoutMs).catch((error: Error) => ({ code: null, stdout: "", stderr: error.message }));
    if (last.code !== null && last.code !== 255) return last;
    if (attempt < pauses.length) {
      console.warn(`[media] ${label}: connection attempt ${attempt + 1} failed (${last.stderr.trim().slice(0, 200) || "timeout"}), retrying`);
      await new Promise((r) => setTimeout(r, pauses[attempt]));
    }
  }
  return last!;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Copies one stored file to ServerByt and checks it there. Written under a
 * hidden temporary name, checked, then linked into place — `ln` refuses to
 * replace an existing file, so a different file with the same name is
 * reported, never overwritten. Resolves only once the remote file's SHA-256
 * matches the local one.
 */
export async function pushToRemote(rel: string): Promise<{ sha256: string; bytes: number }> {
  const cfg = remoteConfig();
  if (!cfg) throw new RemoteStorageError("Remote media storage is not configured.");
  const local = localMediaPath(rel);
  const stat = await fs.stat(local);
  const sha = await sha256File(local);
  const dir = rel.startsWith("vault/") ? "vault" : ".";
  const base = path.posix.basename(rel);

  const script = [
    "set -e",
    `cd '${cfg.dir}'`,
    `mkdir -p '${dir}'`,
    `f='${rel}'`,
    `t='${dir}/.${base}.'$$'.part'`,
    `trap 'rm -f "$t"' EXIT`,
    `cat > "$t"`,
    `h=$(sha256sum "$t" | cut -d' ' -f1)`,
    `if [ "$h" != '${sha}' ]; then echo "PUSH corrupt"; exit 3; fi`,
    `chmod 644 "$t"`,
    `if ln "$t" "$f" 2>/dev/null; then r=stored; else r=exists; fi`,
    `v=$(sha256sum "$f" | cut -d' ' -f1)`,
    `if [ "$v" != '${sha}' ]; then echo "PUSH conflict"; exit 4; fi`,
    `echo "PUSH ok $r"`,
  ].join("; ");

  // At least ~200 KB/s, plus a minute for the connection and the checksums.
  const timeout = 60_000 + Math.ceil(stat.size / (200 * 1024)) * 1000;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await sshWithRetry(cfg, script, local, timeout, `upload ${rel}`);
    if (res.code === 0 && /PUSH ok/.test(res.stdout)) return { sha256: sha, bytes: stat.size };
    if (res.code === 4) {
      throw new RemoteStorageError(`${rel} already exists on the media server with different contents.`);
    }
    // 3: damaged in transit. Anything else: try the whole copy again.
    console.warn(`[media] upload ${rel}: attempt ${attempt} failed (exit ${res.code}) ${res.stdout.trim()} ${res.stderr.trim().slice(0, 200)}`);
  }
  throw new RemoteStorageError(`Couldn't copy ${rel} to the media server.`);
}

/**
 * The step after a file is written locally: copy it to ServerByt and verify
 * it, then drop the local copy when configured to. A failure keeps every
 * local file (the sync timer copies it later) and — unless
 * MEDIA_REMOTE_REQUIRED=0 — rejects the upload, so nothing points at media
 * the media server doesn't have.
 */
export async function commitToRemote(rels: string[]): Promise<void> {
  if (!remoteEnabled() || !rels.length) return;
  try {
    for (const rel of rels) await pushToRemote(rel);
  } catch (error) {
    console.error("[media] remote copy failed; local files kept for the sync timer:", rels.join(", "), (error as Error).message);
    if (remoteRequired()) throw error instanceof RemoteStorageError ? error : new RemoteStorageError((error as Error).message);
    return;
  }
  if (!keepLocalCopies()) {
    for (const rel of rels) await fs.rm(localMediaPath(rel), { force: true });
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

async function trashRemote(targets: string[], label: string) {
  const cfg = remoteConfig();
  if (!cfg || !targets.length) return;
  // Deleted media is moved out of the public folder into a dated trash
  // folder in the ServerByt home rather than erased, so a mistaken delete
  // can be undone by hand.
  const day = new Date().toISOString().slice(0, 10);
  const script = [
    `cd '${cfg.dir}'`,
    `d="$HOME/markui-media-trash/${day}"`,
    `mkdir -p "$d"`,
    "n=0",
    `for f in ${targets.join(" ")}; do if [ -f "$f" ]; then mv -f "$f" "$d/$(printf '%s' "$f" | tr / _)" && n=$((n+1)); fi; done`,
    `echo "TRASHED $n"`,
  ].join("; ");
  const res = await sshWithRetry(cfg, script, null, 60_000, `delete ${label}`);
  if (res.code !== 0) {
    // The file stays on ServerByt; nothing is lost, it's just not removed.
    console.error(`[media] couldn't remove ${label} from the media server (exit ${res.code}): ${res.stderr.trim().slice(0, 200)}`);
  }
}

// media.markui.lk sits behind StackCDN, which keeps a file for a year (it
// never changes), so a file moved to the trash on ServerByt can still be
// served from the CDN's cache. Deleted uploads are therefore remembered here,
// by their UUID (never reused), and answered 404 without asking ServerByt.
const DELETED_IDS = path.join(/* turbopackIgnore: true */ UPLOADS_DIR, ".deleted-ids");
let deletedCache: { mtimeMs: number; ids: Set<string> } | null = null;

function uuidOf(rel: string): string | null {
  return /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.exec(rel)?.[1] ?? null;
}

async function isDeleted(rel: string): Promise<boolean> {
  const id = uuidOf(rel);
  if (!id) return false;
  const stat = await fs.stat(DELETED_IDS).catch(() => null);
  if (!stat) return false;
  if (!deletedCache || deletedCache.mtimeMs !== stat.mtimeMs) {
    const text = await fs.readFile(DELETED_IDS, "utf8").catch(() => "");
    deletedCache = { mtimeMs: stat.mtimeMs, ids: new Set(text.split("\n").filter((l) => UUID.test(l))) };
  }
  return deletedCache.ids.has(id);
}

async function markDeleted(ids: (string | null)[]) {
  const valid = [...new Set(ids.filter((id): id is string => Boolean(id && UUID.test(id))))];
  if (!valid.length) return;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.appendFile(DELETED_IDS, valid.map((id) => `${id}\n`).join(""));
}

/** Moves stored files on ServerByt to its trash folder. */
export async function removeFromRemote(rels: string[]) {
  const safe = rels.filter(isMediaPath);
  await markDeleted(safe.map(uuidOf));
  await trashRemote(safe.map((r) => `'${r}'`), safe.join(", "));
}

/** Moves a Vault upload and every copy made from it to the trash folder. */
export async function removeVaultIdFromRemote(id: string) {
  if (!UUID.test(id)) return;
  await markDeleted([id]);
  // A glob on purpose: the copies (display, thumb, poster) differ per file.
  await trashRemote([`vault/${id}.*`, `vault/${id}-*`], `vault/${id}*`);
}

// ─── Read ────────────────────────────────────────────────────────────────────

/** An error or challenge page (e.g. StackProtect, if re-enabled): anything that isn't the file. */
function looksLikeMedia(res: Response) {
  const type = res.headers.get("content-type") ?? "";
  return (res.status === 200 || res.status === 206) && !type.startsWith("text/html");
}

// Every request from this app reaches ServerByt from the same address, which
// its rate limiting once throttled with 429s (since switched off for this
// hosting package). As a safeguard, requests to it wait their turn — at most
// REMOTE_SLOTS waiting on headers at once — and a 429 or 503 is retried after
// a pause instead of becoming a broken image.
const REMOTE_SLOTS = Math.max(1, Number(process.env.MEDIA_REMOTE_FETCH_CONCURRENCY) || 3);
let activeSlots = 0;
const waiting: (() => void)[] = [];

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeSlots >= REMOTE_SLOTS) await new Promise<void>((resolve) => waiting.push(resolve));
  activeSlots++;
  try {
    return await fn();
  } finally {
    activeSlots--;
    waiting.shift()?.();
  }
}

const RETRY_PAUSES = [1_000, 2_500, 5_000, 8_000];

/**
 * Fetches a file from media.markui.lk. Times out on the headers only, so a
 * long video can stream; retries a rate-limited (429) or unavailable (503)
 * answer, honouring Retry-After up to 10 seconds.
 */
async function fetchRemote(rel: string, range: string | null): Promise<Response | null> {
  const origin = mediaOrigin();
  if (!origin) return null;
  for (let attempt = 0; ; attempt++) {
    const res = await slot(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      try {
        return await fetch(`${origin}/${rel}`, {
          headers: { "user-agent": "markui-media/1.0", ...(range ? { range } : {}) },
          redirect: "error",
          signal: controller.signal,
        });
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    });
    if (!res || (res.status !== 429 && res.status !== 503) || attempt >= RETRY_PAUSES.length) return res;
    await res.body?.cancel();
    const after = Number(res.headers.get("retry-after"));
    const pause = Number.isFinite(after) && after > 0 ? Math.min(after * 1000, 10_000) : RETRY_PAUSES[attempt];
    await new Promise((r) => setTimeout(r, pause));
  }
}

/**
 * Answers a request for a stored file: off local disk when it's there, else
 * from media.markui.lk, passing Range through so video can seek. `headers`
 * are the caller's Content-Type, caching and security headers.
 */
export async function mediaResponse(rel: string, request: Request, headers: Record<string, string>): Promise<Response> {
  if (!isMediaPath(rel)) return new Response("Not found", { status: 404 });
  const range = request.headers.get("range");

  const file = localMediaPath(rel);
  const stat = await fs.stat(file).catch(() => null);
  if (stat?.isFile()) {
    const base = { ...headers, "Accept-Ranges": "bytes", "X-Media-Source": "local" };
    const m = /^bytes=(\d*)-(\d*)$/.exec(range ?? "");
    if (m && (m[1] || m[2])) {
      let start = m[1] ? Number(m[1]) : stat.size - Number(m[2]);
      let end = m[1] && m[2] ? Number(m[2]) : stat.size - 1;
      start = Math.max(0, start);
      end = Math.min(end, stat.size - 1);
      if (start > end) {
        return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${stat.size}` } });
      }
      const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
      return new Response(stream, {
        status: 206,
        headers: { ...base, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
      });
    }
    const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
    return new Response(stream, { headers: { ...base, "Content-Length": String(stat.size) } });
  }

  if (await isDeleted(rel)) return new Response("Not found", { status: 404 });
  const res = await fetchRemote(rel, range);
  if (!res) return new Response("Not found", { status: 404 });
  if (res.status === 416) {
    await res.body?.cancel();
    return new Response(null, { status: 416, headers: { "Content-Range": res.headers.get("content-range") ?? "bytes */0" } });
  }
  if (!looksLikeMedia(res)) {
    await res.body?.cancel();
    if (res.status !== 404) console.error(`[media] media server answered ${res.status} (${res.headers.get("content-type")}) for ${rel}`);
    return new Response(res.status === 404 ? "Not found" : "Media temporarily unavailable", { status: res.status === 404 ? 404 : 502 });
  }
  const out: Record<string, string> = { ...headers, "Accept-Ranges": "bytes", "X-Media-Source": "remote" };
  for (const h of ["content-length", "content-range", "last-modified", "etag"]) {
    const v = res.headers.get(h);
    if (v) out[h] = v;
  }
  return new Response(res.body, { status: res.status, headers: out });
}

/** A stored file as a stream, for ZIP downloads: local first, else media.markui.lk. */
export async function openMedia(rel: string): Promise<{ body: ReadableStream<Uint8Array>; size?: number; lastModified: Date } | null> {
  if (!isMediaPath(rel)) return null;
  const file = localMediaPath(rel);
  const stat = await fs.stat(file).catch(() => null);
  if (stat?.isFile()) {
    return {
      body: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
      size: stat.size,
      lastModified: stat.mtime,
    };
  }
  if (await isDeleted(rel)) return null;
  const res = await fetchRemote(rel, null);
  if (!res?.body || !looksLikeMedia(res)) {
    await res?.body?.cancel();
    return null;
  }
  const length = Number(res.headers.get("content-length"));
  const modified = new Date(res.headers.get("last-modified") ?? "");
  // Only trust the length when nothing re-encoded the body on the way.
  const encoded = Boolean(res.headers.get("content-encoding"));
  return {
    body: res.body,
    size: !encoded && Number.isFinite(length) && length > 0 ? length : undefined,
    lastModified: Number.isNaN(modified.getTime()) ? new Date() : modified,
  };
}

// ─── Usage ───────────────────────────────────────────────────────────────────

let usageCache: { at: number; value: { vault: number; site: number } | null } | null = null;

/** Bytes stored on ServerByt (Vault, and site uploads), cached for 10 minutes. */
export async function remoteUsage(): Promise<{ vault: number; site: number } | null> {
  const cfg = remoteConfig();
  if (!cfg) return null;
  if (usageCache && Date.now() - usageCache.at < 10 * 60_000) return usageCache.value;
  const script = `cd '${cfg.dir}' && du -sb vault . 2>/dev/null`;
  const res = await runSsh(cfg, script, null, 30_000).catch(() => null);
  let value: { vault: number; site: number } | null = null;
  if (res?.code === 0) {
    const sizes = Object.fromEntries(
      res.stdout
        .trim()
        .split("\n")
        .map((line) => line.split(/\s+/))
        .map(([bytes, name]) => [name, Number(bytes)]),
    );
    if (Number.isFinite(sizes.vault) && Number.isFinite(sizes["."])) {
      value = { vault: sizes.vault, site: sizes["."] - sizes.vault };
    }
  }
  usageCache = { at: Date.now(), value };
  return value;
}
