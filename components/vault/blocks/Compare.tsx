"use client";

import { useRef, useState } from "react";

import { refPicture } from "@/lib/vault/media-urls";
import type { ComparePair } from "@/lib/vault/types";

/**
 * Before and after, one over the other, with a handle to slide between them.
 * The handle is a real range input, so it works from the keyboard too.
 */
function Pair({ pair }: { pair: ComparePair }) {
  const [at, setAt] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  if (!pair.before || !pair.after) return null;
  const before = refPicture(pair.before, `${pair.id}-b`);
  const after = refPicture(pair.after, `${pair.id}-a`);
  const ratio = after.w && after.h ? `${after.w} / ${after.h}` : "3 / 2";

  const fromPointer = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setAt(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <figure className="vt-compare">
      <div
        ref={box}
        className="vt-compare-box"
        style={{ aspectRatio: ratio }}
        data-cursor="Slide"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after.src} srcSet={after.srcSet} sizes="(min-width: 1100px) 1100px, 92vw" alt={pair.afterLabel} loading="lazy" />
        <div className="vt-compare-before" style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before.src} srcSet={before.srcSet} sizes="(min-width: 1100px) 1100px, 92vw" alt={pair.beforeLabel} loading="lazy" />
        </div>
        <span className="vt-compare-tag vt-compare-tag--before mono">{pair.beforeLabel}</span>
        <span className="vt-compare-tag vt-compare-tag--after mono">{pair.afterLabel}</span>
        <span className="vt-compare-line" style={{ left: `${at}%` }} aria-hidden="true">
          <span className="vt-compare-knob">↔</span>
        </span>
        <input
          className="vt-compare-range"
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={at}
          onChange={(e) => setAt(Number(e.target.value))}
          aria-label={`${pair.beforeLabel} and ${pair.afterLabel}: slide to compare`}
        />
      </div>
      {pair.caption ? <figcaption className="vt-compare-cap">{pair.caption}</figcaption> : null}
    </figure>
  );
}

export default function Compare({ items }: { items: ComparePair[] }) {
  return (
    <div className="vt-compares">
      {items.map((pair) => (
        <Pair key={pair.id} pair={pair} />
      ))}
    </div>
  );
}
