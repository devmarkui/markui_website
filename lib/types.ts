/**
 * Shared data contracts for the public site and the admin dashboard.
 * These types describe what is persisted in the store (see `lib/db.ts`).
 *
 * Products and Services are deliberately separate collections: they are shown
 * on separate pages, managed on separate admin screens, and share no fields.
 */

export const PROJECT_CATEGORIES = [
  "Web",
  "Marketing",
  "Branding",
  "Multimedia",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectFilter = ProjectCategory | "All";

export function isProjectCategory(value: unknown): value is ProjectCategory {
  return (
    typeof value === "string" &&
    (PROJECT_CATEGORIES as readonly string[]).includes(value)
  );
}

/** An extra image or video attached to a record. */
export interface MediaItem {
  url: string;
  type: "image" | "video";
  /** Original filename, kept for display in the admin dashboard. */
  name?: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────
// The main portfolio showcase. Unchanged by the Products/Services split.

export interface Project {
  id: string;
  slug: string;
  title: string;
  /** Short description — one or two lines on cards. */
  description: string;
  /** Long-form "About the project" copy for the detail page. */
  fullDescription?: string;
  /** "Outcome / result" copy for the detail page. */
  outcome?: string;
  client?: string;
  category: ProjectCategory;
  /** Cover image. For a video cover it is the poster. Empty means "no image yet". */
  image: string;
  /** Whether the cover is the still image or `coverVideo`. Missing means image. */
  coverType?: "image" | "video";
  /** Uploaded video (`/api/uploads/…`) or a direct link to an MP4/WebM file. */
  coverVideo?: string;
  /** Optional outbound link to the live project ("Visit website"). */
  link?: string;
  /** The project's page on the separate portfolio site. */
  portfolioUrl?: string;
  /** "What we did" — e.g. Strategy, Design, Development. */
  deliverables?: string[];
  /** Services this work belongs to (ids). Lets the same project serve as Top Work. */
  serviceIds?: string[];
  /** Pinned to the top of the Projects page. */
  featured?: boolean;
  /** Hidden projects stay in the database but disappear from the site. Missing means active. */
  active?: boolean;
  /** Ordered images and videos for the detail page gallery. */
  gallery?: GalleryItem[];
  /** Optional ISO date (yyyy-mm-dd). */
  date?: string;
  /** Short label shown under the project name, e.g. "Fashion". */
  industry?: string;
  /** Small caption shown on the card, e.g. "/ web design". */
  tag?: string;
  /** Controls how much room the card takes in the masonry grid. */
  size: "large" | "small";
  /** Optional additional images / videos. */
  media: MediaItem[];
  /** Ascending sort order on the public site. */
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Services ────────────────────────────────────────────────────────────────
// What the agency does. Each one gets its own detail page at /services/<slug>.

export interface Service {
  id: string;
  /** Drives the public URL: /services/<slug>. */
  slug: string;
  name: string;
  /** One or two lines, used on cards and in the home-page accordion. */
  shortDescription: string;
  /** Long-form copy for the service detail page. */
  fullDescription: string;
  /** Card and hero image. Empty string falls back to the icon glyph. */
  image: string;
  /** Short text/emoji glyph used when there is no image. */
  icon: string;
  /** "What we offer" — the concrete deliverables. */
  features: string[];
  /** "Why choose this service" — the reasons to pick Mark UI for it. */
  benefits: string[];
  /** Small category labels shown on the card. */
  tags: string[];
  order: number;
  /** Inactive services stay in the database but disappear from the public site. */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Top Work ────────────────────────────────────────────────────────────────

/**
 * A highlighted piece of work shown on one service's detail page.
 *
 * Every item belongs to exactly one service. It can either point at an existing
 * project (preferred — no duplicated content) or carry its own title, copy and
 * media for work that is not in the projects list.
 */
export interface TopWork {
  id: string;
  /** Owning service. */
  serviceId: string;
  /** When set, title/description/image fall back to this project's. */
  projectId?: string;
  /** Overrides the linked project's title, or stands alone. */
  title: string;
  description: string;
  /**
   * What the thumbnail shows. Missing on older records, which infer it: an
   * image when there is one, otherwise a video if one is attached.
   */
  mediaType?: TopWorkMediaType;
  /** The still shown on the grid — for videos, the poster frame. */
  image: string;
  /** Uploaded video (`/api/uploads/…`) or a direct link to an MP4/WebM file. */
  video?: string;
  /** Small label under the title. Blank falls back to the linked project's category. */
  category?: string;
  /** Optional video or extra stills. */
  media: MediaItem[];
  link?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TopWorkMediaType = "image" | "video";

/** A Top Work item with its linked project already resolved, ready to render. */
export interface ResolvedTopWork {
  id: string;
  title: string;
  description: string;
  mediaType: TopWorkMediaType;
  /** Still image; for a video item this is its poster (may be empty). */
  image: string;
  /** Set only when `mediaType` is "video". */
  video?: string;
  media: MediaItem[];
  link?: string;
  /** Small label under the title — the item's own, else the linked project's. */
  category?: string;
  /** True when the content comes from a project rather than being bespoke. */
  fromProject: boolean;
}

// ─── Products ────────────────────────────────────────────────────────────────
// Things Mark UI sells, as opposed to services it performs.

export const PRODUCT_STATUSES = [
  "available",
  "coming-soon",
  "in-development",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  available: "Available",
  "coming-soon": "Coming soon",
  "in-development": "In development",
};

export function isProductStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === "string" &&
    (PRODUCT_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * One image or video in an ordered, admin-managed media list — a product's
 * "Product Preview" or a project's gallery. Items render in array order.
 */
export interface GalleryItem {
  id: string;
  type: "image" | "video";
  /** Optional caption, e.g. "Dashboard" or "Mobile app". */
  title: string;
  /** The screenshot — or, for a video, its poster frame. */
  image: string;
  /** Uploaded video (`/api/uploads/…`) or a direct link to an MP4/WebM file. */
  video?: string;
  active: boolean;
}

export type ProductPreviewItem = GalleryItem;

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  /** Cover image — the admin thumbnail, and the preview when none is set. */
  image: string;
  /** Optional uploaded logo shown beside the product number. */
  logo?: string;
  icon: string;
  /** Small label above the name, e.g. "Business software". */
  category?: string;
  /** Missing on older records, which are treated as "available". */
  status?: ProductStatus;
  /** Bullet points listed under the description. */
  features: string[];
  /** e.g. "Next.js", "Flutter" — optional. */
  technologies?: string[];
  /** Screenshots and demo videos for the Product Preview grid. */
  preview?: ProductPreviewItem[];
  /** Free-form, e.g. "From LKR 45,000". */
  price?: string;
  link?: string;
  /** Label for the call-to-action button, e.g. "Request a demo". */
  ctaLabel?: string;
  media: MediaItem[];
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Site settings ───────────────────────────────────────────────────────────

export interface Settings {
  /**
   * External portfolio site. Empty means "not configured" and the
   * "Check our portfolio" buttons stay hidden rather than linking nowhere.
   */
  portfolioUrl: string;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: Settings = {
  portfolioUrl: "",
  updatedAt: new Date(0).toISOString(),
};

// ─── Store ───────────────────────────────────────────────────────────────────

export interface Database {
  /** Bumped when the shape changes; `lib/db.ts` migrates older files forward. */
  version: number;
  projects: Project[];
  services: Service[];
  topWork: TopWork[];
  products: Product[];
  settings: Settings;
}

export const DB_VERSION = 2;
