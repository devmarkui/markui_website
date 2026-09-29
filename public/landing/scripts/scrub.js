// Scroll scrubbing. Writes a progress value --p (0–1) onto registered
// elements (or hands it to a callback) while an IntersectionObserver says
// they are near the viewport. Positions are measured once (and again on
// resize or when the page height changes), so a scroll frame reads nothing
// but scrollY: every "rect" handed to callbacks is derived from the cache.
// Runs on the shared ticker, at most once per frame.
//
// Modes (r = element rect, vh = viewport height):
//   exit     0 with its top at the top of the screen, 1 once it has gone
//   enter    0 as its top enters at the bottom, 1 when its top is 30% down
//   draw     0 with its top at 80% of the screen, 1 with its top at 25%
//   through  0 entering at the bottom, 1 leaving at the top
//
// Under prefers-reduced-motion nothing is scrubbed: every element is written
// once in its final, readable state.

import { once } from "./ticker.js";

const MODES = {
  exit: (r) => -r.top / Math.max(1, r.height),
  enter: (r, vh) => (vh - r.top) / (vh * 0.7),
  draw: (r, vh) => (vh * 0.8 - r.top) / (vh * 0.55),
  through: (r, vh) => (vh - r.top) / (vh + r.height),
};

const FINAL = { exit: 0, enter: 1, draw: 1, through: 0.5 };

const items = [];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let io = null;
let vh = window.innerHeight;

const clamp = (n) => Math.min(1, Math.max(0, n));

function measure() {
  vh = window.innerHeight;
  const sy = window.scrollY;
  items.forEach((it) => {
    const r = it.el.getBoundingClientRect();
    it.top = r.top + sy;
    it.height = r.height;
    it.dirty = true;
  });
}

function frame() {
  const sy = window.scrollY;
  for (const it of items) {
    if (!it.active) continue;
    const rect = { top: it.top - sy, height: it.height, bottom: it.top - sy + it.height };
    const p = clamp(MODES[it.mode](rect, vh));
    if (Math.abs(p - it.p) < 0.002 && !it.dirty) continue;
    it.p = p;
    it.dirty = false;
    if (it.css) it.el.style.setProperty("--p", p.toFixed(3));
    if (it.fn) it.fn(p, rect, vh);
  }
}

const request = () => once(frame);

export function addScrub(el, mode = "through", fn = null, { css = !fn } = {}) {
  if (!el) return;
  const item = { el, mode, fn, css, p: -1, active: false, dirty: true, top: 0, height: 0 };
  items.push(item);
  if (reduce || !io) {
    const p = FINAL[mode];
    if (css) el.style.setProperty("--p", String(p));
    if (fn) fn(p, el.getBoundingClientRect(), window.innerHeight, true);
    return;
  }
  const r = el.getBoundingClientRect();
  item.top = r.top + window.scrollY;
  item.height = r.height;
  io.observe(el);
}

export function initScrub() {
  if (!reduce && "IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const it = items.find((x) => x.el === entry.target);
          if (!it) continue;
          it.active = entry.isIntersecting;
          it.dirty = true;
        }
        request();
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    window.addEventListener("scroll", request, { passive: true });
    let timer = 0;
    const remeasure = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        measure();
        request();
      }, 160);
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("load", remeasure);
    if (document.fonts) document.fonts.ready.then(remeasure);
    if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);
  }
  document.querySelectorAll("[data-scrub]").forEach((el) => addScrub(el, el.dataset.scrub || "through"));
}
