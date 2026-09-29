// The particle engine: "static tuning into signal", shared by the loader and
// every section of the page. One engine, one loop (ticker.js).
//
//   sampleText(words, box, opts)  live text -> particle targets (per word)
//   wrapWords(el, split)          wrap words (or chars) so one can be hidden
//                                 while its particles stand in for it
//   createSwarm(n)                struct-of-arrays particle store
//   engine.add(scene)             canvases exist only while a scene's host
//                                 is on screen; released (0x0) afterwards
//   engine.setNoise(v)            the desk level: effect amplitude only
//
// A scene is any object with: host, padding(rect), mount(), unmount(),
// frame(now) -> keep drawing?, fallback(), and optionally source (the
// element whose box the canvas covers; defaults to host).
// Under reduced motion the engine is off: nothing is hidden, nothing mounts.

import { add, remove } from "./ticker.js";

const coarse = window.matchMedia("(pointer: coarse)").matches;
export const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const enabled = !reduce && "IntersectionObserver" in window && Boolean(window.CanvasRenderingContext2D);

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const easeOut3 = (t) => 1 - (1 - t) ** 3;
export const easeInOut3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Particle budget: phones and low-DPR screens draw fewer (and larger) grains.
export function density() {
  const w = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  let k = w < 768 ? 0.4 : w < 1100 ? 0.66 : 1;
  if (dpr < 1.3) k *= 0.85;
  if (coarse) k *= 0.85;
  return k;
}

export const grain = () => (window.innerWidth < 768 ? 2 : 1.6);

// ---------------------------------------------------------------- words

// Wrap each word (or character) of el's text in <span class="fx-w">. The
// text itself is unchanged for assistive tech; the spans let one word be
// hidden while its particles stand in for it. Pre-split headings (the
// Services crescendo) reuse their own word spans.
export function wrapWords(el, split = "word") {
  const pre = el.querySelectorAll(".ramp-word");
  if (pre.length) {
    pre.forEach((w) => w.classList.add("fx-w"));
    return [...pre];
  }
  const nodes = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || n.parentElement.closest(".sr-only, [data-fx-skip]")) continue;
    nodes.push(n);
  }
  const out = [];
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    const parts = split === "char" ? [...node.nodeValue] : node.nodeValue.split(/(\s+)/);
    parts.forEach((part) => {
      if (!part) return;
      if (!part.trim()) {
        frag.appendChild(document.createTextNode(part));
        return;
      }
      const span = document.createElement("span");
      span.className = "fx-w";
      span.textContent = part;
      frag.appendChild(span);
      out.push(span);
    });
    node.replaceWith(frag);
  });
  return out;
}

// --------------------------------------------------------------- sample

let probe = null;
function probeCtx(w, h) {
  if (!probe) probe = document.createElement("canvas");
  if (probe.width < w) probe.width = w;
  if (probe.height < h) probe.height = h;
  return probe.getContext("2d", { willReadFrequently: true });
}

// Draw the words' live text into an offscreen canvas and sample it on a
// grid. Each word is drawn in a colour that encodes its index (R, G) and its
// palette entry (B), so every sampled point knows which word it belongs to
// and what colour it is. box = { left, top, w, h } in viewport px.
export function sampleText(words, box, { max = 2000, minStep = 1.6 } = {}) {
  const W = Math.max(1, Math.ceil(box.w));
  const H = Math.max(1, Math.ceil(box.h));
  const k = W * H > 700000 ? 0.5 : 1;
  const cw = Math.ceil(W * k);
  const ch = Math.ceil(H * k);
  const c = probeCtx(cw, ch);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cw, ch);
  c.setTransform(k, 0, 0, k, 0, 0);
  const palette = [];
  const rects = [];
  const range = document.createRange();
  words.forEach((wordEl, wi) => {
    const wr = wordEl.getBoundingClientRect();
    rects.push({ x: wr.left - box.left, y: wr.top - box.top, w: wr.width, h: wr.height });
    const walker = document.createTreeWalker(wordEl, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue.trim()) continue;
      const cs = getComputedStyle(t.parentElement);
      range.selectNodeContents(t);
      const r = range.getClientRects()[0];
      if (!r) continue;
      let pi = palette.indexOf(cs.color);
      if (pi < 0) pi = palette.push(cs.color) - 1;
      c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      c.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      const code = wi + 1;
      c.fillStyle = `rgb(${code >> 8},${code & 255},${pi})`;
      const m = c.measureText(t.nodeValue);
      c.fillText(t.nodeValue, r.left - box.left, r.top - box.top + m.fontBoundingBoxAscent);
    }
  });
  const data = c.getImageData(0, 0, cw, ch).data;
  let area = 0;
  for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (data[(y * cw + x) * 4 + 3] > 140) area += 4;
  area /= k * k;
  const step = Math.max(minStep, Math.sqrt(area / Math.max(1, max)));
  const xs = [];
  const ys = [];
  const wd = [];
  const cl = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const sx = Math.min(cw - 1, Math.round((x + Math.random() * step) * k));
      const sy = Math.min(ch - 1, Math.round((y + Math.random() * step) * k));
      const o = (sy * cw + sx) * 4;
      if (data[o + 3] <= 140) continue;
      const code = (data[o] << 8) | data[o + 1];
      if (!code) continue;
      xs.push(sx / k);
      ys.push(sy / k);
      wd.push(code - 1);
      cl.push(Math.min(palette.length - 1, data[o + 2]));
    }
  }
  return {
    n: xs.length,
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    word: Int16Array.from(wd),
    col: Uint8Array.from(cl),
    palette: palette.length ? palette : ["#f1ece6"],
    rects,
    step,
  };
}

