/**
 * Turns the links people paste (a YouTube video, an Instagram reel, a
 * Facebook video, a TikTok, a Figma prototype …) into what the Vault needs to
 * show them: which platform it is, the embeddable URL, the link to open it on
 * the platform, and whether it is vertical.
 *
 * Client-safe: the editor uses it to say "Facebook video · vertical" as you
 * paste. Short links (fb.watch, vm.tiktok.com, facebook.com/share/…) carry
 * no id; `needsResolve` marks them and lib/vault/resolve.ts expands them on
 * the server when the project is saved.
 */

export type Platform =
  | "youtube"
  | "vimeo"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "drive"
  | "linkedin"
  | "x"
  | "file";

export interface ParsedMedia {
  platform: Platform;
  /** A playable video, or a post (photo, carousel, text) shown as the platform renders it. */
  kind: "video" | "post";
  id: string;
  embedUrl: string;
  /** Where "Watch on …" goes. */
  watchUrl: string;
  orientation: "landscape" | "portrait" | "square";
  /** A still to show before the player loads (YouTube only — the others need a token). */
  thumbnail?: string;
  needsResolve?: boolean;
}

export const PLATFORM_NAMES: Record<Platform, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  drive: "Google Drive",
  linkedin: "LinkedIn",
  x: "X",
  file: "Video file",
};

function toUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function host(url: URL) {
  return url.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.|web\.)/, "");
}

