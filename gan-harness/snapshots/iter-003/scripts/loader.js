// Loader: about 6000 particles of static "tune in" to the brand line
// "Less Noise. / More Impact●" while a counter runs 000 → 100. The real type
// then takes over from the particles, drops away (its weight falls) and only
// the orange full stop is left. That dot flies and grows (WAAPI) into the
// hero's disc as the overlay clears, so the loader hands off rather than
// fading. Click, any key, wheel or touch skips to the hand-off at once.
// Never runs under reduced motion (html.has-loader is not set).

import { add, remove } from "./ticker.js";

const TRAVEL = 600;
const SPREAD = 360;
const AT = { text: 900, found: 920, drop: 1320, fly: 1510 };
const FLY_MS = 560;
const SKIP_MS = 460;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// The loader is its own module script, ahead of main.js, so it starts as
// soon as the document is parsed. main.js subscribes with whenLoaded().
let result = null;
const waiting = [];

export function whenLoaded(fn) {
  if (result) fn(result);
  else waiting.push(fn);
}

function done(r) {
  if (result) return;
  result = r;
  waiting.splice(0).forEach((fn) => fn(r));
}

function initLoader(onDone) {
  const html = document.documentElement;
  const el = document.querySelector("[data-loader]");
  if (!el || !html.classList.contains("has-loader")) {
    onDone({ flown: false });
    return;
  }

  const canvas = el.querySelector("[data-loader-canvas]");
  const ctx = canvas.getContext("2d");
  const lineQ = el.querySelector("[data-loader-q]");
  const lineL = el.querySelector("[data-loader-l]");
  const dot = el.querySelector("[data-loader-dot]");
  const count = el.querySelector("[data-loader-count]");
  const status = el.querySelector("[data-loader-status]");
  const disc = document.querySelector("[data-hero-disc]");

  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  const N = Math.round(Math.min(6000, Math.max(2600, (W * H) / 210)));
  const hx = new Float32Array(N);
  const hy = new Float32Array(N);
  const tx = new Float32Array(N);
  const ty = new Float32Array(N);
  const delay = new Float32Array(N);
  let buckets = [];
  let t0 = performance.now();
  let tc = 0; // convergence start (0 = not yet)
  let phase = "static";
  let shown = -1;
  let flyer = null;
  let finished = false;

  for (let i = 0; i < N; i += 1) {
    hx[i] = Math.random() * W;
    hy[i] = Math.random() * H;
    tx[i] = hx[i];
    ty[i] = hy[i];
  }
  // Until the type is measured every particle is residual static.
  buckets = [{ kind: "res", color: "#a39a92", size: 1.4, idx: Array.from({ length: N }, (_, i) => i) }];

  function drawLine(c, span, text) {
    const cs = getComputedStyle(span);
    const r = span.getBoundingClientRect();
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight.endsWith("px") ? parseFloat(cs.lineHeight) : fs * 0.9;
    c.font = `${cs.fontWeight} ${fs}px "Clash Display"`;
    c.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    c.wordSpacing = cs.wordSpacing === "normal" ? "0px" : cs.wordSpacing;
    const m = c.measureText(text);
    const asc = m.fontBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent;
    c.fillText(text, r.left, r.top + (lh - (asc + desc)) / 2 + asc);
    return r.bottom;
  }

  // Sample the brand line into particle targets.
  function buildTargets() {
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const c = off.getContext("2d", { willReadFrequently: true });
    c.fillStyle = "#fff";
    const split = drawLine(c, lineQ, lineQ.textContent);
    drawLine(c, lineL, "More Impact");
    const data = c.getImageData(0, 0, W, H).data;
    let area = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 140) area += 4;

    const d = dot.getBoundingClientRect();
    const nDot = Math.round(N * 0.035);
    const nRes = Math.round(N * 0.07);
    const nText = N - nDot - nRes;
    const step = Math.max(1, Math.sqrt(area / nText));
    const pts = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const sx = Math.min(W - 1, Math.round(x + Math.random() * step));
        const sy = Math.min(H - 1, Math.round(y + Math.random() * step));
        if (data[(sy * W + sx) * 4 + 3] > 140) pts.push([sx, sy]);
      }
    }
    for (let i = pts.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    const quiet = [[], [], []];
    const loud = [[], [], []];
    const lit = [];
    const res = [];
    for (let i = 0; i < N; i += 1) {
      if (i < nText && pts.length) {
        const p = pts[i % pts.length];
        tx[i] = p[0] + (i >= pts.length ? Math.random() - 0.5 : 0);
        ty[i] = p[1];
        delay[i] = Math.random() * SPREAD;
        (ty[i] < split ? quiet : loud)[i % 3].push(i);
      } else if (i < nText + nDot) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * (d.width / 2);
        tx[i] = d.left + d.width / 2 + Math.cos(a) * rr;
        ty[i] = d.top + d.height / 2 + Math.sin(a) * rr;
        delay[i] = SPREAD * 0.35 * Math.random();
        lit.push(i);
      } else {
        res.push(i);
      }
    }
    const alpha = [1, 0.72, 0.48];
    buckets = [
      { kind: "res", color: "#a39a92", size: 1.4, idx: res },
      ...quiet.map((idx, g) => ({ kind: "text", color: "#a39a92", size: 1.6, a: alpha[g], idx })),
      ...loud.map((idx, g) => ({ kind: "text", color: "#f1ece6", size: 1.7, a: alpha[g], idx })),
      { kind: "dot", color: "#ff6b00", size: 1.8, a: 1, idx: lit },
    ];
  }

  function paint(now) {
    const conv = tc ? now - tc : -1;
    const settle = conv > 0 ? clamp01((conv - SPREAD * 0.5) / TRAVEL) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const b of buckets) {
      if (b.kind === "res") {
        const fade = conv > 0 ? 1 - clamp01(conv / 900) : 1;
        if (fade <= 0) continue;
        ctx.globalAlpha = fade * (0.35 + Math.random() * 0.4);
      } else {
        const flicker = 0.55 + Math.random() * 0.45;
        ctx.globalAlpha = b.a * flicker + (1 - b.a * flicker) * settle;
      }
      ctx.fillStyle = b.color;
      const s = b.size;
      for (const i of b.idx) {
        let e = 0;
        if (conv > 0 && b.kind !== "res") {
          e = clamp01((conv - delay[i]) / TRAVEL);
          e = 1 - (1 - e) ** 3;
        }
        const j = 1 - e;
        const amp = 1.5 + 30 * j * j;
        const x = hx[i] + (tx[i] - hx[i]) * e + (Math.random() - 0.5) * amp * (j > 0.02 ? 1 : 0);
        const y = hy[i] + (ty[i] - hy[i]) * e + (Math.random() - 0.5) * amp * (j > 0.02 ? 1 : 0);
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  function setCount(p) {
    const n = Math.round(p * 100);
    if (n === shown) return;
    shown = n;
    count.textContent = String(n).padStart(3, "0");
    el.style.setProperty("--tune", p.toFixed(3));
  }

  function frame(now) {
    if (phase !== "drop") {
      paint(now);
      const base = tc ? now - tc : 0;
      setCount(tc ? easeInOut(clamp01(base / AT.found)) : clamp01((now - t0) / 4000) * 0.12);
    }
    if (!tc) return;
    const t = now - tc;
    if (phase === "converge" && t >= AT.text) {
      phase = "text";
      el.classList.add("is-text");
    }
    if (phase === "text" && t >= AT.found) {
      setCount(1);
      el.classList.add("is-found");
      status.textContent = "Signal found";
      phase = "found";
    }
    if (phase === "found" && t >= AT.drop) {
      holdDot();
      el.classList.add("is-drop");
      phase = "drop";
    }
    if (phase === "drop" && t >= AT.fly) fly(FLY_MS);
  }

  // The dot is handed to a fixed "flyer" before the words drop, so it holds
  // its place while the line around it narrows and falls away.
  function holdDot() {
    if (flyer) return;
    const d = dot.getBoundingClientRect();
    const D = Math.max(12, disc ? disc.getBoundingClientRect().width : 0);
    flyer = document.createElement("div");
    flyer.className = "loader-flyer";
    flyer.style.width = `${D}px`;
    flyer.style.height = `${D}px`;
    flyer.dataset.d = String(D);
    flyer.style.transform = `translate(${d.left + d.width / 2 - D / 2}px, ${d.top + d.height / 2 - D / 2}px) scale(${d.width / D})`;
    flyer.dataset.from = JSON.stringify([d.left + d.width / 2, d.top + d.height / 2, d.width / D]);
    document.body.appendChild(flyer);
  }

  function fly(duration) {
    if (phase === "fly" || finished) return;
    phase = "fly";
    remove(frame);
    holdDot();
    el.classList.add("is-drop", "is-text");
    const D = Number(flyer.dataset.d);
    const [fx, fy, fk] = JSON.parse(flyer.dataset.from);
    const r = disc ? disc.getBoundingClientRect() : null;
    window.setTimeout(() => el.classList.add("is-fading"), duration * 0.22);
    if (!r || r.width < 8 || r.bottom < 0 || r.top > window.innerHeight) {
      flyer.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" }).finished.then(() => finish(false));
      return;
    }
    const toX = r.left + r.width / 2;
    const toY = r.top + r.height / 2;
    const toK = r.width / D;
    // A lifted arc; the dot grows mostly on the way down, like it is landing.
    const cx = fx + (toX - fx) * 0.25;
    const cy = Math.min(fy, toY) - H * 0.16;
    const frames = [];
    for (let i = 0; i <= 18; i += 1) {
      const u = easeInOut(i / 18);
      const x = (1 - u) ** 2 * fx + 2 * (1 - u) * u * cx + u * u * toX;
      const y = (1 - u) ** 2 * fy + 2 * (1 - u) * u * cy + u * u * toY;
      const k = fk + (toK - fk) * u ** 2.4;
      frames.push({ transform: `translate(${(x - D / 2).toFixed(2)}px, ${(y - D / 2).toFixed(2)}px) scale(${k.toFixed(4)})` });
    }
    flyer.animate(frames, { duration, easing: "linear", fill: "forwards" }).finished.then(() => finish(true), () => finish(true));
  }

  function finish(flown) {
    if (finished) return;
    finished = true;
    remove(frame);
    detach();
    onDone({ flown });
    // Let the hero paint its disc under the flyer before either is removed.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (flyer) flyer.remove();
        el.remove();
      });
    });
  }

  function skip() {
    if (phase === "fly" || finished) return;
    fly(SKIP_MS);
  }

  const events = ["pointerdown", "keydown", "wheel", "touchstart"];
  function detach() {
    events.forEach((type) => window.removeEventListener(type, skip, true));
    document.removeEventListener("visibilitychange", onHidden);
  }
  function onHidden() {
    if (document.hidden) skip();
  }
  events.forEach((type) => window.addEventListener(type, skip, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", onHidden);

  // Wait (briefly) for the display face, and for the rest of the page's
  // scripts to finish their setup, then measure the line and converge on
  // the next frame. Starting the clock there means the convergence is never
  // eaten by the page's first layout.
  const face = document.fonts ? document.fonts.load('600 100px "Clash Display"') : Promise.resolve();
  const parsed = new Promise((r) => {
    if (document.readyState !== "loading") r();
    else document.addEventListener("DOMContentLoaded", r, { once: true });
  });
  Promise.all([Promise.race([face, new Promise((r) => setTimeout(r, 900))]), parsed])
    .then(() => {
      requestAnimationFrame(() => {
        if (finished || phase === "fly") return;
        buildTargets();
        tc = Math.max(performance.now(), t0 + 140);
        phase = "converge";
      });
    })
    .catch(() => skip());

  add(frame);
  // Absolute safety net: never hold the page for more than 4.5 s.
  window.setTimeout(skip, 4500);
}

try {
  initLoader(done);
} catch (error) {
  console.warn("[markui] loader did not start", error);
  document.querySelector("[data-loader]")?.remove();
  done({ flown: false });
}
