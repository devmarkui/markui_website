import { randomUUID } from "node:crypto";

import type { RowDataPacket } from "mysql2/promise";

import { withClient } from "../mysql-store";
import { isValidVaultSlug } from "./links";
import { sanitizeSettings, type ProjectFields } from "./sanitize";
import {
  DEFAULT_VAULT_SETTINGS,
  type AlbumItem,
  type AlbumStatus,
  type VaultAlbum,
  type VaultMedia,
  type VaultProject,
  type VaultSettings,
} from "./types";

/**
 * The Vault's tables (database/migrations/005-creative-vault.sql), read and
 * written row by row. They sit beside the main site's store (lib/db.ts), which
 * loads and rewrites its whole document on every save; Vault projects carry
 * large JSON sections and are edited one at a time, so they don't join it.
 */

type Row = RowDataPacket & Record<string, unknown>;

const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value ?? ""));

/** mysql2 hands JSON columns back parsed; older servers return strings. */
function json<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toProject(r: Row): VaultProject {
  return {
    id: r.id as string,
    slug: r.slug as string,
    previousSlugs: json<string[]>(r.previous_slugs, []),
    title: r.title as string,
    client: (r.client as string) ?? "",
    serviceId: (r.service_id as string) ?? "",
    template: (r.template as string) ?? "general",
    summary: (r.summary as string) ?? "",
    location: (r.location as string) ?? "",
    date: (r.project_date as string | null) ?? "",
    cover: json(r.cover, null),
    accent: (r.accent as string) ?? "",
    facts: json(r.facts, []),
    links: json(r.links, []),
    blocks: json(r.blocks, []),
    status: r.status as VaultProject["status"],
    featured: Boolean(r.featured),
    order: r.sort_order as number,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    publishedAt: r.published_at ? iso(r.published_at) : undefined,
  };
}

// ─── Projects ────────────────────────────────────────────────────────────────

/** Every project, in the order set in the dashboard. */
export async function listVaultProjects(): Promise<VaultProject[]> {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT * FROM vault_projects ORDER BY sort_order, created_at DESC");
    return rows.map(toProject);
  });
}

/** What the Vault's front page lists: published only, featured first. */
export async function listPublishedVaultProjects(): Promise<VaultProject[]> {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>(
      "SELECT * FROM vault_projects WHERE status = 'published' ORDER BY featured DESC, sort_order, created_at DESC",
    );
    return rows.map(toProject);
  });
}

export async function getVaultProject(id: string): Promise<VaultProject | null> {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT * FROM vault_projects WHERE id = ?", [id]);
    return rows[0] ? toProject(rows[0]) : null;
  });
}

/**
 * The project at `slug`, or the one that used to live there (so old links
 * redirect). Drafts are never returned here; they open through a preview link.
 */
export async function findVaultProjectBySlug(
  slug: string,
): Promise<{ project: VaultProject; moved: boolean } | null> {
  if (!/^[a-z0-9-]{1,191}$/.test(slug)) return null;
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>(
      "SELECT * FROM vault_projects WHERE slug = ? AND status <> 'draft'",
      [slug],
    );
    if (rows[0]) return { project: toProject(rows[0]), moved: false };
    const [old] = await c.query<Row[]>(
      "SELECT * FROM vault_projects WHERE JSON_CONTAINS(previous_slugs, JSON_QUOTE(?)) AND status <> 'draft' ORDER BY updated_at DESC LIMIT 1",
      [slug],
    );
    return old[0] ? { project: toProject(old[0]), moved: true } : null;
  });
}

export class VaultError extends Error {}

async function slugTaken(slug: string, exceptId?: string) {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT id FROM vault_projects WHERE slug = ? AND id <> ?", [
      slug,
      exceptId ?? "",
    ]);
    return rows.length > 0;
  });
}

/** `base`, or `base-2`, `base-3` … whichever is free. */
export async function freeSlug(base: string, exceptId?: string): Promise<string> {
  const root = isValidVaultSlug(base) ? base : `${base || "project"}-work`.replace(/^-+/, "");
  let candidate = root;
  for (let n = 2; await slugTaken(candidate, exceptId); n++) candidate = `${root}-${n}`;
  return candidate;
}

function checkSlug(slug: string) {
  if (!isValidVaultSlug(slug)) {
    throw new VaultError(
      "The link can only use lowercase letters, numbers and single hyphens, and can't be a reserved word such as admin, api, media or projects.",
    );
  }
}

