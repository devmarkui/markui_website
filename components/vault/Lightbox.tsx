"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { Picture } from "@/lib/vault/media-urls";

/**
 * Full-screen viewer shared by galleries, posters and before/after pairs.
 * Arrow keys and swipes move through the set, Escape closes, and the
 * neighbours are fetched ahead so moving on is instant.
 */
export default function Lightbox({
  pictures,
  index,
  onIndex,
  onClose,
  label,
}: {
  pictures: Picture[];
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
  label?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const open = index !== null && pictures.length > 0;
  const count = pictures.length;

  const go = useCallback(
    (by: number) => {
      if (index === null) return;
      onIndex((index + by + count) % count);
    },
    [index, count, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, go, onClose]);

  // Fetch the neighbours ahead.
  useEffect(() => {
    if (index === null) return;
    for (const by of [1, -1, 2]) {
      const p = pictures[(index + by + count) % count];
      if (p?.kind === "image" && p.full) {
        const img = new Image();
        img.src = p.full;
      }
    }
  }, [index, pictures, count]);

  if (!open || typeof document === "undefined") return null;
  const picture = pictures[index];

  return createPortal(
    <div
      className="vt-lightbox sx"
      role="dialog"
      aria-modal="true"
      aria-label={label ? `${label}: ${index + 1} of ${count}` : `${index + 1} of ${count}`}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="vt-lightbox-bar">
        <span className="mono vt-lightbox-count">
          {String(index + 1).padStart(3, "0")} <span>/ {String(count).padStart(3, "0")}</span>
        </span>
        {picture.caption ? <span className="vt-lightbox-caption">{picture.caption}</span> : null}
        <button ref={closeRef} type="button" className="vt-lightbox-close" onClick={onClose} aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="vt-lightbox-stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {picture.kind === "video" && picture.embed ? (
          <div className="vt-lightbox-video" data-cursor-native="">
            <iframe src={picture.embed} title={picture.caption ?? "Video"} allow="autoplay; fullscreen" allowFullScreen />
          </div>
        ) : picture.kind === "video" && picture.video ? (
          <video key={picture.key} className="vt-lightbox-media" src={picture.video} poster={picture.poster} controls autoPlay playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={picture.key} className="vt-lightbox-media" src={picture.full} alt={picture.caption ?? ""} decoding="async" />
        )}
      </div>

      {count > 1 ? (
        <>
          <button type="button" className="vt-lightbox-nav vt-lightbox-prev" onClick={() => go(-1)} aria-label="Previous">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="vt-lightbox-nav vt-lightbox-next" onClick={() => go(1)} aria-label="Next">
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
