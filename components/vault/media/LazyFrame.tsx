"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The height an embedded post reports about itself. Instagram's player posts
 * {type: "MEASURE", details: {height}}; X's posts a "twttr.private.resize"
 * call. Anything else is ignored.
 */
function reportedHeight(data: unknown): number | null {
  let value = data;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const v = value as {
    type?: string;
    details?: { height?: number };
    "twttr.embed"?: { method?: string; params?: { height?: number }[] };
  };
  if (v.type === "MEASURE" && typeof v.details?.height === "number") return v.details.height;
  const tw = v["twttr.embed"];
  if (tw?.method === "twttr.private.resize" && typeof tw.params?.[0]?.height === "number") return tw.params[0].height;
  return null;
}

/**
 * An iframe that only loads once it is close to the screen, so a page with a
 * dozen reels and posts doesn't fetch every player up front. With
 * `onHeight`, posts that report their own height (Instagram, X) are sized
 * to fit exactly.
 */
export default function LazyFrame({
  src,
  title,
  className,
  allow = "autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; web-share",
  sandbox,
  onHeight,
}: {
  src: string;
  title: string;
  className?: string;
  allow?: string;
  sandbox?: string;
  onHeight?: (height: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near || !onHeight) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const height = reportedHeight(e.data);
      if (height && height > 80 && height < 4000) onHeight(Math.ceil(height));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [near, onHeight]);

  return (
    <div ref={ref} className={className ? `vt-frame ${className}` : "vt-frame"} data-cursor-native="">
      {near ? (
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          allow={allow}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox={sandbox}
        />
      ) : (
        <span className="vt-frame-wait" aria-hidden="true" />
      )}
    </div>
  );
}
