/**
 * Shared data contracts for the public site and the admin dashboard.
 * These types describe what is persisted in the store (see `lib/db.ts`).
 *
 * Products and Services are deliberately separate collections: they are shown
 * on separate pages, managed on separate admin screens, and share no fields.
 */

import { richFromLines, type RichDoc } from "./rich-text";

export const PROJECT_CATEGORIES = [
  "Web",
  "Marketing",
  "Multimedia",
  "Branding",
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
  /**
   * Where the "Explore service" button on the Services page goes. Blank keeps
   * the default, this service's own detail page at /services/<slug>.
   */
  ctaLink?: string;
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
  /** Editable copy used by the public About page. */
  about: AboutContent;
  /** Editable copy used by the Home page hero. */
  home: HomeContent;
  /** The Home page trust strip: headline, client names and stat cards. */
  trust: TrustContent;
  /** Social profiles listed in the site footer, in display order. */
  socialLinks: SocialLink[];
  updatedAt: string;
}

export interface SocialLink {
  /** Shown as the link text, e.g. "Instagram". */
  label: string;
  /** Full http(s) address of the profile. */
  url: string;
}

/** Suggested labels in the admin; any other name is allowed too. */
export const SOCIAL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "X",
  "WhatsApp",
  "Behance",
  "Dribbble",
  "Pinterest",
] as const;

/** Keeps the footer column tidy. */
export const MAX_SOCIAL_LINKS = 8;

// ─── Home page ───────────────────────────────────────────────────────────────

export interface HomeContent {
  /**
   * The whole hero heading — every line, with per-word styling — as one rich
   * text document. Replaces the old separate main/secondary heading strings;
   * `lib/db.ts` combines those when it meets an older record.
   */
  heading: RichDoc;
  /** Hero description, also rich text. */
  description: RichDoc;
  ctaText: string;
  /** Site path (`/proposal`) or full http(s) URL. */
  ctaLink: string;
  /** Optional button text styling; missing means the design default. */
  ctaSize?: number;
  ctaWeight?: number;
  ctaColor?: string;
  itTitle: string;
  itDescription: string;
  /** Where the IT Solutions panel leads. Site path or full URL. */
  itLink: string;
  marketingTitle: string;
  marketingDescription: string;
  /** Where the Digital Marketing panel leads. Site path or full URL. */
  marketingLink: string;
  mediaTitle: string;
  mediaDescription: string;
  /** Where the Media Production panel leads. Site path or full URL. */
  mediaLink: string;
}

/** Button text size limits (px). */
export const CTA_SIZE_RANGE = { min: 9, max: 18 } as const;

export const DEFAULT_HOME: HomeContent = {
  heading: richFromLines([
    { text: "Less Noise" },
    { text: "More Impact", marks: { weight: 800 } },
  ]),
  description: richFromLines([
    {
      text: "We help ambitious companies launch memorable brands, build high-impact websites, and design digital products people love to use.",
    },
  ]),
  ctaText: "Book a Call",
  ctaLink: "/proposal",
  itTitle: "IT Solutions",
  itDescription:
    "Websites, web applications and custom software built around the way your business works.",
  itLink: "/services/software-it-solutions",
  marketingTitle: "Digital Marketing",
  marketingDescription:
    "Social media, content and campaigns that help the right people find and choose you.",
  marketingLink: "/services/digital-marketing",
  mediaTitle: "Media Production",
  mediaDescription:
    "Photography, video and multimedia production that gives your brand something worth showing.",
  mediaLink: "/services/multimedia-production",
};

// ─── Hero service cards ──────────────────────────────────────────────────────
// The services each Home hero panel rotates through, managed in the dashboard.

export const HERO_PANELS = ["it", "marketing"] as const;

export type HeroPanel = (typeof HERO_PANELS)[number];

export const HERO_PANEL_LABELS: Record<HeroPanel, string> = {
  it: "IT Solutions",
  marketing: "Digital Marketing",
};

export function isHeroPanel(value: unknown): value is HeroPanel {
  return (
    typeof value === "string" && (HERO_PANELS as readonly string[]).includes(value)
  );
}

