// The desk: one page-wide Noise value (0–1) shared by both faders.
// Noise is an EFFECT, never a filter on content: it does not touch the
// opacity, blur, colour or weight of text, images, buttons or the nav. It
// is published only to the effect layers:
//   - the grain, which sits BEHIND section content ([data-grain])
//   - the signal trace's shimmer ([data-signal])
//   - the particle engine: dust, static jitter (engine.setNoise)
//   - html.is-noisy above 30% (grain and trace crawl)
// hero.js adds the ring turbulence and "Design the Future." (weight, size).
// The small fader docked in the nav mirrors the hero's, both ways.

import { createFader } from "./hero-fader.js";
import { engine } from "./particles.js";

const root = document.documentElement;
export const REST = 0.05;
const listeners = new Set();
// With the intro the page starts noisy; the hero fader then slides itself
// down (hero.js). Without it (reduced motion, no intro) it starts clean.
let value = root.classList.contains("has-loader") ? 0.78 : REST;
let targets = [];

function publish() {
  const v = value.toFixed(3);
  targets.forEach((el) => el.style.setProperty("--noise", v));
  root.classList.toggle("is-noisy", value > 0.3);
  engine.setNoise(value);
}

export const desk = {
  get: () => value,
  set(next, source = "program") {
    value = Math.min(1, Math.max(0, next));
    listeners.forEach((fn) => fn(value, source));
    publish();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function initDesk() {
  // One grain layer per ground, behind that ground's content.
  const tpl = document.querySelector("[data-grain]");
  if (tpl) {
    document.querySelectorAll("main > section, .footer").forEach((ground) => {
      const g = tpl.cloneNode(false);
      ground.prepend(g);
    });
    tpl.remove();
  }
  targets = [...document.querySelectorAll("[data-grain], [data-signal]")];
  publish();
  const mini = document.querySelector("[data-nav-desk]");
  const heroFader = document.querySelector("[data-fader]");
  if (!mini) return;

  const fader = createFader(mini, { initial: value, onInput: (v) => desk.set(v, "mini") });
  // Every change, from either fader or the auto-slide, lands on both.
  desk.subscribe((v) => fader.sync(v));

  if (heroFader && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      root.classList.toggle("is-past-hero", past);
      fader.sync(value);
    }).observe(heroFader);
  } else {
    root.classList.add("is-past-hero");
  }
}
