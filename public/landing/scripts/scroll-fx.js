// Scroll-reactive effects. Nothing here reads layout while scrolling:
// positions are measured on setup, resize and re-hang; frames read scrollY.
//
// - Lean: when the page moves fast the prints and the loudest display type
//   lean into the motion (skewY, a few degrees) and settle when it stops.
// - Depth: each print's photo drifts inside its frame (parallax).
// - Grounds: the paper wall, the orange reviews and the bone process open
//   out of the carbon like a lit panel widening to full bleed (clip-path),
//   scrubbed by scroll, so the page never hard-cuts between grounds.
// Off under reduced motion (everything sits in its final state).

import { scroll } from "./smooth.js";

const clamp = (n, a, b) => (n < a ? a : n > b ? b : n);
const smoothstep = (t) => t * t * (3 - 2 * t);

export function initScrollFx() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const html = document.documentElement;
  const leaners = [...document.querySelectorAll(".work-frame, .proof-lead-value, .process-big, .voices-item-xxl .voices-text")];
  const frames = [...document.querySelectorAll(".work-frame")].map((f) => ({ el: f, img: f.querySelector("img"), top: 0, h: 0 }));
  const grounds = [...document.querySelectorAll(".work, .voices, .process")].map((el) => ({ el, top: 0, last: "" }));
  const shown = new Set();
  let vh = window.innerHeight;
  let vw = window.innerWidth;

  function measure() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    const sy = window.scrollY;
    frames.forEach((f) => {
      const r = f.el.getBoundingClientRect();
      f.top = r.top + sy;
      f.h = r.height;
    });
    grounds.forEach((g) => {
      g.top = g.el.getBoundingClientRect().top + sy;
    });
    update(scroll.velocity, true);
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? shown.add(e.target) : shown.delete(e.target))),
      { rootMargin: "10% 0px 10% 0px" },
    );
    leaners.forEach((el) => io.observe(el));
  }

  let lean = 0;
  let moving = false;
  function update(v, force = false) {
    const sy = window.scrollY;
    // Lean.
    const next = Math.round(clamp(v * 0.07, -4.5, 4.5) * 20) / 20;
    if (next !== lean || force) {
      lean = next;
      const t = lean ? `skewY(${lean}deg)` : "";
      shown.forEach((el) => (el.style.transform = t));
    }
    const isMoving = Math.abs(v) > 0.5;
    if (isMoving !== moving) {
      moving = isMoving;
      html.classList.toggle("is-scrolling", moving);
    }
    // Depth: photos drift against the scroll inside their frames, within the
    // 5% they are scaled past them (styles/fx.css).
    for (const f of frames) {
      if (!f.img || f.top - sy > vh * 1.1 || f.top + f.h - sy < -vh * 0.1) continue;
      const off = (f.top + f.h / 2 - (sy + vh / 2)) * -0.04;
      f.img.style.translate = `0 ${clamp(off, -f.h * 0.024, f.h * 0.024).toFixed(1)}px`;
    }
    // Grounds open from an inset panel to full bleed.
    for (const g of grounds) {
      const top = g.top - sy;
      const p = smoothstep(clamp((vh - top) / (vh * 0.62), 0, 1));
      let clip = "";
      if (p < 1 && top < vh + 40) {
        const side = ((1 - p) * Math.min(90, vw * 0.06)).toFixed(1);
        const r = ((1 - p) * 40).toFixed(1);
        clip = `inset(0 ${side}px 0 ${side}px round ${r}px ${r}px 0 0)`;
      }
      if (clip !== g.last) {
        g.last = clip;
        g.el.style.clipPath = clip;
      }
    }
  }

  scroll.onFrame((v) => update(v));
  measure();
  let timer = 0;
  const later = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(measure, 180);
  };
  window.addEventListener("resize", later);
  window.addEventListener("load", later);
  document.addEventListener("work:rehung", later);
  if (document.fonts) document.fonts.ready.then(later);
  if ("ResizeObserver" in window) {
    let lastH = document.documentElement.scrollHeight;
    new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) > 1) {
        lastH = h;
        later();
      }
    }).observe(document.body);
  }
}