/** Built-in line illustrations a hero service can use (key → admin label). */
export const HERO_ILLUSTRATIONS = {
  website: "Website",
  webapp: "Web app dashboard",
  software: "Custom software",
  uiux: "UI/UX wireframe",
  cloud: "Cloud & servers",
  code: "Code window",
  social: "Social media",
  seo: "Search",
  ads: "Ads target",
  content: "Content",
  email: "Email",
  growth: "Growth chart",
} as const;

export type HeroIllustration = keyof typeof HERO_ILLUSTRATIONS;

export function isHeroIllustration(value: unknown): value is HeroIllustration {
  return typeof value === "string" && value in HERO_ILLUSTRATIONS;
}

export interface HeroService {
  id: string;
  /** Which hero card it rotates through. */
  panel: HeroPanel;
  title: string;
  description: string;
  /** Built-in illustration; an uploaded `image` is shown instead when set. */
  illustration: HeroIllustration;
  image?: string;
  /** Where a click goes. Blank falls back to the panel's own link. */
  link?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Latest From Our Studio ──────────────────────────────────────────────────
// Photo and video posts shown on the Home page, managed from the dashboard.

export interface StudioItem {
  id: string;
  title: string;
  description: string;
  mediaType: "image" | "video";
  /** The photo — or, for a video, its poster frame. */
  image: string;
  /** Uploaded video (`/api/uploads/…`) or a direct link to an MP4/WebM file. */
  video?: string;
  /** Where a click goes: a site path (`/projects/x`) or a full http(s) URL. */
  link?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutItem {
  title: string;
  description: string;
}

export interface AboutLink {
  title: string;
  href: string;
}

export interface AboutContent {
  heroHeading: string;
  introduction: string;
  whoWeAre: string;
  approach: AboutItem[];
  reasons: AboutItem[];
  expertise: AboutLink[];
  values: AboutItem[];
  ctaHeading: string;
  ctaText: string;
}

export const DEFAULT_ABOUT: AboutContent = {
  heroHeading: "We create\ndigital experiences\nthat matter.",
  introduction:
    "Mark UI is a creative technology company focused on building meaningful digital experiences, brands, products and solutions for modern businesses.",
  whoWeAre:
    "Mark UI brings together design, technology, marketing and multimedia to help businesses build stronger digital experiences.\n\nWe work across strategy, branding, digital marketing, software, web development, photography and multimedia production.\n\nOur approach is simple: understand the problem, create the right solution and deliver work that creates real value.",
  approach: [
    { title: "Discover", description: "Understand the business, audience and problem." },
    { title: "Plan", description: "Define the strategy, direction and solution." },
    { title: "Create", description: "Design, develop and produce the required work." },
    { title: "Deliver", description: "Launch, measure and improve the final result." },
  ],
  reasons: [
    { title: "One team", description: "Design, technology, marketing and creative production under one team." },
    { title: "Business first", description: "We focus on solving real business problems, not just creating attractive visuals." },
    { title: "Built for people", description: "We create digital experiences that are simple, useful and easy to understand." },
    { title: "Continuous improvement", description: "We refine our work based on feedback, performance and changing business needs." },
  ],
  expertise: [
    { title: "Digital marketing", href: "/services/digital-marketing" },
    { title: "Web & software", href: "/services/web-design-development" },
    { title: "Branding & design", href: "/services/graphic-designing" },
    { title: "Photography & video", href: "/services/photography-videography" },
    { title: "Multimedia", href: "/services/multimedia-production" },
  ],
  values: [
    { title: "Clarity", description: "We keep ideas and experiences simple and understandable." },
    { title: "Quality", description: "We care about the details that make the final work better." },
    { title: "Creativity", description: "We look for thoughtful and effective ways to solve problems." },
    { title: "Partnership", description: "We work closely with clients throughout the process." },
  ],
  ctaHeading: "Let's work together",
  ctaText: "Have a project, product or idea in mind? Let's talk about how we can help.",
};

// ─── Trust strip (Home page) ─────────────────────────────────────────────────
// The band under the hero: the headline, the scrolling client names and the
// stat cards. All of it is edited in the dashboard (Trust & Stats).

/** One stat card, e.g. "Client Satisfaction · 100% · Trusted by growing…". */
export interface TrustStat {
  label: string;
  value: string;
  /** Second line under the value, like "Years". Blank for none. */
  suffix: string;
  description: string;
}

/** One name in the scrolling strip. */
export interface TrustLogo {
  name: string;
  /** A single symbol shown before the name, e.g. ◎. Blank for none. */
  icon: string;
}

export interface TrustContent {
  /** Headline lines in full black, one per line. */
  headingDark: string;
  /** Headline lines in grey, shown under the dark ones. */
  headingMuted: string;
  stats: TrustStat[];
  logos: TrustLogo[];
}

/** Keeps the grid and the strip from overflowing. */
export const MAX_TRUST_STATS = 8;
export const MAX_TRUST_LOGOS = 16;

export const DEFAULT_TRUST: TrustContent = {
  headingDark: "DESIGN\nTHAT WORKS",
  headingMuted: "RESULTS\nTHAT LAST",
  stats: [
    {
      label: "Client Satisfaction",
      value: "100%",
      suffix: "",
      description: "Trusted by growing digital teams",
    },
    {
      label: "Experience",
      value: "8+",
      suffix: "Years",
      description: "Designing scalable digital products",
    },
    {
      label: "Delivered Projects",
      value: "60+",
      suffix: "",
      description: "Across SaaS, AI & digital platforms",
    },
    {
      label: "Growth Impact",
      value: "+40%",
      suffix: "",
      description: "Average ROI growth after new design",
    },
  ],
  logos: [
    { name: "Prisma", icon: "◭" },
    { name: "Vertex", icon: "⬡" },
    { name: "Lumina", icon: "◈" },
    { name: "Nexus", icon: "⊠" },
    { name: "Courto", icon: "⊡" },
    { name: "Orbital", icon: "◎" },
    { name: "Vanta", icon: "●" },
  ],
};

export const DEFAULT_SETTINGS: Settings = {
  portfolioUrl: "",
  about: DEFAULT_ABOUT,
  home: DEFAULT_HOME,
  trust: DEFAULT_TRUST,
  socialLinks: [],
  updatedAt: new Date(0).toISOString(),
};

// ─── Enquiries ───────────────────────────────────────────────────────────────
// What visitors send through the Contact page form and the Home page form.
// Stored first, then emailed, so a mail outage never loses one.

export const ENQUIRY_SOURCES = ["contact", "home"] as const;

export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  contact: "Contact page",
  home: "Home page",
};

export function isEnquirySource(value: unknown): value is EnquirySource {
  return (
    typeof value === "string" && (ENQUIRY_SOURCES as readonly string[]).includes(value)
  );
}

export interface Enquiry {
  id: string;
  /** Which form it came from. */
  source: EnquirySource;
  name: string;
  /** Both optional on their own — the forms require at least one of them. */
  email: string;
  phone: string;
  company: string;
  /** The service picked on the Contact form; blank from the Home form. */
  service: string;
  message: string;
  /** false until the notification email leaves the server. */
  emailed: boolean;
  createdAt: string;
}

/** Longest each field may be, to keep one submission from filling the table. */
export const ENQUIRY_LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  company: 160,
  service: 120,
  message: 5000,
} as const;

// ─── Store ───────────────────────────────────────────────────────────────────

export interface Database {
  /** Bumped when the shape changes; `lib/db.ts` migrates older files forward. */
  version: number;
  projects: Project[];
  services: Service[];
  topWork: TopWork[];
  products: Product[];
  /** Missing on older files; `lib/db.ts` defaults it to an empty list. */
  studio: StudioItem[];
  /** Missing on older files; `lib/db.ts` fills in the seeded services. */
  heroServices: HeroService[];
  settings: Settings;
}

export const DB_VERSION = 2;
