// Scroll scrubbing. One passive scroll listener, coalesced to one update per
// frame, writes a progress value --p (0–1) onto registered elements, but only
// while an IntersectionObserver says they are near the viewport. Reads for
// every element happen before any writes, so a frame never thrashes layout.
//
// Modes (r = element rect, vh = viewport height):
//   exit     0 with its top at the top of the screen, 1 once it has gone
//   enter    0 as its top enters at the bottom, 1 when its top is 30% down
//   draw     0 with its top at 80% of the screen, 1 with its top at 25%
//   through  0 entering at the bottom, 1 leaving at the top
//
// Under prefers-reduced-motion nothing is scrubbed: every element is written
// once in its final, readable state.

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
let queued = false;

const clamp = (n) => Math.min(1, Math.max(0, n));

function frame() {
  queued = false;
  const vh = window.innerHeight;
  const live = items.filter((it) => it.active);
  const rects = live.map((it) => it.el.getBoundingClientRect());
  live.forEach((it, i) => {
    const p = clamp(MODES[it.mode](rects[i], vh));
    if (Math.abs(p - it.p) < 0.002 && !it.dirty) return;
    it.p = p;
    it.dirty = false;
    if (it.css) it.el.style.setProperty("--p", p.toFixed(3));
    if (it.fn) it.fn(p, rects[i], vh);
  });
}

function request() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(frame);
}

export function addScrub(el, mode = "through", fn = null, { css = !fn } = {}) {
  if (!el) return;
  const item = { el, mode, fn, css, p: -1, active: false, dirty: true };
  items.push(item);
  if (reduce || !io) {
    const p = FINAL[mode];
    if (css) el.style.setProperty("--p", String(p));
    if (fn) fn(p, el.getBoundingClientRect(), window.innerHeight, true);
    return;
  }
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
    window.addEventListener("resize", () => {
      items.forEach((it) => (it.dirty = true));
      request();
    });
  }
  document.querySelectorAll("[data-scrub]").forEach((el) => addScrub(el, el.dataset.scrub || "through"));
}
