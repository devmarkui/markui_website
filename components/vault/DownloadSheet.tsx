"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Picture } from "@/lib/vault/media-urls";

import { startDownload, type DownloadTarget } from "./download";

/** An arrow into a tray. */
export function DownloadIcon() {
  return (
    <svg className="vt-dl-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 1.5v9M4 7l4 4 4-4M2 12.5v2h12v-2" />
    </svg>
  );
}

/**
 * Picks photos out of a gallery to download: tap to pick, shift-click for a
 * run, a chapter's chip for the whole chapter, Ctrl/⌘+A for everything. One
 * photo comes as it is, more as a zip. Stays mounted while closed, so the
 * picks survive closing it.
 */
export default function DownloadSheet({
  open,
  onClose,
  pictures,
  chapters,
  target,
  title,
}: {
  open: boolean;
  onClose: () => void;
  /** The gallery's photos (no videos), in page order. */
  pictures: Picture[];
  chapters: string[];
  target: DownloadTarget;
  title: string;
}) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [note, setNote] = useState("");
  const anchor = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const count = pictures.length;
  const chosen = useMemo(() => pictures.filter((p) => picked.has(p.key)), [pictures, picked]);
  const byChapter = useMemo(
    () => chapters.map((name) => ({ name, keys: pictures.filter((p) => p.chapter === name).map((p) => p.key) })),
    [chapters, pictures],
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
      else if (e.key.toLowerCase() === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setPicked(new Set(pictures.map((p) => p.key)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose, pictures]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 7000);
    return () => window.clearTimeout(timer);
  }, [note]);

  if (!open || typeof document === "undefined") return null;

  const toggle = (index: number, range: boolean) => {
    const key = pictures[index].key;
    const on = !picked.has(key);
    const next = new Set(picked);
    // Shift-click: everything from the last photo picked to this one takes this one's new state.
    const from = range && anchor.current !== null ? Math.min(anchor.current, index) : index;
    const to = range && anchor.current !== null ? Math.max(anchor.current, index) : index;
    for (let i = from; i <= to; i++) {
      if (on) next.add(pictures[i].key);
      else next.delete(pictures[i].key);
    }
    anchor.current = index;
    setPicked(next);
  };

  const toggleChapter = (keys: string[]) => {
    const all = keys.every((k) => picked.has(k));
    const next = new Set(picked);
    for (const k of keys) {
      if (all) next.delete(k);
      else next.add(k);
    }
    setPicked(next);
  };

  const download = (which: "all" | "picked") => {
    const n = which === "all" ? count : chosen.length;
    if (!n) return;
    startDownload(target, which === "all" ? "all" : chosen.map((p) => p.key));
    setNote(n === 1 ? "Your download is starting." : `Packing ${n} photos into a zip. It will show in your browser's downloads.`);
  };

  return createPortal(
    <div className="vt-dl sx" role="dialog" aria-modal="true" aria-label={`Download photos from ${title}`}>
      <div className="vt-dl-head">
        <div className="vt-dl-heading">
          <span className="mono vt-dl-kicker">Download</span>
          <h2 className="vt-dl-title">{title}</h2>
          <p className="vt-dl-hint">Tap the photos you want, or pick them all. Shift-click picks a run. More than one comes as a .zip.</p>
        </div>
        <button ref={closeRef} type="button" className="vt-lightbox-close" onClick={onClose} aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="vt-dl-tools">
        <button
          type="button"
          className="vt-dl-chip"
          onClick={() => setPicked(new Set(pictures.map((p) => p.key)))}
          disabled={chosen.length === count}
        >
          Select all <span className="mono">{count}</span>
        </button>
        <button type="button" className="vt-dl-chip" onClick={() => setPicked(new Set())} disabled={!chosen.length}>
          Clear
        </button>
        {byChapter.length > 1 ? <span className="vt-dl-rule" aria-hidden="true" /> : null}
        {byChapter.length > 1
          ? byChapter.map(({ name, keys }) => (
              <button
                key={name}
                type="button"
                className="vt-dl-chip"
                aria-pressed={keys.length > 0 && keys.every((k) => picked.has(k))}
                onClick={() => toggleChapter(keys)}
              >
                {name} <span className="mono">{keys.length}</span>
              </button>
            ))
          : null}
      </div>

      <div className="vt-dl-grid" aria-label="Photos">
        {pictures.map((p, i) => {
          const on = picked.has(p.key);
          return (
            <button
              key={p.key}
              type="button"
              role="checkbox"
              aria-checked={on}
              aria-label={p.caption ? `Photo ${i + 1}: ${p.caption}` : `Photo ${i + 1}`}
              className="vt-dl-item"
              onClick={(e) => toggle(i, e.shiftKey)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} srcSet={p.srcSet} sizes="200px" alt="" loading="lazy" decoding="async" />
              <span className="vt-dl-check" aria-hidden="true" />
              <span className="mono vt-dl-num" aria-hidden="true">
                {String(i + 1).padStart(3, "0")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="vt-dl-foot">
        <p className="vt-dl-status" role="status">
          {note || (
            <>
              <span className="mono">{String(chosen.length).padStart(2, "0")}</span> of {count} picked
            </>
          )}
        </p>
        <button type="button" className="btn-line vt-dl-all" onClick={() => download("all")}>
          Download all ({count})
        </button>
        <button type="button" className="btn-signal" onClick={() => download("picked")} disabled={!chosen.length}>
          {chosen.length > 1 ? `Download ${chosen.length} as .zip` : "Download"}
          <DownloadIcon />
        </button>
      </div>
    </div>,
    document.body,
  );
}
