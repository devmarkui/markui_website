import { newId } from "./blocks";
import { parseEmbedUrl } from "./embeds";
import {
  BLOCK_TYPES,
  DEFAULT_VAULT_SETTINGS,
  DEVICES,
  EMBED_RATIOS,
  GALLERY_SOURCES,
  GROUNDS,
  MEDIA_KINDS,
  ORIENTATIONS,
  VAULT_STATUSES,
  type BlockType,
  type Device,
  type Fact,
  type LinkItem,
  type MediaRef,
  type VaultBlock,
  type VaultCover,
  type VaultProject,
  type VaultSettings,
} from "./types";

/**
 * The editor posts a whole project as JSON. Everything in it is re-checked
 * here — types, lengths, list sizes and every link — before it reaches the
 * database, so a tampered request can only ever save a well-formed project.
 */

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

// Control characters other than tab and line breaks.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export function str(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL, "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/** One line: no line breaks. */
export function line(value: unknown, max: number): string {
  return str(value, max * 2).replace(/\s*\n\s*/g, " ").slice(0, max);
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

function list(value: unknown, max: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function int(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

function id(value: unknown): string {
  return typeof value === "string" && /^[\w-]{4,40}$/.test(value) ? value : newId();
}

/** An https link (http is upgraded), or "". */
export function httpsUrl(value: unknown, max = 2000): string {
  const raw = line(value, max);
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

const LOCAL_MEDIA = /^\/media\/vault\/[A-Za-z0-9._-]+$/;
// Seeded and uploaded main-site images, which a project imported from the
// main site can carry over as its cover.
const SITE_MEDIA = /^\/(api\/uploads|projects|landing\/assets)\/[A-Za-z0-9._\/-]+$/;

/** A file link the Vault may show: one of its uploads, a main-site image or an https URL. */
export function mediaUrl(value: unknown): string {
  const raw = line(value, 2000);
  if (LOCAL_MEDIA.test(raw) || (SITE_MEDIA.test(raw) && !raw.includes(".."))) return raw;
  return httpsUrl(raw);
}

export function mediaRef(value: unknown): MediaRef | null {
  if (!isObj(value)) return null;
  const url = mediaUrl(value.url);
  if (!url) return null;
  const ref: MediaRef = { url, kind: oneOf(value.kind, MEDIA_KINDS, "image") };
  const name = line(value.name, 200);
  if (name) ref.name = name;
  const mime = line(value.mime, 127);
  if (mime) ref.mime = mime;
  if (typeof value.bytes === "number" && value.bytes > 0) ref.bytes = Math.round(value.bytes);
  if (typeof value.w === "number" && value.w > 0) ref.w = int(value.w, 1, 100000, 0);
  if (typeof value.h === "number" && value.h > 0) ref.h = int(value.h, 1, 100000, 0);
  for (const key of ["display", "thumb", "poster"] as const) {
    const u = mediaUrl(value[key]);
    if (u) ref[key] = u;
  }
  const alt = line(value.alt, 300);
  if (alt) ref.alt = alt;
  return ref;
}

function base(raw: Raw, type: BlockType) {
  return {
    id: id(raw.id),
    type,
    label: line(raw.label, 60),
    title: line(raw.title, 160),
    intro: str(raw.intro, 1200),
    ground: oneOf(raw.ground, GROUNDS, "auto"),
    hidden: bool(raw.hidden),
  };
}

/** A video link as typed (resolved later), or an uploaded file. */
function videoUrl(value: unknown) {
  const raw = line(value, 2000);
  if (LOCAL_MEDIA.test(raw)) return raw;
  return httpsUrl(raw);
}

export function sanitizeBlock(input: unknown): VaultBlock | null {
  if (!isObj(input)) return null;
  const type = oneOf(input.type, BLOCK_TYPES, "story");
  if (input.type !== type) return null;
  const b = base(input, type);

  switch (type) {
    case "story":
      return { ...b, type, layout: oneOf(input.layout, ["wide", "split"] as const, "split"), body: str(input.body, 12000) };

    case "video":
      return {
        ...b,
        type,
        layout: oneOf(input.layout, ["feature", "row", "reels"] as const, "feature"),
        items: list(input.items, 24)
          .filter(isObj)
          .map((item) => ({
            id: id(item.id),
            url: videoUrl(item.url),
            file: mediaRef(item.file),
            label: line(item.label, 40),
            title: line(item.title, 160),
            description: str(item.description, 1500),
            account: line(item.account, 60),
            orientation: oneOf(item.orientation, ORIENTATIONS, "auto"),
          })),
      };

    case "posters":
      return {
        ...b,
        type,
        layout: oneOf(input.layout, ["grid", "deck", "carousel"] as const, "grid"),
        items: list(input.items, 60)
          .filter(isObj)
          .map((item) => ({
            id: id(item.id),
            image: mediaRef(item.image),
            title: line(item.title, 160),
            description: str(item.description, 1200),
            date: line(item.date, 40),
          })),
      };

    case "gallery":
      return {
        ...b,
        type,
        layout: oneOf(input.layout, ["slideshow", "masonry", "filmstrip", "grid"] as const, "slideshow"),
        source: oneOf(input.source, GALLERY_SOURCES, "uploads"),
        url: httpsUrl(input.url),
        items: list(input.items, 400)
          .filter(isObj)
          .map((item) => ({ id: id(item.id), media: mediaRef(item.media), caption: line(item.caption, 300) }))
          .filter((item): item is { id: string; media: MediaRef; caption: string } => item.media !== null),
        autoplay: bool(input.autoplay, true),
        captions: bool(input.captions),
        chapters: bool(input.chapters, true),
        limit: int(input.limit, 0, 1000, 0),
      };

    case "social":
      return {
        ...b,
        type,
        layout: oneOf(input.layout, ["rail", "grid"] as const, "rail"),
        items: list(input.items, 40)
          .filter(isObj)
          .map((item) => ({ id: id(item.id), url: httpsUrl(item.url), note: line(item.note, 200) })),
      };

    case "website": {
      const devices = list(input.devices, 3).filter((d): d is Device => (DEVICES as readonly unknown[]).includes(d));
      return {
        ...b,
        type,
        url: httpsUrl(input.url),
        mode: oneOf(input.mode, ["auto", "live", "screens"] as const, "auto"),
        devices: devices.length ? [...new Set(devices)] : ["desktop"],
        pages: list(input.pages, 20)
          .filter(isObj)
          .map((page) => {
            const raw = line(page.url, 2000);
            return {
              id: id(page.id),
              label: line(page.label, 40),
              url: raw.startsWith("/") ? raw.replace(/[^\w\-./?=&%#~+]/g, "") : httpsUrl(raw),
              desktop: mediaRef(page.desktop),
              mobile: mediaRef(page.mobile),
            };
          }),
        frameable: typeof input.frameable === "boolean" ? input.frameable : null,
        checkedAt: line(input.checkedAt, 40),
      };
    }

    case "embed": {
      const url = httpsUrl(input.url);
      return {
        ...b,
        type,
        url: url && parseEmbedUrl(url) ? url : "",
        file: mediaRef(input.file),
        ratio: oneOf(input.ratio, EMBED_RATIOS, "16:9"),
        caption: line(input.caption, 300),
      };
    }

    case "compare":
      return {
        ...b,
        type,
        items: list(input.items, 20)
          .filter(isObj)
          .map((item) => ({
            id: id(item.id),
            before: mediaRef(item.before),
            after: mediaRef(item.after),
            beforeLabel: line(item.beforeLabel, 30) || "Before",
            afterLabel: line(item.afterLabel, 30) || "After",
            caption: line(item.caption, 300),
          })),
      };

    case "results":
      return {
        ...b,
        type,
        items: list(input.items, 12)
          .filter(isObj)
          .map((item) => ({
            id: id(item.id),
            value: line(item.value, 24),
            label: line(item.label, 80),
            note: line(item.note, 160),
          })),
      };

    case "quote":
      return {
        ...b,
        type,
        text: str(input.text, 1500),
        name: line(input.name, 80),
        role: line(input.role, 120),
        avatar: mediaRef(input.avatar),
      };

    case "files":
      return {
        ...b,
        type,
        items: list(input.items, 60)
          .filter(isObj)
          .map((item) => ({
            id: id(item.id),
            file: mediaRef(item.file),
            url: httpsUrl(item.url),
            label: line(item.label, 160),
            note: line(item.note, 300),
          })),
      };
  }
}

function cover(value: unknown): VaultCover | null {
  if (!isObj(value)) return null;
  const media = mediaRef(value.media);
  return media ? { kind: oneOf(value.kind, ["image", "video"] as const, "image"), media } : null;
}

function facts(value: unknown): Fact[] {
  return list(value, 12)
    .filter(isObj)
    .map((f) => ({ label: line(f.label, 40), value: line(f.value, 200) }))
    .filter((f) => f.label && f.value);
}

function links(value: unknown): LinkItem[] {
  return list(value, 12)
    .filter(isObj)
    .map((l) => ({ label: line(l.label, 60), url: httpsUrl(l.url) }))
    .filter((l) => l.label && l.url);
}

export type ProjectFields = Omit<
  VaultProject,
  "id" | "previousSlugs" | "order" | "createdAt" | "updatedAt" | "publishedAt"
>;

/** The editable fields of a posted project; `slug` still needs its uniqueness check. */
export function sanitizeProject(input: unknown): ProjectFields {
  const raw = isObj(input) ? input : {};
  const date = line(raw.date, 10);
  const accent = line(raw.accent, 7);
  return {
    slug: line(raw.slug, 120).toLowerCase(),
    title: line(raw.title, 160),
    client: line(raw.client, 120),
    serviceId: line(raw.serviceId, 64),
    template: line(raw.template, 64) || "general",
    summary: str(raw.summary, 1500),
    location: line(raw.location, 120),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    cover: cover(raw.cover),
    accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent.toLowerCase() : "",
    facts: facts(raw.facts),
    links: links(raw.links),
    blocks: list(raw.blocks, 40)
      .map(sanitizeBlock)
      .filter((b): b is VaultBlock => b !== null),
    status: oneOf(raw.status, VAULT_STATUSES, "draft"),
    featured: bool(raw.featured),
  };
}

export function sanitizeSettings(input: unknown): VaultSettings {
  const raw = isObj(input) ? input : {};
  const d = DEFAULT_VAULT_SETTINGS;
  return {
    titleQuiet: line(raw.titleQuiet, 40),
    titleLoud: line(raw.titleLoud, 40) || d.titleLoud,
    intro: str(raw.intro, 400),
    ctaLabel: line(raw.ctaLabel, 40) || d.ctaLabel,
    ctaUrl: httpsUrl(raw.ctaUrl) || d.ctaUrl,
    seoTitle: line(raw.seoTitle, 80) || d.seoTitle,
    seoDescription: line(raw.seoDescription, 300) || d.seoDescription,
    ogImage: mediaUrl(raw.ogImage),
  };
}
