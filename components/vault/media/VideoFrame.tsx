"use client";

import { useState, type ReactNode } from "react";

import { Arrow } from "@/components/site/icons";
import { PLATFORM_NAMES, parseMediaUrl, type ParsedMedia } from "@/lib/vault/embeds";
import type { VideoItem } from "@/lib/vault/types";

import LazyFrame from "./LazyFrame";
import PlatformIcon from "./PlatformIcon";

type Shape = "landscape" | "portrait" | "square";

/** Not every video has the larger still; YouTube always has hqdefault. */
function swapToFallbackStill(img: HTMLImageElement, id: string) {
  const fallback = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  if (img.src !== fallback) img.src = fallback;
}

function shapeOf(item: VideoItem, parsed: ParsedMedia | null): Shape {
  if (item.orientation !== "auto") return item.orientation;
  if (parsed) return parsed.orientation;
  const { w, h } = item.file ?? {};
  if (w && h) return h > w * 1.1 ? "portrait" : Math.abs(w - h) < w * 0.1 ? "square" : "landscape";
  return "landscape";
}

/** The platform's own player, sized to the frame. */
function embedSrc(parsed: ParsedMedia, shape: Shape, autoplay = false) {
  let src = parsed.embedUrl;
  if (parsed.platform === "facebook") {
    src += shape === "portrait" ? "&width=360&height=640" : "&width=1280";
    if (autoplay) src += "&autoplay=true";
  } else if (autoplay && (parsed.platform === "youtube" || parsed.platform === "vimeo")) {
    src += `${src.includes("?") ? "&" : "?"}autoplay=1`;
  }
  return src;
}

/**
 * One video, framed so it reads as where it lives: the platform's mark and
 * colour, the account that posted it, and a "Watch on …" link. Vertical
 * reels, shorts and TikToks stand in a phone. YouTube and Vimeo show a still
 * until played; the others load their player as they near the screen.
 */
export default function VideoFrame({ item, size }: { item: VideoItem; size: "feature" | "row" | "reel" }) {
  const parsed = item.url ? parseMediaUrl(item.url) : null;
  const shape = shapeOf(item, parsed);
  const [playing, setPlaying] = useState(false);
  // Instagram's player reports its height; the frame follows it.
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const platform = parsed?.platform ?? (item.file ? "file" : null);
  if (!platform) return null;

  const name = platform === "file" ? "Mark UI" : PLATFORM_NAMES[platform];
  const title = item.title || item.label || `${name} video`;
  const ready = parsed && parsed.embedUrl && !parsed.needsResolve;

  let player: ReactNode;
  if (platform === "file" && item.file) {
    player = (
      <video
        className="vt-video-native"
        src={item.file.url}
        poster={item.file.poster}
        controls
        playsInline
        preload="metadata"
      />
    );
  } else if (ready && parsed.thumbnail && !playing) {
    player = (
      <button type="button" className="vt-video-lite" onClick={() => setPlaying(true)} data-cursor="Play" aria-label={`Play ${title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={parsed.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => swapToFallbackStill(e.currentTarget, parsed.id)}
          // A missing still comes back as YouTube's 120×90 grey placeholder, not an error.
          onLoad={(e) => e.currentTarget.naturalWidth <= 120 && swapToFallbackStill(e.currentTarget, parsed.id)}
        />
        <span className="vt-video-play" aria-hidden="true">
          <PlatformIcon platform={parsed.platform} />
        </span>
      </button>
    );
  } else if (ready) {
    player = (
      <LazyFrame
        src={embedSrc(parsed, shape, playing)}
        title={title}
        onHeight={parsed.platform === "instagram" ? setFrameHeight : undefined}
      />
    );
  } else {
    // A link we couldn't turn into a player (a private post, an unexpanded
    // short link): a card that opens it on the platform.
    player = (
      <a className="vt-video-out" href={item.url} target="_blank" rel="noopener noreferrer" data-cursor="Open">
        <PlatformIcon platform={platform} />
        <span>Watch on {name}</span>
      </a>
    );
  }

  return (
    <figure className="vt-video" data-platform={platform} data-shape={shape} data-size={size} data-kind={parsed?.kind ?? "video"}>
      <div className="vt-video-device">
        <div className="vt-video-head">
          <span className="vt-video-mark">
            <PlatformIcon platform={platform} />
          </span>
          <span className="vt-video-who">
            <span className="vt-video-account">{item.account || name}</span>
            <span className="vt-video-where">{platform === "file" ? "Original file" : name}</span>
          </span>
          {item.label ? <span className="vt-video-label">{item.label}</span> : null}
        </div>
        <div className="vt-video-screen" style={frameHeight ? { height: frameHeight, maxHeight: "none" } : undefined}>
          {player}
        </div>
      </div>
      {item.title || item.description || (parsed && platform !== "file") ? (
        <figcaption className="vt-video-cap">
          {item.title ? <span className="vt-video-title">{item.title}</span> : null}
          {item.description ? <span className="vt-video-desc">{item.description}</span> : null}
          {parsed && platform !== "file" ? (
            <a className="btn-line vt-video-link" href={parsed.watchUrl} target="_blank" rel="noopener noreferrer">
              Watch on {name} <Arrow />
            </a>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
