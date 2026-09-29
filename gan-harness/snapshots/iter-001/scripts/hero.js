// Hero orchestration: noise level (--v) drives the noise field, the
// jittering "Less Noise" line, the weight swap between the two headline lines
// and the orange disc. On load the page turns its own noise down from 100 to 8.

import { createNoise } from "./hero-noise.js";
import { createFader } from "./hero-fader.js";

const REST = 0.08;
const FPS = 24;

const easeInOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

function splitChars(line) {
  const chars = [];
  line.querySelectorAll(".hero-word").forEach((word) => {
    const text = word.textContent;
    word.textContent = "";
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "hero-char";
      span.textContent = ch;
      word.appendChild(span);
      chars.push(span);
    }
  });
  return chars;
}

export function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = hero.querySelector("[data-hero-noise]");
  const disc = hero.querySelector("[data-hero-disc]");
  const quiet = hero.querySelector("[data-hero-quiet]");
  const chars = splitChars(quiet);
  const noise = createNoise(canvas, { scale: window.innerWidth < 768 ? 2 : 2 });

  let level = reduce ? REST : 1;
  let pointer = null;
  let visible = true;
  let running = false;
  let last = 0;
  let lastJitter = 0;
  let jittered = false;
  let tween = null;

  const applyLevel = (v) => {
    level = v;
    hero.style.setProperty("--v", v.toFixed(3));
    if (!running) paint(performance.now(), true);
  };

  const fader = createFader(hero.querySelector("[data-fader]"), {
    initial: level,
    onInput(v, source) {
      if (source === "user" && tween) {
        cancelAnimationFrame(tween);
        tween = null;
        hero.classList.add("is-ready");
      }
      applyLevel(v);
    },
  });

  function holes() {
    const list = [];
    const heroRect = hero.getBoundingClientRect();
    const d = disc.getBoundingClientRect();
    if (d.width > 0) {
      list.push({
        x: d.left - heroRect.left + d.width / 2,
        y: d.top - heroRect.top + d.height / 2,
        r: (d.width / 2) * 1.02,
        hard: true,
      });
    }
    if (pointer) list.push({ x: pointer.x, y: pointer.y, r: 220 });
    return list;
  }

  function jitter(now) {
    const amp = Math.max(0, level - 0.12) * 0.16;
    if (amp <= 0) {
      if (jittered) {
        chars.forEach((c) => {
          c.style.removeProperty("--jx");
          c.style.removeProperty("--jy");
        });
        jittered = false;
      }
      return;
    }
    if (now - lastJitter < 70) return;
    lastJitter = now;
    jittered = true;
    chars.forEach((c) => {
      const on = Math.random() < 0.7;
      c.style.setProperty("--jx", on ? `${((Math.random() - 0.5) * 2 * amp).toFixed(3)}em` : "0em");
      c.style.setProperty("--jy", on ? `${((Math.random() - 0.5) * amp).toFixed(3)}em` : "0em");
    });
  }

  function paint(now, force = false) {
    const fps = level > 0.15 || pointer ? FPS : 12;
    if (!force && now - last < 1000 / fps) return;
    last = now;
    noise.setHoles(holes());
    noise.draw();
    if (!reduce) jitter(now);
  }

  function loop(now) {
    if (!running) return;
    paint(now);
    requestAnimationFrame(loop);
  }

  function setRunning(next) {
    const should = next && !reduce && visible && !document.hidden;
    if (should === running) return;
    running = should;
    if (running) requestAnimationFrame(loop);
  }

  function intro() {
    const start = performance.now() + 180;
    const duration = 1500;
    let revealed = false;
    const step = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      fader.set(1 - (1 - REST) * easeInOut(t), "program");
      if (!revealed && t > 0.4) {
        revealed = true;
        hero.classList.add("is-ready");
      }
      if (t < 1) tween = requestAnimationFrame(step);
      else tween = null;
    };
    tween = requestAnimationFrame(step);
  }

  // Sizing
  noise.resize();
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (noise.resize() || reduce) paint(performance.now(), true);
    }, 150);
  });

  // Pointer quiet zone (fine pointers only)
  if (window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (event) => {
      const r = hero.getBoundingClientRect();
      pointer = { x: event.clientX - r.left, y: event.clientY - r.top };
    });
    hero.addEventListener("pointerleave", () => {
      pointer = null;
    });
  }

  // Only animate while the hero is on screen
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    setRunning(true);
  }).observe(hero);
  document.addEventListener("visibilitychange", () => setRunning(true));

  applyLevel(level);
  document.documentElement.classList.remove("intro");

  if (reduce) {
    hero.classList.add("is-ready");
    paint(performance.now(), true);
    return;
  }

  setRunning(true);
  const display = document.fonts ? document.fonts.load("600 1em \"Clash Display\"") : Promise.resolve();
  Promise.race([display, new Promise((r) => setTimeout(r, 600))]).then(intro, intro);
}
