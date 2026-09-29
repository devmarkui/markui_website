// Hero type: the headline and the Noise fader are one instrument.
// - The fader moves the weight between the two lines (setSwap 0..1, from
//   hero.js on every desk change). Clean side (rest): "Design the Future."
//   at its default hairline weight and "Define the Experience." bold. Noise
//   side: "Design the Future." bold and "Define the Experience." back to the
//   default weight. Everything in between is a live crossfade, both ways.
//   Weight only: the size and the layout never change.
// - The cursor turns up the letters near it on either line; on touch (or
//   when the mouse rests) a weight wave sweeps whichever line is quiet.
// - Full stops are pinned heavy (a thin stop reads as a comma).
// - A clipped ink duplicate sits on top (aria-hidden, outside the h1);
//   signal.js sets its circle (--cx, --cy, --cr) to the disc, so the type
//   turns ink where it crosses it.

import { add, remove } from "./ticker.js";

const QUIET = 220;
const LOUD = 640;
const SWELL = 240;

export function createType(title, { reduce = false, fine = false } = {}) {
  const lines = title.querySelector(".hero-lines");
  const inner = title.parentElement;
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
          span.className = ch === "." ? "hero-char is-stop" : "hero-char";
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
  const n2 = chars.filter((c) => c.line === 1).length;
  const first2 = n - n2;
  const cx = new Float32Array(n);
  const cy = new Float32Array(n);
  const boost = new Float32Array(n);
  const cur = new Int16Array(n).fill(-1);
  let swap = 0;
  let pointer = null;
  let lastMove = -1e9;
  let visible = true;
  let running = false;
  let clip = "";
  let wake = 0;
  let measureTimer = 0;

  function write(i, w) {
    if (w === cur[i]) return;
    cur[i] = w;
    const v = String(w);
    chars[i].el.style.setProperty("--w", v);
    inkChars[i].style.setProperty("--w", v);
  }

  const base = (line) => (line === 0 ? QUIET + (LOUD - QUIET) * swap : LOUD - (LOUD - QUIET) * swap);

  function writeAll() {
    for (let i = 0; i < n; i += 1) {
      const w = base(chars[i].line) + boost[i] * SWELL;
      write(i, Math.round(Math.max(QUIET, Math.min(700, w))));
    }
  }

  function frame(now) {
    const idle = !fine || now - lastMove > 2600;
    const period = 6400;
    // The idle wave runs along whichever line is currently the quiet one.
    const quiet = swap < 0.5 ? 0 : 1;
    const span = quiet === 0 ? first2 : n2;
    const from = quiet === 0 ? 0 : first2;
    const wave = ((now % period) / 2800) * (span + 12) - 6;
    let settled = true;
    for (let i = 0; i < n; i += 1) {
      const { line } = chars[i];
      let target = 0;
      if (pointer && !idle) {
        const dx = cx[i] - pointer.x;
        const dy = (cy[i] - pointer.y) * 1.2;
        target = Math.exp(-(dx * dx + dy * dy) / (2 * 170 * 170));
      } else if (idle && line === quiet) {
        const d = i - from - wave;
        target = 0.95 * Math.exp(-(d * d) / (2 * 2.4 * 2.4));
      }
      boost[i] += (target - boost[i]) * 0.2;
      if (Math.abs(target - boost[i]) > 0.004) settled = false;
    }
    writeAll();
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
      if (event.pointerType !== "mouse" || event.target.closest("[data-fader]")) return;
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
  writeAll();

  return {
    measure,
    // 0 = clean side ("Define the Experience." bold) … 1 = noise side
    // ("Design the Future." bold).
    setSwap(v) {
      const next = Math.min(1, Math.max(0, v));
      if (Math.abs(next - swap) < 0.0005) return;
      swap = next;
      inner.style.setProperty("--swap", swap.toFixed(3));
      writeAll();
      window.clearTimeout(measureTimer);
      measureTimer = window.setTimeout(measure, 160);
    },
    enter() {
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