/** "1m30s", "90", "90s" → 90. */
function seconds(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

const VIDEO_FILE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function isVideoFileUrl(raw: string) {
  return raw.startsWith("/media/vault/") ? VIDEO_FILE.test(raw) : VIDEO_FILE.test(raw) && /^https:\/\//i.test(raw);
}

function youtube(url: URL): ParsedMedia | null {
  const h = host(url);
  let id = "";
  let portrait = false;
  if (h === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = url.searchParams.get("v") ?? "";
    else if (parts[0] === "shorts") {
      id = parts[1] ?? "";
      portrait = true;
    } else if (["live", "embed", "v"].includes(parts[0])) id = parts[1] ?? "";
    else if (parts[0] === "playlist") {
      const list = url.searchParams.get("list");
      if (!list || !/^[\w-]+$/.test(list)) return null;
      return {
        platform: "youtube",
        kind: "video",
        id: list,
        embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&rel=0`,
        watchUrl: `https://www.youtube.com/playlist?list=${list}`,
        orientation: "landscape",
      };
    }
  } else return null;

  if (!/^[\w-]{11}$/.test(id)) return null;
  const start = seconds(url.searchParams.get("t") ?? url.searchParams.get("start"));
  return {
    platform: "youtube",
    kind: "video",
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${start ? `&start=${start}` : ""}`,
    watchUrl: portrait ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    orientation: portrait ? "portrait" : "landscape",
    // Shorts have an original-aspect still; for the rest hq720 is a 16:9 frame
    // without the letterbox bars hqdefault carries (VideoFrame falls back to it).
    thumbnail: portrait ? `https://i.ytimg.com/vi/${id}/oardefault.jpg` : `https://i.ytimg.com/vi/${id}/hq720.jpg`,
  };
}

function vimeo(url: URL): ParsedMedia | null {
  const h = host(url);
  if (h !== "vimeo.com" && h !== "player.vimeo.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const at = parts.findIndex((p) => /^\d+$/.test(p));
  if (at === -1) return null;
  const id = parts[at];
  // Unlisted videos carry a hash, as /123/abcdef or ?h=abcdef.
  const hash = url.searchParams.get("h") ?? (parts[at + 1] && /^[a-f0-9]+$/i.test(parts[at + 1]) ? parts[at + 1] : "");
  return {
    platform: "vimeo",
    kind: "video",
    id,
    embedUrl: `https://player.vimeo.com/video/${id}?dnt=1${hash ? `&h=${hash}` : ""}`,
    watchUrl: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`,
    orientation: "landscape",
  };
}

function instagram(url: URL): ParsedMedia | null {
  if (host(url) !== "instagram.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // /p/CODE, /reel/CODE, /reels/CODE, /tv/CODE — newer links put the account first.
  const at = parts.findIndex((p) => ["p", "reel", "reels", "tv"].includes(p));
  if (at === -1) return null;
  const type = parts[at];
  const code = parts[at + 1] ?? "";
  if (!/^[\w-]{5,}$/.test(code)) return null;
  const isVideo = type !== "p";
  const path = isVideo ? "reel" : "p";
  return {
    platform: "instagram",
    kind: isVideo ? "video" : "post",
    id: code,
    embedUrl: `https://www.instagram.com/${path}/${code}/embed/`,
    watchUrl: `https://www.instagram.com/${path}/${code}/`,
    orientation: isVideo ? "portrait" : "square",
  };
}

function facebook(url: URL): ParsedMedia | null {
  const h = host(url);
  if (h === "fb.watch") {
    return {
      platform: "facebook",
      kind: "video",
      id: url.pathname.slice(1),
      embedUrl: "",
      watchUrl: url.toString(),
      orientation: "landscape",
      needsResolve: true,
    };
  }
  if (h !== "facebook.com" && h !== "fb.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] === "share") {
    const kind = parts[1] === "v" || parts[1] === "r" ? "video" : "post";
    return {
      platform: "facebook",
      kind,
      id: parts[2] ?? parts[1] ?? "",
      embedUrl: "",
      watchUrl: url.toString(),
      orientation: parts[1] === "r" ? "portrait" : "landscape",
      needsResolve: true,
    };
  }

  let videoId = "";
  let reel = false;
  if (parts[0] === "reel" && /^\d+$/.test(parts[1] ?? "")) {
    videoId = parts[1];
    reel = true;
  } else if (parts[0] === "watch" || parts[0] === "video.php") videoId = url.searchParams.get("v") ?? "";
  else {
    const at = parts.indexOf("videos");
    if (at !== -1) videoId = parts.slice(at + 1).find((p) => /^\d+$/.test(p)) ?? "";
  }

  if (/^\d+$/.test(videoId)) {
    const canonical = reel ? `https://www.facebook.com/reel/${videoId}` : `https://www.facebook.com/watch/?v=${videoId}`;
    return {
      platform: "facebook",
      kind: "video",
      id: videoId,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=false&t=0`,
      watchUrl: canonical,
      orientation: reel ? "portrait" : "landscape",
    };
  }

  // Anything else on facebook.com is treated as a post (posts, photos, permalinks).
  const clean = new URL(url.toString());
  clean.hostname = "www.facebook.com";
  for (const key of [...clean.searchParams.keys()]) {
    if (!["story_fbid", "id", "fbid", "set"].includes(key)) clean.searchParams.delete(key);
  }
  if (parts.length === 0) return null;
  return {
    platform: "facebook",
    kind: "post",
    id: parts.join("/"),
    embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(clean.toString())}&show_text=true`,
    watchUrl: clean.toString(),
    orientation: "square",
  };
}

function tiktok(url: URL): ParsedMedia | null {
  const h = host(url);
  if (h === "vm.tiktok.com" || h === "vt.tiktok.com" || (h === "tiktok.com" && url.pathname.startsWith("/t/"))) {
    return {
      platform: "tiktok",
      kind: "video",
      id: url.pathname,
      embedUrl: "",
      watchUrl: url.toString(),
      orientation: "portrait",
      needsResolve: true,
    };
  }
  if (h !== "tiktok.com") return null;
  const m = /\/(video|photo)\/(\d+)/.exec(url.pathname);
  if (!m) return null;
  const user = /\/@([\w.-]+)/.exec(url.pathname)?.[1];
  const id = m[2];
  return {
    platform: "tiktok",
    kind: m[1] === "video" ? "video" : "post",
    id,
    embedUrl:
      m[1] === "video"
        ? `https://www.tiktok.com/player/v1/${id}?music_info=0&description=0&rel=0`
        : `https://www.tiktok.com/embed/v2/${id}`,
    watchUrl: `https://www.tiktok.com/${user ? `@${user}` : "@"}/${m[1]}/${id}`,
    orientation: "portrait",
  };
}

export function driveFileId(url: URL): string | null {
  const h = host(url);
  if (h !== "drive.google.com" && h !== "docs.google.com") return null;
  const m = /\/file\/d\/([\w-]{10,})/.exec(url.pathname);
  if (m) return m[1];
  const id = url.searchParams.get("id");
  return id && /^[\w-]{10,}$/.test(id) && !url.pathname.includes("folders") ? id : null;
}

function drive(url: URL): ParsedMedia | null {
  const id = driveFileId(url);
  if (!id) return null;
  return {
    platform: "drive",
    kind: "video",
    id,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    watchUrl: `https://drive.google.com/file/d/${id}/view`,
    orientation: "landscape",
  };
}

function linkedin(url: URL): ParsedMedia | null {
  if (host(url) !== "linkedin.com") return null;
  const urn = /urn:li:(share|ugcPost|activity):(\d+)/.exec(decodeURIComponent(url.pathname + url.search));
  let type = urn?.[1];
  let id = urn?.[2];
  if (!id) {
    const m = /-(share|ugcPost|activity)-(\d{10,})-/.exec(url.pathname);
    if (m) {
      type = m[1];
      id = m[2];
    }
  }
  if (!id || !type) return null;
  return {
    platform: "linkedin",
    kind: "post",
    id,
    embedUrl: `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`,
    watchUrl: `https://www.linkedin.com/feed/update/urn:li:${type}:${id}/`,
    orientation: "square",
  };
}

function x(url: URL): ParsedMedia | null {
  const h = host(url);
  if (h !== "x.com" && h !== "twitter.com") return null;
  const m = /^\/([\w]+)\/status\/(\d+)/.exec(url.pathname);
  if (!m) return null;
  return {
    platform: "x",
    kind: "post",
    id: m[2],
    embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${m[2]}&theme=dark&dnt=true`,
    watchUrl: `https://x.com/${m[1]}/status/${m[2]}`,
    orientation: "square",
  };
}

/** Recognises a pasted link, or returns null when it isn't one we can show. */
export function parseMediaUrl(raw: string): ParsedMedia | null {
  if (isVideoFileUrl(raw)) {
    return { platform: "file", kind: "video", id: raw, embedUrl: raw, watchUrl: raw, orientation: "landscape" };
  }
  const url = toUrl(raw);
  if (!url) return null;
  return youtube(url) ?? vimeo(url) ?? instagram(url) ?? facebook(url) ?? tiktok(url) ?? drive(url) ?? linkedin(url) ?? x(url);
}

/** "Facebook video · vertical", for the editor. */
export function describeMedia(parsed: ParsedMedia): string {
  const what = parsed.kind === "video" ? "video" : "post";
  const shape = parsed.orientation === "portrait" ? " · vertical" : "";
  return `${PLATFORM_NAMES[parsed.platform]} ${what}${shape}`;
}

// ─── Prototype & embeds ──────────────────────────────────────────────────────

export interface ParsedEmbed {
  provider: string;
  embedUrl: string;
  openUrl: string;
}

/**
 * The "Prototype & embeds" section: Figma, Canva, Google Slides/Docs/Sheets,
 * Drive files (PDFs), Loom, Spline, CodePen, Behance, Sketchfab, YouTube
 * playlists and Vimeo — or, failing those, any https page as it is.
 */
export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  const url = toUrl(raw);
  if (!url || url.protocol !== "https:") return null;
  const h = host(url);
  const open = url.toString();

  if (h === "figma.com" || h.endsWith(".figma.com")) {
    return {
      provider: "Figma",
      embedUrl: `https://www.figma.com/embed?embed_host=markui&url=${encodeURIComponent(open)}`,
      openUrl: open,
    };
  }
  if (h === "canva.com" && url.pathname.startsWith("/design/")) {
    const path = url.pathname.replace(/\/(edit|view|watch)\/?$/, "/view");
    return { provider: "Canva", embedUrl: `https://www.canva.com${path}?embed`, openUrl: open };
  }
  if (h === "docs.google.com") {
    const m = /^\/(presentation|document|spreadsheets)\/d\/([\w-]+)/.exec(url.pathname);
    if (m) {
      const embed =
        m[1] === "presentation"
          ? `https://docs.google.com/presentation/d/${m[2]}/embed?start=false&loop=false`
          : `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
      const names = { presentation: "Google Slides", document: "Google Docs", spreadsheets: "Google Sheets" };
      return { provider: names[m[1] as keyof typeof names], embedUrl: embed, openUrl: open };
    }
  }
  const driveId = driveFileId(url);
  if (driveId) {
    return {
      provider: "Google Drive",
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      openUrl: `https://drive.google.com/file/d/${driveId}/view`,
    };
  }
  if (h === "loom.com") {
    const m = /\/(share|embed)\/([\w-]+)/.exec(url.pathname);
    if (m) return { provider: "Loom", embedUrl: `https://www.loom.com/embed/${m[2]}`, openUrl: open };
  }
  if (h === "codepen.io") {
    const m = /^\/([\w-]+)\/(pen|full|details)\/([\w]+)/.exec(url.pathname);
    if (m) {
      return {
        provider: "CodePen",
        embedUrl: `https://codepen.io/${m[1]}/embed/${m[3]}?default-tab=result`,
        openUrl: open,
      };
    }
  }
  if (h === "behance.net") {
    const m = /\/gallery\/(\d+)/.exec(url.pathname);
    if (m) return { provider: "Behance", embedUrl: `https://www.behance.net/embed/project/${m[1]}?ilo0=1`, openUrl: open };
  }
  if (h === "sketchfab.com") {
    const m = /\/3d-models\/[\w-]*?([a-f0-9]{32})/.exec(url.pathname) ?? /\/models\/([a-f0-9]{32})/.exec(url.pathname);
    if (m) return { provider: "Sketchfab", embedUrl: `https://sketchfab.com/models/${m[1]}/embed`, openUrl: open };
  }
  if (h === "my.spline.design" || h.endsWith(".spline.design")) {
    return { provider: "Spline", embedUrl: open, openUrl: open };
  }
  const media = parseMediaUrl(raw);
  if (media && media.embedUrl && (media.platform === "youtube" || media.platform === "vimeo")) {
    return { provider: PLATFORM_NAMES[media.platform], embedUrl: media.embedUrl, openUrl: media.watchUrl };
  }
  return { provider: h, embedUrl: open, openUrl: open };
}

// ─── Gallery links ───────────────────────────────────────────────────────────

export function driveFolderId(raw: string): string | null {
  const url = toUrl(raw);
  if (!url) return null;
  const h = host(url);
  if (h !== "drive.google.com") return null;
  const m = /\/folders\/([\w-]{10,})/.exec(url.pathname);
  if (m) return m[1];
  const id = url.searchParams.get("id");
  return id && /^[\w-]{10,}$/.test(id) ? id : null;
}

export function isGooglePhotosUrl(raw: string): boolean {
  const url = toUrl(raw);
  if (!url) return false;
  const h = host(url);
  return h === "photos.app.goo.gl" || (h === "photos.google.com" && /\/(share|album)\//.test(url.pathname));
}

/** The `vault_albums` key for a gallery link, or null when it isn't one. */
export function albumKey(raw: string): string | null {
  const folder = driveFolderId(raw);
  if (folder) return `drive:${folder}`;
  if (isGooglePhotosUrl(raw)) {
    const url = toUrl(raw)!;
    return `gphotos:${host(url)}${url.pathname}`.slice(0, 190);
  }
  return null;
}

/** Google's image CDN for a public Drive file, at a given width. */
export function driveImageUrl(id: string, width: number) {
  return `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}
