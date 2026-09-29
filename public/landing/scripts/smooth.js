// Smooth scroll, Lenis-style, over NATIVE scroll: wheel input sets a target
// and the page eases towards it (window.scrollTo every frame). The document
// still scrolls natively, so the scrollbar, keyboard, anchors, find-in-page,
// sticky elements and every scroll listener keep working; any scroll we did
// not make (keys, scrollbar drag, anchors, programmatic) simply takes over.
// Desktop mouse/trackpad only: off on touch screens and under reduced motion.
//
// Also the page's scroll velocity (px per frame, eased), for the
// scroll-reactive effects (scroll-fx.js), on every device.
//
//   scroll.velocity   signed, eased
//   scroll.onFrame(fn) fn(velocity) every frame while anything is moving

import { add, remove } from "./ticker.js";

const EASE = 0.12;
const listeners = new Set();
export const scroll = {
  velocity: 0,
  smooth: false,
  onFrame(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Can this element (or an ancestor below <body>) scroll itself this way?
function scrollsItself(el, dy) {
  for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    if (!(n instanceof HTMLElement)) continue;
    const oy = getComputedStyle(n).overflowY;
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) {
      if (dy > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
      if (dy < 0 && n.scrollTop > 0) return true;
    }
  }
  return false;
}

export function initSmooth() {
  const html = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const smooth = !reduce && fine;
  scroll.smooth = smooth;

  let target = window.scrollY;
  let current = window.scrollY;
  let written = -1;
  let easing = false;
  let lastY = window.scrollY;
  let running = false;
  let lastT = 0;
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

  // One job: eases the wheel target (desktop) and measures velocity (all).
  function frame(now) {
    const dt = lastT ? Math.min(48, now - lastT) : 16.7;
    lastT = now;
    if (easing) {
      const k = 1 - (1 - EASE) ** (dt / 16.7);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        easing = false;
      }
      written = Math.round(current);
      window.scrollTo({ top: current, behavior: "instant" });
    }
    const y = easing ? current : window.scrollY;
    const v = (y - lastY) * (16.7 / dt);
    lastY = y;
    scroll.velocity += (v - scroll.velocity) * 0.25;
    if (Math.abs(scroll.velocity) < 0.02) scroll.velocity = 0;
    listeners.forEach((fn) => fn(scroll.velocity));
    if (!easing && scroll.velocity === 0) {
      running = false;
      lastT = 0;
      remove(frame);
    }
  }
  function start() {
    if (running) return;
    running = true;
    add(frame);
  }

  window.addEventListener(
    "scroll",
    () => {
      // A scroll we did not write (keys, scrollbar, anchor, find, a script):
      // follow it instead of fighting it.
      if (!easing || Math.abs(window.scrollY - written) > 2) {
        if (easing) easing = false;
        target = current = window.scrollY;
      }
      start();
    },
    { passive: true },
  );

  if (!smooth) return;
  html.classList.add("is-smooth");
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.defaultPrevented || document.body.classList.contains("is-locked")) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.target instanceof Element && scrollsItself(e.target, e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? window.innerHeight : 1;
      if (!easing) target = current = window.scrollY;
      target = Math.max(0, Math.min(maxScroll(), target + e.deltaY * unit));
      easing = true;
      start();
    },
    { passive: false },
  );
}