// ---------------------------------------------------------------- swarm

export function createSwarm(n) {
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i += 1) seed[i] = Math.random();
  return {
    n,
    hx: new Float32Array(n), // home (the static it starts as)
    hy: new Float32Array(n),
    tx: new Float32Array(n), // target (the signal it becomes)
    ty: new Float32Array(n),
    ox: new Float32Array(n), // displacement (interaction)
    oy: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    st: new Float32Array(n).fill(-1), // travel start time, -1 = still static
    word: new Int16Array(n),
    col: new Uint8Array(n),
    seed,
  };
}

// Index lists per value of `key` (colour, word): one fillStyle per bucket.
export function bucket(values, count) {
  const lists = Array.from({ length: count }, () => []);
  for (let i = 0; i < values.length; i += 1) if (lists[values[i]]) lists[values[i]].push(i);
  return lists.map((l) => Int32Array.from(l));
}

// Gaussian-ish offset (sum of two uniforms), for defocused homes.
export const spread = (s) => (Math.random() + Math.random() - 1) * s;

// --------------------------------------------------------------- engine

const scenes = new Map();
const mounted = new Set();
const pool = [];
let running = false;
let visIO = null;
let bandIO = null;
let fontsReady = false;

function loop(now) {
  let live = false;
  for (const s of mounted) {
    let keep = false;
    try {
      keep = s.frame(now);
    } catch (error) {
      console.warn("[markui] fx scene stopped", error);
      if (s.fail) s.fail();
      unmount(s);
    }
    if (keep) live = true;
  }
  if (!live) {
    running = false;
    remove(loop);
  }
}

function wake() {
  if (running || !mounted.size || document.hidden) return;
  running = true;
  add(loop);
}

function acquire() {
  const c = pool.pop() || document.createElement("canvas");
  c.className = "fx-canvas";
  c.setAttribute("aria-hidden", "true");
  return c;
}

function release(c) {
  c.width = 0;
  c.height = 0;
  c.remove();
  pool.push(c);
}

function mount(scene) {
  if (mounted.has(scene) || !fontsReady) return;
  const host = scene.host;
  const src = (scene.source || host).getBoundingClientRect();
  const hr = host.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const p = scene.padding(src);
  const l = Math.min(p.l, Math.max(0, src.left));
  const r = Math.min(p.r, Math.max(0, vw - src.right));
  const box = {
    left: src.left - l,
    top: src.top - p.t,
    w: Math.round(src.width + l + r),
    h: Math.round(src.height + p.t + p.b),
    padL: l,
    padT: p.t,
    srcW: src.width,
    srcH: src.height,
    docLeft: src.left - l + window.scrollX,
    docTop: src.top - p.t + window.scrollY,
  };
  const c = acquire();
  const dpr = Math.min(scene.maxDpr || 1.5, window.devicePixelRatio || 1);
  c.width = Math.max(1, Math.round(box.w * dpr));
  c.height = Math.max(1, Math.round(box.h * dpr));
  c.style.cssText = `left:${(box.left - hr.left).toFixed(1)}px;top:${(box.top - hr.top).toFixed(1)}px;width:${box.w}px;height:${box.h}px`;
  host.appendChild(c);
  scene.canvas = c;
  scene.ctx = c.getContext("2d");
  scene.dpr = dpr;
  scene.box = box;
  mounted.add(scene);
  scene.mount();
  wake();
}

function unmount(scene) {
  if (!mounted.has(scene)) return;
  mounted.delete(scene);
  scene.unmount();
  release(scene.canvas);
  scene.canvas = null;
  scene.ctx = null;
}

let resizeTimer = 0;
let lastW = window.innerWidth;
function remountAll() {
  if (Math.abs(window.innerWidth - lastW) < 2 && window.innerWidth < 1100) return; // phone URL-bar resizes
  lastW = window.innerWidth;
  [...mounted].forEach((s) => {
    unmount(s);
    mount(s);
  });
}

export const engine = {
  noise: 0.05,
  wake,
  add(scene) {
    if (!enabled) return scene;
    if (!visIO) {
      visIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const s = scenes.get(e.target);
            if (!s) continue;
            s.inView = e.isIntersecting;
            if (e.isIntersecting) mount(s);
            else unmount(s);
          }
        },
        { rootMargin: "12% 0px 12% 0px" },
      );
      // Fallback trigger: the scene tunes in by itself once its host is in
      // the upper half of the screen (the signal normally gets there first).
      bandIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const s = scenes.get(e.target);
            if (s && e.isIntersecting) s.fallback();
          }
        },
        { rootMargin: "-6% 0px -50% 0px" },
      );
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(remountAll, 220);
      });
      document.addEventListener("visibilitychange", wake);
      const ready = document.fonts ? document.fonts.ready : Promise.resolve();
      ready.then(() => {
        fontsReady = true;
        scenes.forEach((s) => s.inView && mount(s));
      });
    }
    const key = scene.source && scene.host.contains(scene.source) && scene.host !== scene.source ? scene.source : scene.host;
    scenes.set(key, scene);
    visIO.observe(key);
    if (scene.useBand !== false) bandIO.observe(key);
    return scene;
  },
  setNoise(v) {
    engine.noise = v;
    mounted.forEach((s) => s.onNoise && s.onNoise(v));
    wake();
  },
  isMounted: (scene) => mounted.has(scene),
};
