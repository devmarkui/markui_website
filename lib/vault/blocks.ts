import type {
  BlockOf,
  BlockType,
  ComparePair,
  FileItem,
  GalleryUpload,
  MediaRef,
  PosterItem,
  ResultItem,
  SocialItem,
  VaultBlock,
  VideoItem,
  WebsitePage,
} from "./types";

/**
 * What each section type is called and what it is for (the editor's "Add
 * section" menu), and empty instances of every type. Client-safe.
 */

export const BLOCK_INFO: Record<BlockType, { name: string; hint: string; defaultLabel: string }> = {
  story: {
    name: "Story",
    hint: "Paragraphs of text: the brief, the idea, how it went.",
    defaultLabel: "The story",
  },
  video: {
    name: "Videos",
    hint: "Teasers, announcements, aftermovies, reels. Paste YouTube, Instagram, Facebook, TikTok, Vimeo or Drive links, or upload.",
    defaultLabel: "Films",
  },
  posters: {
    name: "Posters",
    hint: "Poster and artwork cards with a title and a note each.",
    defaultLabel: "Posters",
  },
  gallery: {
    name: "Photo gallery",
    hint: "A slideshow, masonry or filmstrip from a Google Drive folder, a Google Photos album or uploads.",
    defaultLabel: "Gallery",
  },
  social: {
    name: "Social posts",
    hint: "Instagram, Facebook, TikTok, LinkedIn or X posts, shown as they look on the platform.",
    defaultLabel: "On social",
  },
  website: {
    name: "Website",
    hint: "The live site in desktop, tablet and phone frames, page by page, with screenshots where it can't be framed.",
    defaultLabel: "The website",
  },
  embed: {
    name: "Prototype & embeds",
    hint: "A Figma prototype, Canva design, Google Slides deck, PDF, Loom or 3D scene.",
    defaultLabel: "Prototype",
  },
  compare: {
    name: "Before / after",
    hint: "Two images with a slider between them: a retouch, a rebrand, a redesign.",
    defaultLabel: "Before & after",
  },
  results: {
    name: "Results",
    hint: "The numbers: reach, sales, followers, load time.",
    defaultLabel: "Results",
  },
  quote: {
    name: "Client quote",
    hint: "What the client said, with their name and role.",
    defaultLabel: "In their words",
  },
  files: {
    name: "Files & downloads",
    hint: "Brand guidelines, brochures, decks and source files to download.",
    defaultLabel: "Files",
  },
};

/** A short random id for sections and their items. */
export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID().replace(/-/g, "").slice(0, 12);
  return Math.random().toString(36).slice(2, 14);
}

const base = (type: BlockType) => ({
  id: newId(),
  label: BLOCK_INFO[type].defaultLabel,
  title: "",
  intro: "",
  ground: "auto" as const,
  hidden: false,
});

export function createBlock<T extends BlockType>(type: T, overrides: Partial<BlockOf<T>> = {}): BlockOf<T> {
  let block: VaultBlock;
  switch (type) {
    case "story":
      block = { ...base(type), type: "story", layout: "split", body: "" };
      break;
    case "video":
      block = { ...base(type), type: "video", layout: "feature", items: [createVideoItem()] };
      break;
    case "posters":
      block = { ...base(type), type: "posters", layout: "grid", items: [] };
      break;
    case "gallery":
      block = {
        ...base(type),
        type: "gallery",
        layout: "slideshow",
        source: "drive",
        url: "",
        items: [],
        autoplay: true,
        captions: false,
        chapters: true,
        limit: 0,
      };
      break;
    case "social":
      block = { ...base(type), type: "social", layout: "rail", items: [createSocialItem()] };
      break;
    case "website":
      block = {
        ...base(type),
        type: "website",
        url: "",
        mode: "auto",
        devices: ["desktop", "tablet", "mobile"],
        pages: [createWebsitePage("Home", "/")],
        frameable: null,
        checkedAt: "",
      };
      break;
    case "embed":
      block = { ...base(type), type: "embed", url: "", file: null, ratio: "16:9", caption: "" };
      break;
    case "compare":
      block = { ...base(type), type: "compare", items: [createComparePair()] };
      break;
    case "results":
      block = { ...base(type), type: "results", items: [createResultItem(), createResultItem(), createResultItem()] };
      break;
    case "quote":
      block = { ...base(type), type: "quote", text: "", name: "", role: "", avatar: null };
      break;
    case "files":
      block = { ...base(type), type: "files", items: [] };
      break;
    default: {
      const never: never = type;
      throw new Error(`Unknown section type ${String(never)}`);
    }
  }
  return { ...block, ...overrides } as BlockOf<T>;
}

export function createVideoItem(overrides: Partial<VideoItem> = {}): VideoItem {
  return {
    id: newId(),
    url: "",
    file: null,
    label: "",
    title: "",
    description: "",
    account: "",
    orientation: "auto",
    ...overrides,
  };
}

export function createPosterItem(image: MediaRef | null = null): PosterItem {
  return { id: newId(), image, title: "", description: "", date: "" };
}

export function createGalleryUpload(media: MediaRef): GalleryUpload {
  return { id: newId(), media, caption: "" };
}

export function createSocialItem(url = ""): SocialItem {
  return { id: newId(), url, note: "" };
}

export function createWebsitePage(label = "", url = ""): WebsitePage {
  return { id: newId(), label, url, desktop: null, mobile: null };
}

export function createComparePair(): ComparePair {
  return { id: newId(), before: null, after: null, beforeLabel: "Before", afterLabel: "After", caption: "" };
}

export function createResultItem(): ResultItem {
  return { id: newId(), value: "", label: "", note: "" };
}

export function createFileItem(file: MediaRef | null = null): FileItem {
  return { id: newId(), file, url: "", label: file?.name ?? "", note: "" };
}

/** A copy with fresh ids, for "Duplicate section". */
export function cloneBlock(block: VaultBlock): VaultBlock {
  const copy = JSON.parse(JSON.stringify(block)) as VaultBlock;
  copy.id = newId();
  if ("items" in copy && Array.isArray(copy.items)) {
    for (const item of copy.items as { id: string }[]) item.id = newId();
  }
  if (copy.type === "website") for (const page of copy.pages) page.id = newId();
  return copy;
}
