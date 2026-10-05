// The cursor is the signal: an orange dot that follows the pointer exactly,
// with a ring that trails it on a spring. It reads what it is over:
//   links and buttons   the ring swells round them
//   project prints      the ring becomes a "View" disc (the print re-tunes)
//   the Noise faders    "Drag"
//   text fields         it steps aside for the native caret
// Buttons, CTAs and filter chips are magnetic: they lean towards the
// pointer and spring back when it leaves.
// Desktop mouse only (hover + fine pointer), never under reduced motion.
// The native cursor is hidden only while this one is actually running.

import { add, remove } from "./ticker.js";

const MAGNETS = ".btn-signal, .btn-line, .work-tuner-btn, .nav-cta, .footer-top-link, .contact-submit";
const HOVERS = "a, button, [role='slider'], label, .work-card";
const INK_GROUNDS = ".voices";

export function initCursor() {
  const ok = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!ok) return;
  const html = document.documentElement;
  const root = document.createElement("div");
  root.className = "cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<span class="cursor-ring"><span class="cursor-label"></span></span><span class="cursor-dot"></span>';
  document.body.appendChild(root);
  const ring = root.querySelector(".cursor-ring");
  const dot = root.querySelector(".cursor-dot");
  const label = root.querySelector(".cursor-label");

  let x = -100;
  let y = -100;
  let rx = -100;
  let ry = -100;
  let running = false;
  let mode = "";
  let magnet = null;
  let mx = 0;
  let my = 0;
  let seen = false;

  function setInk(el) {
    root.classList.toggle("is-ink", Boolean(el && el.closest(INK_GROUNDS)));
  }

  function setMode(next, text = "") {
    if (next === mode && label.textContent === text) return;
    mode = next;
    root.dataset.mode = next;
    label.textContent = text;
  }

  function frame() {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
    // The magnet leans towards the pointer; others spring home.
    if (magnet) {
      const r = magnet.rect;
      const tx = (x - (r.left + r.width / 2)) * 0.28;
      const ty = (y - (r.top + r.height / 2)) * 0.38;
      mx += (Math.max(-12, Math.min(12, tx)) - mx) * 0.25;
      my += (Math.max(-10, Math.min(10, ty)) - my) * 0.25;
      magnet.el.style.translate = `${mx.toFixed(2)}px ${my.toFixed(2)}px`;
    }
    const still = Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1 && !magnet;
    if (still) {
      running = false;
      remove(frame);
    }
  }
  function wake() {
    if (running) return;
    running = true;
    add(frame);
  }

  function release(el) {
    if (!el) return;
    el.style.transition = "translate 600ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.translate = "0px 0px";
    window.setTimeout(() => {
      if (!magnet || magnet.el !== el) el.style.transition = "";
    }, 620);
  }

  document.addEventListener(
    "pointermove",
    (e) => {
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
      const field = t && t.closest("input, textarea, select");
      const slider = t && t.closest("[role='slider']");
      const card = t && t.closest(".work-card");
      const hot = t && t.closest(HOVERS);
      if (field) setMode("text");
      else if (slider) setMode("drag", "Drag");
      else if (card) setMode("view", "View");
      else if (hot) setMode("hover");
      else setMode("");
      setInk(t);
      const m = t && t.closest(MAGNETS);
      if (m !== (magnet && magnet.el)) {
        if (magnet) release(magnet.el);
        magnet = m ? { el: m, rect: m.getBoundingClientRect() } : null;
        mx = my = 0;
        if (m) m.style.transition = "";
      }
      wake();
    },
    { passive: true },
  );
  document.addEventListener("pointerdown", () => root.classList.add("is-down"));
  document.addEventListener("pointerup", () => root.classList.remove("is-down"));
  document.documentElement.addEventListener("pointerleave", () => {
    root.classList.add("is-out");
    if (magnet) release(magnet.el);
    magnet = null;
  });
  document.documentElement.addEventListener("pointerenter", () => root.classList.remove("is-out"));
  window.addEventListener(
    "scroll",
    () => {
      if (magnet) magnet.rect = magnet.el.getBoundingClientRect();
      // Scrolling moves the page under a still pointer: no pointermove fires.
      if (seen) setInk(document.elementFromPoint(x, y));
    },
    { passive: true },
  );
}
