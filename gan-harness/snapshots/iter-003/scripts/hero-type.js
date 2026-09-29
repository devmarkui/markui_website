// Hero type: the headline is a volume control.
// - Each character carries its live weight in --w. "Design the Future." rests
//   at 200 (turned down), "Define the Experience." at 600 (turned up).
// - The cursor turns up the letters near it (the quiet line swells towards
//   580, the loud line to 700). On touch screens, and after a few seconds
//   without the mouse, a weight wave sweeps across the headline instead.
// - Entrance: the quiet line settles down from loud, the loud line rises.
// - A clipped ink duplicate sits on top (an aria-hidden sibling of the h1);
//   signal.js sets its circle (--cx, --cy, --cr) to the disc, so the type
//   turns ink where it crosses it.

import { add, remove } from "./ticker.js";

const BASE = [200, 600];
const RANGE = [380, 100];
const ENTER_FROM = [620, 200];

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function createType(title, { reduce = false, fine = false } = {}) {
  const lines = title.querySelector(".hero-lines");
  const chars = [];
  let index = 0;
  lines.querySelectorAll(".hero-line").forEach((line, li) => {
    line.querySelectorAll(".hero-seg").forEach((seg) => {
      const words = seg.textContent.trim().split(/\s+/);
      seg.textContent = "";
      words.forEach((word, wi) => {
        const wrap = document.createElement("span");
        wrap.className = "hero-word";
        for (const ch of word) {
          const span = document.createElement("span");
          span.className = "hero-char";
          span.textContent = ch;
          span.style.setProperty("--ci", String(index));
          wrap.appendChild(span);
          chars.push({ el: span, line: li, i: index });
          index += 1;
        }
        seg.appendChild(wrap);
        if (wi < words.length - 1) seg.appendChild(document.createTextNode(" "));
      });
    });
  });

  // The ink copy sits outside the h1 (so the heading's text is said once)
  // and overlays it exactly: same classes, same box.
  const inkWrap = document.createElement("div");
  inkWrap.className = "hero-title hero-title-ink";
  inkWrap.setAttribute("aria-hidden", "true");
  const ink = lines.cloneNode(true);
  ink.classList.add("hero-lines-ink");
  inkWrap.appendChild(ink);
  title.after(inkWrap);
  const inkChars = [...ink.querySelectorAll(".hero-char")];

  const n = chars.length;
  const cx = new Float32Array(n);
  const cy = new Float32Array(n);
  const boost = new Float32Array(n);
  const cur = new Int16Array(n).fill(-1);
  let pointer = null;
  let lastMove = -1e9;
  let enterAt = -1;
  let visible = true;
  let running = false;
  let clip = "";
  let wake = 0;

  function write(i, w) {
    if (w === cur[i]) return;
    cur[i] = w;
    const v = String(w);
    chars[i].el.style.setProperty("--w", v);
    inkChars[i].style.setProperty("--w", v);
  }

  function frame(now) {
    const idle = !fine || now - lastMove > 2600;
    const period = 6200;
    const wave = ((now % period) / 2600) * (n + 12) - 6;
    const entering = enterAt >= 0 && now - enterAt < 160 + n * 26 + 900;
    let settled = !entering;
    for (let i = 0; i < n; i += 1) {
      const { line } = chars[i];
      let target = 0;
      if (pointer && !idle) {
        const dx = cx[i] - pointer.x;
        const dy = (cy[i] - pointer.y) * 1.3;
        target = Math.exp(-(dx * dx + dy * dy) / (2 * 140 * 140));
      } else if (idle) {
        const d = i - wave;
        target = 0.92 * Math.exp(-(d * d) / (2 * 2.4 * 2.4));
      }
      boost[i] += (target - boost[i]) * 0.18;
      if (Math.abs(target - boost[i]) > 0.004) settled = false;
      let w = BASE[line];
      if (enterAt >= 0 && entering) {
        const u = clamp01((now - enterAt - 160 - i * 26) / 900);
        const e = 1 - (1 - u) ** 3;
        w = ENTER_FROM[line] + (BASE[line] - ENTER_FROM[line]) * e;
      }
      write(i, Math.round(Math.min(700, w + boost[i] * RANGE[line])));
    }
    // Mouse parked and the letters have settled: park the loop, and wake it
    // again when the idle wave is due.
    if (settled && !idle && fine) {
      stop();
      window.clearTimeout(wake);
      wake = window.setTimeout(start, 2700);
    }
  }

  function start() {
    if (running || reduce || !visible || document.hidden) return;
    running = true;
    add(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    remove(frame);
  }

  function measure() {
    const t = title.getBoundingClientRect();
    chars.forEach((c, i) => {
      const r = c.el.getBoundingClientRect();
      cx[i] = r.left - t.left + r.width / 2;
      cy[i] = r.top - t.top + r.height / 2;
    });
  }

  if (!reduce && fine) {
    const stage = title.closest("[data-hero-stage]") || title;
    stage.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const t = title.getBoundingClientRect();
      pointer = { x: event.clientX - t.left, y: event.clientY - t.top };
      lastMove = performance.now();
      start();
    });
    stage.addEventListener("pointerleave", () => {
      pointer = null;
      lastMove = -1e9;
      start();
    });
  }

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  return {
    measure,
    enter() {
      enterAt = performance.now();
      start();
    },
    show() {
      start();
    },
    setVisible(v) {
      visible = v;
      if (v) start();
      else stop();
    },
    // Clip circle in the title's own coordinates (from signal.js).
    setClip(x, y, r) {
      const key = `${x.toFixed(1)}|${y.toFixed(1)}|${r.toFixed(1)}`;
      if (key === clip) return;
      clip = key;
      for (const node of [title, inkWrap]) {
        node.style.setProperty("--cx", `${x.toFixed(1)}px`);
        node.style.setProperty("--cy", `${y.toFixed(1)}px`);
        node.style.setProperty("--cr", `${Math.max(0, r).toFixed(1)}px`);
      }
    },
  };
}
