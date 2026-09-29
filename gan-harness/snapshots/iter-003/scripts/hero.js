// Hero orchestration.
// - Builds the ring field (hero-field.js) and the headline (hero-type.js).
// - Wires the Noise fader to the desk: its level drives ring turbulence and,
//   through --noise, the page grain.
// - Runs the entrance when the loader's dot lands on the disc: a shockwave,
//   the rings come up, the eyebrow decodes out of static, the headline
//   settles (quiet line down, loud line up), then copy, desk and cue.
// - Hands its parts to the signal (scripts/signal.js), which owns the disc
//   from then on: scroll shrinks it into the travelling dot.

import { add, remove } from "./ticker.js";
import { createField } from "./hero-field.js";
import { createType } from "./hero-type.js";
import { createFader } from "./hero-fader.js";
import { desk } from "./desk.js";

const GLYPHS = "▚▞▘▗/\\|+=<>01#%*";

function decode(nodes) {
  const items = nodes.map((node) => ({ node, text: node.textContent }));
  const start = performance.now();
  const step = (now) => {
    let done = true;
    items.forEach(({ node, text }, k) => {
      const t = now - start - k * 180;
      const settled = Math.floor(Math.max(0, t) / 26);
      let out = "";
      for (let i = 0; i < text.length; i += 1) {
        if (i < settled || text[i] === " ") out += text[i];
        else {
          out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          done = false;
        }
      }
      if (node.textContent !== out) node.textContent = out;
    });
    if (done) remove(step);
  };
  add(step);
}

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
  const fader = createFader(faderRoot, { initial: desk.get(), onInput: (v, source) => desk.set(v, source) });
  desk.subscribe((v) => {
    fader.sync(v);
    field.setNoise(v);
  });
  field.setNoise(desk.get());

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

  let entered = false;
  function enter({ flown } = {}) {
    if (entered) return;
    entered = true;
    html.classList.add("hero-in");
    if (reduce) {
      field.show();
      return;
    }
    if (flown) field.enter();
    else field.show();
    type.enter();
    decode([...hero.querySelectorAll("[data-decode]")]);
    document.dispatchEvent(new CustomEvent("markui:hero-in"));
    window.setTimeout(() => html.classList.add("hero-settled"), 2600);
  }

  if (reduce || !html.classList.contains("has-loader")) {
    field.show();
    type.show();
    html.classList.add("hero-in");
  }

  return { hero, stage, disc, title, field, type, enter };
}