const COLUMNS = (f: ProjectFields) => ({
  slug: f.slug,
  title: f.title,
  client: f.client,
  service_id: f.serviceId,
  template: f.template,
  summary: f.summary,
  location: f.location,
  project_date: f.date || null,
  cover: f.cover ? JSON.stringify(f.cover) : null,
  accent: f.accent,
  facts: JSON.stringify(f.facts),
  links: JSON.stringify(f.links),
  blocks: JSON.stringify(f.blocks),
  status: f.status,
  featured: f.featured,
});

export async function createVaultProject(fields: ProjectFields): Promise<VaultProject> {
  if (!fields.title) throw new VaultError("Give the project a title.");
  checkSlug(fields.slug);
  const slug = await freeSlug(fields.slug);
  const id = randomUUID();
  await withClient(async (c) => {
    // New projects go to the top of the list.
    const [[min]] = await c.query<Row[]>("SELECT COALESCE(MIN(sort_order), 1) - 1 AS n FROM vault_projects");
    const cols = { ...COLUMNS({ ...fields, slug }), id, sort_order: min.n as number };
    await c.query(
      `INSERT INTO vault_projects (${Object.keys(cols).join(", ")}, published_at) VALUES (${Object.keys(cols)
        .map(() => "?")
        .join(", ")}, ${fields.status === "published" ? "CURRENT_TIMESTAMP(3)" : "NULL"})`,
      Object.values(cols),
    );
  });
  return (await getVaultProject(id))!;
}

export async function updateVaultProject(id: string, fields: ProjectFields): Promise<VaultProject> {
  const current = await getVaultProject(id);
  if (!current) throw new VaultError("That project no longer exists.");
  if (!fields.title) throw new VaultError("Give the project a title.");
  checkSlug(fields.slug);
  if (await slugTaken(fields.slug, id)) {
    throw new VaultError(`Another project already uses the link /${fields.slug}.`);
  }

  // A changed link keeps the old one as a redirect.
  const previous = new Set(current.previousSlugs);
  if (fields.slug !== current.slug) previous.add(current.slug);
  previous.delete(fields.slug);

  const cols = { ...COLUMNS(fields), previous_slugs: JSON.stringify([...previous].slice(-20)) };
  await withClient((c) =>
    c.query(
      `UPDATE vault_projects SET ${Object.keys(cols)
        .map((k) => `${k} = ?`)
        .join(", ")}, published_at = COALESCE(published_at, ${
        fields.status === "published" ? "CURRENT_TIMESTAMP(3)" : "NULL"
      }) WHERE id = ?`,
      [...Object.values(cols), id],
    ),
  );
  return (await getVaultProject(id))!;
}

export async function setVaultProjectFlags(
  id: string,
  flags: { status?: VaultProject["status"]; featured?: boolean },
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (flags.status) {
    sets.push("status = ?");
    values.push(flags.status);
    if (flags.status === "published") sets.push("published_at = COALESCE(published_at, CURRENT_TIMESTAMP(3))");
  }
  if (typeof flags.featured === "boolean") {
    sets.push("featured = ?");
    values.push(flags.featured);
  }
  if (!sets.length) return;
  await withClient((c) => c.query(`UPDATE vault_projects SET ${sets.join(", ")} WHERE id = ?`, [...values, id]));
}

export async function deleteVaultProject(id: string): Promise<VaultProject | null> {
  const project = await getVaultProject(id);
  if (!project) return null;
  await withClient((c) => c.query("DELETE FROM vault_projects WHERE id = ?", [id]));
  return project;
}

export async function reorderVaultProjects(orderedIds: string[]) {
  await withClient(async (c) => {
    await c.beginTransaction();
    try {
      for (const [i, pid] of orderedIds.entries()) {
        await c.query("UPDATE vault_projects SET sort_order = ? WHERE id = ?", [i, pid]);
      }
      await c.commit();
    } catch (error) {
      await c.rollback();
      throw error;
    }
  });
}

// ─── Albums ──────────────────────────────────────────────────────────────────

function toAlbum(r: Row): VaultAlbum {
  return {
    key: r.source_key as string,
    url: r.source_url as string,
    status: r.status as AlbumStatus,
    error: (r.error as string | null) ?? undefined,
    items: json<AlbumItem[]>(r.items, []),
    syncedAt: r.synced_at ? iso(r.synced_at) : undefined,
  };
}

