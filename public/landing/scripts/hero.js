// Hero orchestration.
// - Builds the ring field (hero-field.js) and the headline (hero-type.js).
// - The Noise fader and the headline are one instrument: every desk change
//   sets the ring turbulence and moves the weight between the two lines
//   (noise side: "Design the Future." bold; clean side: "Define the
//   Experience." bold).
// - Entrance, overlapped with the intro's exit:
//     markui:intro-go  (the intro's words fall away, its dot takes off)
//       → eyebrow decodes, copy, CTAs, desk and fader rise; the headline's
//         letters spring up one by one
//     enter()          (the dot lands and becomes the disc)
//       → shockwave, rings come up, then the fader slides itself down from
//         the intro's noise to REST: the weight moves, on its own, from
//         "Design the Future." to "Define the Experience.".
// - Hands its parts to the signal (scripts/signal.js), which owns the disc
//   from then on: scroll shrinks it into the travelling dot.

import { add, remove } from "./ticker.js";
import { createField } from "./hero-field.js";
import { createType } from "./hero-type.js";
import { createFader } from "./hero-fader.js";
import { desk, REST } from "./desk.js";
import { decode } from "./decode.js";
import { easeInOut3 } from "./particles.js";

const SLIDE_MS = 1500;

// Noise 0–1 → how far the weight has moved onto "Design the Future." (a
// short dead zone at each end, so both extremes are exact).
const swapOf = (v) => Math.min(1, Math.max(0, (v - 0.1) / 0.75));

export function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return null;
  const html = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const mqDesktop = window.matchMedia("(min-width: 1100px)");
  const stage = hero.querySelector("[data-hero-stage]");
  const disc = hero.querySelector("[data-hero-disc]");
  const title = hero.querySelector("[data-hero-title]");
  const faderRoot = hero.querySelector("[data-fader]");
  const track = faderRoot.querySelector("[data-fader-track]");

  const field = createField(hero.querySelector("[data-hero-field]"), { reduce });
  const type = createType(title, { reduce, fine });

  // Fader <-> desk. Vertical on desktop, horizontal below 1100px.
  const orient = () => track.setAttribute("aria-orientation", mqDesktop.matches ? "vertical" : "horizontal");
  orient();
  mqDesktop.addEventListener("change", orient);
  let slide = null;
  const fader = createFader(faderRoot, { initial: desk.get(), onInput: (v, source) => desk.set(v, source) });
  desk.subscribe((v, source) => {
    if (source !== "auto" && slide) cancelSlide();
    fader.sync(v);
    field.setNoise(v);
    type.setSwap(swapOf(v));
  });
  field.setNoise(desk.get());
  type.setSwap(swapOf(desk.get()));

  // The fader slides itself down: the studio turns the noise down for you.
  function autoSlide() {
    if (slide || reduce) return;
    const from = desk.get();
    if (Math.abs(from - REST) < 0.01) return;
    const t0 = performance.now();
    faderRoot.classList.add("is-auto");
    slide = (now) => {
      const u = Math.min(1, (now - t0) / SLIDE_MS);
      desk.set(from + (REST - from) * easeInOut3(u), "auto");
      if (u >= 1) cancelSlide();
    };
    add(slide);
  }
  function cancelSlide() {
    if (!slide) return;
    remove(slide);
    slide = null;
    faderRoot.classList.remove("is-auto");
    type.measure();
  }

  // The rings bend around the cursor.
  if (fine && !reduce) {
    stage.addEventListener("pointermove", (event) => {
      const r = stage.getBoundingClientRect();
      field.setPointer(event.clientX - r.left, event.clientY - r.top);
    });
    stage.addEventListener("pointerleave", () => field.clearPointer());
  }

  // Only animate while the stage is on screen.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      field.setVisible(entry.isIntersecting);
      type.setVisible(entry.isIntersecting);
    }).observe(stage);
  }

  const size = () => {
    field.resize();
    type.measure();
  };
  size();
  let timer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(size, 150);
  });
  if (document.fonts) document.fonts.ready.then(size);

  let went = false;
  function go() {
    if (went) return;
    went = true;
    html.classList.add("hero-go");
    decode([...hero.querySelectorAll("[data-decode]")], { stagger: 140, rate: 22 });
    window.setTimeout(() => html.classList.add("hero-type-in"), 160);
  }
  document.addEventListener("markui:intro-go", go);

  let entered = false;
  function enter({ flown } = {}) {
    if (entered) return;
    entered = true;
    go();
    html.classList.add("hero-in", "hero-type-in");
    if (reduce) {
      field.show();
      return;
    }
    if (flown) field.enter();
    else field.show();
    type.enter();
    document.dispatchEvent(new CustomEvent("markui:hero-in"));
    window.setTimeout(autoSlide, flown ? 180 : 60);
    window.setTimeout(() => html.classList.add("hero-settled"), 1800);
  }

  if (reduce || !html.classList.contains("has-loader")) {
    field.show();
    type.show();
    html.classList.add("hero-go", "hero-in", "hero-type-in", "hero-settled");
  }

  return { hero, stage, disc, title, field, type, enter };
}
