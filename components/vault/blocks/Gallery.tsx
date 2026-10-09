"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cx } from "@/components/site/hooks";
import type { Picture } from "@/lib/vault/media-urls";
import type { GalleryBlock } from "@/lib/vault/types";

import { useReducedMotion } from "../hooks";
import Lightbox from "../Lightbox";
import Rail from "../Rail";

const SLIDE_MS = 5200;
const PAGE = 36;

function Thumb({ picture, sizes }: { picture: Picture; sizes: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={picture.src}
        srcSet={picture.srcSet}
        sizes={sizes}
        alt={picture.caption ?? ""}
        width={picture.w}
        height={picture.h}
        loading="lazy"
        decoding="async"
      />
      {picture.kind === "video" ? <span className="vt-play-badge" aria-hidden="true" /> : null}
    </>
  );
}

/** The cinematic one: a big stage, a strip of thumbnails, and it plays itself. */
function Slideshow({
  pictures,
  autoplay,
  captions,
  onOpen,
}: {
  pictures: Picture[];
  autoplay: boolean;
  captions: boolean;
  onOpen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(autoplay);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const count = pictures.length;
  const still = useReducedMotion();

  const go = useCallback((by: number) => setIndex((i) => (i + by + count) % count), [count]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const playing = running && !still && !held && visible && count > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go(1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index, go]);

  // Keep the active thumbnail in view without moving the page.
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (!strip || !active) return;
    const left = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [index]);

  // Load the next picture ahead.
  useEffect(() => {
    const next = pictures[(index + 1) % count];
    if (next?.kind === "image") {
      const img = new Image();
      if (next.srcSet) img.srcset = next.srcSet;
      img.src = next.src;
    }
  }, [index, pictures, count]);

  const current = pictures[index];

  return (
    <div className="vt-slides" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
      <div
        ref={stageRef}
        className="vt-slides-stage"
        tabIndex={0}
        role="group"
        aria-roledescription="slideshow"
        aria-label={`Photo ${index + 1} of ${count}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
          else if (e.key === "Enter") onOpen(index);
        }}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* The same photo, blurred, fills the frame around a photo of any shape. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={`bg-${current.key}`} className="vt-slides-backdrop" src={current.src} alt="" aria-hidden="true" />
        <button
          key={current.key}
          type="button"
          className="vt-slides-photo"
          onClick={() => onOpen(index)}
          data-cursor={current.kind === "video" ? "Play" : "Open"}
          aria-label={current.kind === "video" ? "Play the video" : "Open full screen"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            srcSet={current.srcSet}
            sizes="(min-width: 1520px) 1424px, 92vw"
            alt={current.caption ?? ""}
            decoding="async"
          />
          {current.kind === "video" ? <span className="vt-play-badge vt-play-badge--lg" aria-hidden="true" /> : null}
        </button>
        {captions && current.caption ? <p className="vt-slides-caption">{current.caption}</p> : null}
        {count > 1 ? (
          <>
            <button type="button" className="vt-slides-nav vt-slides-prev" onClick={() => go(-1)} aria-label="Previous photo">
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" className="vt-slides-nav vt-slides-next" onClick={() => go(1)} aria-label="Next photo">
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : null}
        {playing ? <span key={`p-${index}`} className="vt-slides-progress" style={{ animationDuration: `${SLIDE_MS}ms` }} /> : null}
      </div>

      <div className="vt-slides-bar">
        <span className="mono vt-slides-count">
          {String(index + 1).padStart(3, "0")} <span>/ {String(count).padStart(3, "0")}</span>
        </span>
        {count > 1 ? (
          <button type="button" className="vt-slides-toggle mono" onClick={() => setRunning((r) => !r)} aria-pressed={running}>
            {running ? "Pause" : "Play"}
          </button>
        ) : null}
        <button type="button" className="vt-slides-toggle mono" onClick={() => onOpen(index)}>
          Full screen
        </button>
      </div>

      {count > 1 ? (
        <div ref={stripRef} className="vt-slides-strip" aria-label="All photos">
          {pictures.map((p, i) => (
            <button
              key={p.key}
              type="button"
              data-i={i}
              className="vt-slides-thumb"
              aria-current={i === index ? "true" : undefined}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <Thumb picture={p} sizes="160px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Gallery({
  block,
  pictures,
}: {
  block: Pick<GalleryBlock, "layout" | "autoplay" | "captions" | "chapters" | "label" | "title">;
  pictures: Picture[];
}) {
  const chapters = useMemo(() => {
    if (!block.chapters) return [];
    const names: string[] = [];
    for (const p of pictures) if (p.chapter && !names.includes(p.chapter)) names.push(p.chapter);
    return names;
  }, [pictures, block.chapters]);
  const [chapter, setChapter] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE);

  const set = chapter === null ? pictures : pictures.filter((p) => (p.chapter ?? "") === chapter);
  const label = block.title || block.label || "Gallery";
  const paged = block.layout === "masonry" || block.layout === "grid";
  const visible = paged ? set.slice(0, shown) : set;

  if (!pictures.length) return null;

  return (
    <div className={cx("vt-gallery", `vt-gallery--${block.layout}`)}>
      {chapters.length > 1 ? (
        <div className="wrap">
          <div className="vt-chapters" role="tablist" aria-label="Chapters">
            <button type="button" role="tab" aria-selected={chapter === null} className="vt-chapter" onClick={() => setChapter(null)}>
              All <span className="mono">{pictures.length}</span>
            </button>
            {chapters.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={chapter === name}
                className="vt-chapter"
                onClick={() => {
                  setChapter(name);
                  setShown(PAGE);
                }}
              >
                {name} <span className="mono">{pictures.filter((p) => p.chapter === name).length}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {block.layout === "slideshow" ? (
        <div className="wrap">
          <Slideshow key={chapter ?? "all"} pictures={set} autoplay={block.autoplay} captions={block.captions} onOpen={setOpen} />
        </div>
      ) : block.layout === "filmstrip" ? (
        <Rail label={label} className="vt-film">
          {set.map((p, i) => (
            <button
              key={p.key}
              type="button"
              className="vt-film-item"
              onClick={() => setOpen(i)}
              data-cursor={p.kind === "video" ? "Play" : "Open"}
              style={p.w && p.h ? { aspectRatio: `${p.w} / ${p.h}` } : undefined}
            >
              <Thumb picture={p} sizes="(min-width: 768px) 40vw, 80vw" />
              {block.captions && p.caption ? <span className="vt-tile-caption">{p.caption}</span> : null}
            </button>
          ))}
        </Rail>
      ) : (
        <div className="wrap">
          <div className={block.layout === "masonry" ? "vt-masonry" : "vt-tiles"}>
            {visible.map((p, i) => (
              <button
                key={p.key}
                type="button"
                className="vt-tile"
                onClick={() => setOpen(i)}
                data-cursor={p.kind === "video" ? "Play" : "Open"}
                style={block.layout === "masonry" && p.w && p.h ? { aspectRatio: `${p.w} / ${p.h}` } : undefined}
              >
                <Thumb picture={p} sizes={block.layout === "masonry" ? "(min-width: 1100px) 30vw, (min-width: 640px) 45vw, 92vw" : "(min-width: 1100px) 24vw, 46vw"} />
                {block.captions && p.caption ? <span className="vt-tile-caption">{p.caption}</span> : null}
              </button>
            ))}
          </div>
          {paged && set.length > shown ? (
            <div className="vt-more">
              <button type="button" className="btn-line" onClick={() => setShown((n) => n + PAGE * 2)}>
                Show more <span className="mono">({set.length - shown} left)</span>
              </button>
            </div>
          ) : null}
        </div>
      )}

      <Lightbox pictures={set} index={open} onIndex={setOpen} onClose={() => setOpen(null)} label={label} />
    </div>
  );
}