export async function getAlbums(keys: string[]): Promise<Map<string, VaultAlbum>> {
  const unique = [...new Set(keys)].filter(Boolean);
  if (!unique.length) return new Map();
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT * FROM vault_albums WHERE source_key IN (?)", [unique]);
    return new Map(rows.map((r) => [r.source_key as string, toAlbum(r)]));
  });
}

export async function saveAlbum(
  key: string,
  url: string,
  update: { status: AlbumStatus; error?: string | null; items?: AlbumItem[] },
) {
  await withClient((c) =>
    c.query(
      `INSERT INTO vault_albums (source_key, source_url, status, error, items, synced_at)
       VALUES (?, ?, ?, ?, ?, ${update.items ? "CURRENT_TIMESTAMP(3)" : "NULL"})
       ON DUPLICATE KEY UPDATE source_url = VALUES(source_url), status = VALUES(status), error = VALUES(error)
       ${update.items ? ", items = VALUES(items), synced_at = VALUES(synced_at)" : ""}`,
      [key, url, update.status, update.error ?? null, JSON.stringify(update.items ?? [])],
    ),
  );
}

// ─── Media library ───────────────────────────────────────────────────────────

function toMedia(r: Row): VaultMedia {
  return {
    id: r.id as string,
    url: r.url as string,
    kind: r.kind as VaultMedia["kind"],
    name: r.name as string,
    mime: r.mime as string,
    bytes: Number(r.bytes),
    width: (r.width as number | null) ?? undefined,
    height: (r.height as number | null) ?? undefined,
    posterUrl: (r.poster_url as string | null) ?? undefined,
    displayUrl: (r.display_url as string | null) ?? undefined,
    thumbUrl: (r.thumb_url as string | null) ?? undefined,
    createdAt: iso(r.created_at),
  };
}

export async function listVaultMedia(): Promise<VaultMedia[]> {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT * FROM vault_media ORDER BY created_at DESC LIMIT 2000");
    return rows.map(toMedia);
  });
}

export async function getVaultMedia(id: string): Promise<VaultMedia | null> {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT * FROM vault_media WHERE id = ?", [id]);
    return rows[0] ? toMedia(rows[0]) : null;
  });
}

export async function insertVaultMedia(media: Omit<VaultMedia, "createdAt">): Promise<VaultMedia> {
  await withClient((c) =>
    c.query(
      `INSERT INTO vault_media (id, url, kind, name, mime, bytes, width, height, poster_url, display_url, thumb_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        media.id,
        media.url,
        media.kind,
        media.name,
        media.mime,
        media.bytes,
        media.width ?? null,
        media.height ?? null,
        media.posterUrl ?? null,
        media.displayUrl ?? null,
        media.thumbUrl ?? null,
      ],
    ),
  );
  return (await getVaultMedia(media.id))!;
}

export async function setVaultMediaPoster(id: string, posterUrl: string) {
  await withClient((c) => c.query("UPDATE vault_media SET poster_url = ? WHERE id = ?", [posterUrl, id]));
}

export async function deleteVaultMediaRow(id: string) {
  await withClient((c) => c.query("DELETE FROM vault_media WHERE id = ?", [id]));
}

/** Titles of the projects whose cover or sections use `url`. */
export async function projectsUsing(url: string): Promise<string[]> {
  return withClient(async (c) => {
    const like = `%${url.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const [rows] = await c.query<Row[]>(
      "SELECT title FROM vault_projects WHERE CAST(blocks AS CHAR) LIKE ? OR CAST(cover AS CHAR) LIKE ?",
      [like, like],
    );
    return rows.map((r) => r.title as string);
  });
}

// ─── The Vault page's own text ───────────────────────────────────────────────

const SETTINGS_KEY = "vault_settings";

export async function getVaultSettings(): Promise<VaultSettings> {
  return withClient(async (c) => {
    const [rows] = await c.query<Row[]>("SELECT meta_value FROM app_meta WHERE meta_key = ?", [SETTINGS_KEY]);
    if (!rows[0]) return DEFAULT_VAULT_SETTINGS;
    return { ...DEFAULT_VAULT_SETTINGS, ...sanitizeSettings(json(rows[0].meta_value, {})) };
  });
}

export async function saveVaultSettings(settings: VaultSettings) {
  await withClient((c) =>
    c.query(
      `INSERT INTO app_meta (meta_key, meta_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`,
      [SETTINGS_KEY, JSON.stringify(settings)],
    ),
  );
}
