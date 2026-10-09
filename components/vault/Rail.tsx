"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A row that runs past the edges of the page: scroll it, drag it with the
 * mouse, or use the arrows. Reels, social feeds, filmstrips and carousels
 * all sit in one.
 */
export default function Rail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  // Set when a drag ends, so the click that follows doesn't open what's under it.
  const dragged = useRef(false);
  const [ends, setEnds] = useState({ start: true, end: false });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () =>
      setEnds({
        start: node.scrollLeft < 8,
        end: node.scrollLeft + node.clientWidth > node.scrollWidth - 8,
      });
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const by = (direction: number) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={className ? `vt-rail-wrap ${className}` : "vt-rail-wrap"}>
      <div
        ref={ref}
        className="vt-rail"
        role="region"
        aria-label={label}
        tabIndex={0}
        data-cursor="Drag"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("iframe, button, a, video")) return;
          drag.current = { x: e.clientX, left: ref.current!.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          ref.current!.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => {
          dragged.current = Boolean(drag.current?.moved);
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
            dragged.current = false;
          }
        }}
      >
        {children}
      </div>
      <div className="wrap vt-rail-nav">
        <button type="button" className="vt-rail-btn" onClick={() => by(-1)} disabled={ends.start} aria-label="Scroll back">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" className="vt-rail-btn" onClick={() => by(1)} disabled={ends.end} aria-label="Scroll on">
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
