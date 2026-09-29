// The desk: one page-wide Noise value (0–1) shared by both faders.
// - Publishes it to :root as --noise (grain, hairlines, turned-down type all
//   read it). Publishing is coalesced to ~11 times a second during the intro
//   tween so the whole document isn't restyled every frame; user input
//   publishes immediately.
// - Toggles .is-noisy above 30% (grain crawls, loud headings jitter).
// - Docks a small horizontal copy of the fader in the nav once the hero
//   fader has scrolled out of view.

import { createFader } from "./hero-fader.js";

const root = document.documentElement;
const listeners = new Set();
let value = 0.08;
let published = -1;
let lastPublish = 0;
let pending = false;

function publish(force) {
  const now = performance.now();
  if (!force && now - lastPublish < 90) {
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        publish(false);
      });
    }
    return;
  }
  lastPublish = now;
  if (Math.abs(value - published) < 0.001) return;
  published = value;
  root.style.setProperty("--noise", value.toFixed(3));
  root.classList.toggle("is-noisy", value > 0.3);
}

export const desk = {
  get: () => value,
  set(next, source = "program") {
    value = Math.min(1, Math.max(0, next));
    listeners.forEach((fn) => fn(value, source));
    publish(source === "user");
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function initDesk() {
  const mini = document.querySelector("[data-nav-desk]");
  const heroFader = document.querySelector("[data-fader]");
  if (!mini) return;

  const fader = createFader(mini, {
    initial: value,
    onInput: (v, source) => desk.set(v, source),
  });
  desk.subscribe((v, source) => {
    if (source !== "mini") fader.sync(v);
  });

  if (heroFader && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      root.classList.toggle("is-past-hero", past);
    }).observe(heroFader);
  } else {
    root.classList.add("is-past-hero");
  }
}
