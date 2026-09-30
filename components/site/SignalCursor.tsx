"use client";

import { useEffect } from "react";

// The homepage's cursor (public/landing/scripts/cursor.js) for the React
// pages. The cursor is the signal: an orange dot that follows the pointer
// exactly, with a ring that trails it on a spring. It reads what it is over:
//   links and buttons   the ring swells round them
//   [data-cursor]       the ring becomes a disc with that word ("View")
//   text fields         it steps aside for the native caret
// Buttons are magnetic: they lean towards the pointer and spring back.
// Desktop mouse only, never under reduced motion; the native cursor is
// hidden only while this one is actually running.

const MAGNETS = ".btn-signal, .btn-line, .tuner-btn, .footer-top-link";
const HOVERS = "a, button, label, summary, [role='slider']";

export default function SignalCursor() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || still) return;

    const html = document.documentElement;
    const root = document.createElement("div");
    root.className = "cursor";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<span class="cursor-ring"><span class="cursor-label"></span></span><span class="cursor-dot"></span>';
    document.body.appendChild(root);
    const ring = root.querySelector<HTMLElement>(".cursor-ring")!;
    const dot = root.querySelector<HTMLElement>(".cursor-dot")!;
    const label = root.querySelector<HTMLElement>(".cursor-label")!;

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let mode = "";
    let seen = false;
    let magnet: { el: HTMLElement; rect: DOMRect } | null = null;
    let mx = 0;
    let my = 0;

    const setMode = (next: string, text = "") => {
      if (next === mode && label.textContent === text) return;
      mode = next;
      root.dataset.mode = next;
      label.textContent = text;
    };

    const frame = () => {
      raf = 0;
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
      if (magnet) {
        const r = magnet.rect;
        const tx = (x - (r.left + r.width / 2)) * 0.28;
        const ty = (y - (r.top + r.height / 2)) * 0.38;
        mx += (Math.max(-12, Math.min(12, tx)) - mx) * 0.25;
        my += (Math.max(-10, Math.min(10, ty)) - my) * 0.25;
        magnet.el.style.translate = `${mx.toFixed(2)}px ${my.toFixed(2)}px`;
      }
      const settled = Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1 && !magnet;
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const release = (el: HTMLElement) => {
      el.style.transition = "translate 600ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.translate = "0px 0px";
      window.setTimeout(() => {
        if (!magnet || magnet.el !== el) el.style.transition = "";
      }, 620);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
        html.classList.add("has-cursor");
      }
      const t = e.target instanceof Element ? e.target : null;
      const view = t?.closest<HTMLElement>("[data-cursor]");
      if (t?.closest("input, textarea, select")) setMode("text");
      else if (view) setMode("view", view.dataset.cursor);
      else if (t?.closest(HOVERS)) setMode("hover");
      else setMode("");

      const m = t?.closest<HTMLElement>(MAGNETS) ?? null;
      if (m !== (magnet?.el ?? null)) {
        if (magnet) release(magnet.el);
        magnet = m ? { el: m, rect: m.getBoundingClientRect() } : null;
        mx = 0;
        my = 0;
        if (m) m.style.transition = "";
      }
      wake();
    };
    const onDown = () => root.classList.add("is-down");
    const onUp = () => root.classList.remove("is-down");
    const onLeave = () => {
      root.classList.add("is-out");
      if (magnet) release(magnet.el);
      magnet = null;
    };
    const onEnter = () => root.classList.remove("is-out");
    const onScroll = () => {
      if (magnet) magnet.rect = magnet.el.getBoundingClientRect();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    html.addEventListener("pointerleave", onLeave);
    html.addEventListener("pointerenter", onEnter);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      html.removeEventListener("pointerleave", onLeave);
      html.removeEventListener("pointerenter", onEnter);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      if (magnet) magnet.el.style.translate = "";
      html.classList.remove("has-cursor");
      root.remove();
    };
  }, []);

  return null;
}
