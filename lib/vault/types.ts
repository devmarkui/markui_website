/**
 * The Creative Vault's content model (creative.markui.lk).
 *
 * A Vault project is a header (title, client, cover, facts) followed by an
 * ordered list of sections ("blocks"), each one of the types below. The admin
 * editor works on these shapes directly and `lib/vault/sanitize.ts` checks
 * every save against them, so this file stays free of Node imports: the
 * editor is a Client Component.
 */

export const VAULT_STATUSES = ["draft", "unlisted", "published"] as const;
export type VaultStatus = (typeof VAULT_STATUSES)[number];

export const STATUS_LABELS: Record<VaultStatus, string> = {
  draft: "Draft",
  unlisted: "Unlisted",
  published: "Published",
};

/** A section's background: one of the site's grounds, or chosen for it. */
export const GROUNDS = ["auto", "carbon", "soot", "paper", "signal"] as const;
export type Ground = (typeof GROUNDS)[number];

export const MEDIA_KINDS = ["image", "video", "pdf", "file"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/**
 * A file the section points at: an upload from the Vault's media library or
 * an image/file link. `display` is a browser-friendly copy (HEIC/TIFF are
 * converted on upload), `thumb` a small one for grids.
 */
export interface MediaRef {
  url: string;
  kind: MediaKind;
  name?: string;
  mime?: string;
  bytes?: number;
  w?: number;
  h?: number;
  display?: string;
  thumb?: string;
  /** A video's poster frame. */
  poster?: string;
  alt?: string;
}

/** One row of the Vault media library (`vault_media`). */
export interface VaultMedia {
  id: string;
  url: string;
  kind: MediaKind;
  name: string;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  posterUrl?: string;
  displayUrl?: string;
  thumbUrl?: string;
  createdAt: string;
}

export function mediaRefFrom(media: VaultMedia): MediaRef {
  return {
    url: media.url,
    kind: media.kind,
    name: media.name,
    mime: media.mime,
    bytes: media.bytes,
    w: media.width,
    h: media.height,
    display: media.displayUrl,
    thumb: media.thumbUrl,
    poster: media.posterUrl,
  };
}

// ─── Sections ────────────────────────────────────────────────────────────────

export const BLOCK_TYPES = [
  "story",
  "video",
  "posters",
  "gallery",
  "social",
  "website",
  "embed",
  "compare",
  "results",
  "quote",
  "files",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

interface BlockBase {
  id: string;
  /** The channel label above the section, e.g. "Teaser". */
  label: string;
  title: string;
  intro: string;
  ground: Ground;
  hidden: boolean;
}

/** Paragraphs separated by blank lines; **bold** and [links](https://…). */
export interface StoryBlock extends BlockBase {
  type: "story";
  layout: "wide" | "split";
  body: string;
}

export const VIDEO_LABELS = [
  "Teaser",
  "Announcement",
  "Trailer",
  "Aftermovie",
  "Highlights",
  "Reel",
  "Promo",
  "Interview",
  "Behind the scenes",
  "Walkthrough",
  "Live",
] as const;

export const ORIENTATIONS = ["auto", "landscape", "portrait", "square"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export interface VideoItem {
  id: string;
  /** A YouTube/Instagram/Facebook/TikTok/Vimeo/Drive link, or empty when `file` is set. */
  url: string;
  /** An uploaded video file. */
  file: MediaRef | null;
  label: string;
  title: string;
  description: string;
  /** The account that posted it, shown in the platform frame ("@markui.lk"). */
  account: string;
  orientation: Orientation;
}

export interface VideoBlock extends BlockBase {
  type: "video";
  layout: "feature" | "row" | "reels";
  items: VideoItem[];
}

export interface PosterItem {
  id: string;
  image: MediaRef | null;
  title: string;
  description: string;
  date: string;
}

export interface PostersBlock extends BlockBase {
  type: "posters";
  layout: "grid" | "deck" | "carousel";
  items: PosterItem[];
}

export interface GalleryUpload {
  id: string;
  media: MediaRef;
  caption: string;
}

export const GALLERY_SOURCES = ["uploads", "drive", "photos"] as const;
export type GallerySource = (typeof GALLERY_SOURCES)[number];

export interface GalleryBlock extends BlockBase {
  type: "gallery";
  layout: "slideshow" | "masonry" | "filmstrip" | "grid";
  source: GallerySource;
  /** The Drive folder or Google Photos album link (source drive/photos). */
  url: string;
  items: GalleryUpload[];
  autoplay: boolean;
  captions: boolean;
  /** Split a Drive album into chapters by subfolder. */
  chapters: boolean;
  /** 0 shows everything. */
  limit: number;
}

export interface SocialItem {
  id: string;
  url: string;
  note: string;
}

export interface SocialBlock extends BlockBase {
  type: "social";
  layout: "rail" | "grid";
  items: SocialItem[];
}

export const DEVICES = ["desktop", "tablet", "mobile"] as const;
export type Device = (typeof DEVICES)[number];

export interface WebsitePage {
  id: string;
  label: string;
  /** A full URL, or a path on the block's site ("/shop"). */
  url: string;
  desktop: MediaRef | null;
  mobile: MediaRef | null;
}

export interface WebsiteBlock extends BlockBase {
  type: "website";
  url: string;
  mode: "auto" | "live" | "screens";
  devices: Device[];
  pages: WebsitePage[];
  /** Whether the site allows being shown in a frame; null until checked. */
  frameable: boolean | null;
  checkedAt: string;
}

export const EMBED_RATIOS = ["16:9", "4:3", "1:1", "4:5", "9:16", "a4"] as const;
export type EmbedRatio = (typeof EMBED_RATIOS)[number];

export interface EmbedBlock extends BlockBase {
  type: "embed";
  url: string;
  /** An uploaded PDF, shown instead of `url`. */
  file: MediaRef | null;
  ratio: EmbedRatio;
  caption: string;
}

export interface ComparePair {
  id: string;
  before: MediaRef | null;
  after: MediaRef | null;
  beforeLabel: string;
  afterLabel: string;
  caption: string;
}

export interface CompareBlock extends BlockBase {
  type: "compare";
  items: ComparePair[];
}

export interface ResultItem {
  id: string;
  value: string;
  label: string;
  note: string;
}

export interface ResultsBlock extends BlockBase {
  type: "results";
  items: ResultItem[];
}

export interface QuoteBlock extends BlockBase {
  type: "quote";
  text: string;
  name: string;
  role: string;
  avatar: MediaRef | null;
}

export interface FileItem {
  id: string;
  file: MediaRef | null;
  /** An outside link instead of an upload (a Drive or WeTransfer link). */
  url: string;
  label: string;
  note: string;
}

export interface FilesBlock extends BlockBase {
  type: "files";
  items: FileItem[];
}

export type VaultBlock =
  | StoryBlock
  | VideoBlock
  | PostersBlock
  | GalleryBlock
  | SocialBlock
  | WebsiteBlock
  | EmbedBlock
  | CompareBlock
  | ResultsBlock
  | QuoteBlock
  | FilesBlock;

export type BlockOf<T extends BlockType> = Extract<VaultBlock, { type: T }>;

// ─── Projects ────────────────────────────────────────────────────────────────

export interface Fact {
  label: string;
  value: string;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface VaultCover {
  kind: "image" | "video";
  media: MediaRef;
}

export interface VaultProject {
  id: string;
  slug: string;
  /** Earlier slugs, which redirect to the current one. */
  previousSlugs: string[];
  title: string;
  client: string;
  /** A main-site service (`services.id`), or empty. */
  serviceId: string;
  /** The template the project was started from (a service slug or "general"). */
  template: string;
  summary: string;
  location: string;
  /** `yyyy-mm-dd`, or empty. */
  date: string;
  cover: VaultCover | null;
  /** `#rrggbb`, or empty for the site's orange. */
  accent: string;
  facts: Fact[];
  links: LinkItem[];
  blocks: VaultBlock[];
  status: VaultStatus;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ─── Remote albums (Drive folders, Google Photos albums) ─────────────────────

export interface AlbumItem {
  id: string;
  kind: "image" | "video";
  name?: string;
  w?: number;
  h?: number;
  /** The subfolder it came from, for chapters. */
  folder?: string;
  takenAt?: string;
  /** Google Photos only: the image's base URL (size is appended). */
  src?: string;
}

export const ALBUM_STATUSES = ["idle", "syncing", "ready", "error"] as const;
export type AlbumStatus = (typeof ALBUM_STATUSES)[number];

export interface VaultAlbum {
  key: string;
  url: string;
  status: AlbumStatus;
  error?: string;
  items: AlbumItem[];
  syncedAt?: string;
}

// ─── The Vault page's own text ───────────────────────────────────────────────

export interface VaultSettings {
  titleQuiet: string;
  titleLoud: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

export const DEFAULT_VAULT_SETTINGS: VaultSettings = {
  titleQuiet: "Creative",
  titleLoud: "Vault",
  intro:
    "Every project, in full: the films, the posters, the photographs and the products we built. Open one and look around.",
  ctaLabel: "Start a project",
  ctaUrl: "https://markui.lk/contact",
  seoTitle: "Creative Vault · Mark UI",
  seoDescription:
    "The full portfolio of Mark UI: websites, software, campaigns, films, photography and events, each with everything we made for it.",
  ogImage: "",
};
