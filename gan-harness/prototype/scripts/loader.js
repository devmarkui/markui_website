// The intro: "Less Noise. More Impact." tuned in, then landed.
//  1. Static (CSS, from first paint). The particle engine samples "Less
//     Noise." and the static converges on it; the leftover static falls away.
//  2. "Less Noise." drops its last few px and lands softly: a small squash
//     and a puff of dust.
//  3. A floor line draws in. "More Impact" falls from above the screen letter
//     by letter and slams onto it: per-letter squash and settle, dust kicked
//     up, the floor ripples, the stage jolts and knocks "Less Noise." up.
//  4. The full stop drops last, stretched as it falls, squashes, bounces
//     twice, and rings a shockwave: "Signal found".
//  5. Hand-off: the words fall away and the dot flies (WAAPI) into the hero
//     disc; the hero's entrance overlaps the flight (markui:intro-go).
// Repeat views in the same session run a ~1 s cut of the same beats. Click,
// any key, wheel or touch skips to the hand-off. Reduced motion never runs
// this (index.html shows a static card instead).

import { add, remove } from "./ticker.js";
import { sampleText, createSwarm, density, spread, clamp01, easeOut3, easeInOut3 } from "./particles.js";
import { createImpact } from "./loader-impact.js";

const FULL = { conv: 660, qLand: 1000, floor: 1160, lDrop: 1260, fall: 400, stagger: 32, dot: 2240, dotFall: 320, go: 2960, fly: 600 };
const SHORT = { conv: 0, qLand: 30, floor: 10, lDrop: 30, fall: 220, stagger: 10, dot: 330, dotFall: 180, go: 580, fly: 360 };
const SKIP_FLY = 440;

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

// Squash and settle, bottom-anchored. h = fall height in px.
function landing(h, fall, hard) {
  const total = fall + 420;
  const at = (ms) => Math.min(1, ms / total);
  const sq = hard ? [1.28, 0.64] : [1.08, 0.9];
  return {
    frames: [
      { transform: `translateY(${-h}px) scale(${hard ? 0.86 : 0.97}, ${hard ? 1.26 : 1.05})`, offset: 0, easing: "cubic-bezier(0.55, 0, 0.95, 0.4)" },
      { transform: `translateY(0) scale(${sq[0]}, ${sq[1]})`, offset: at(fall), easing: "cubic-bezier(0.22, 0.9, 0.3, 1)" },
      { transform: `translateY(${hard ? -0.13 : -0.04}em) scale(${hard ? 0.93 : 0.99}, ${hard ? 1.1 : 1.02})`, offset: at(fall + 130), easing: "cubic-bezier(0.5, 0, 0.7, 0.6)" },
      { transform: `translateY(0) scale(${hard ? 1.06 : 1.02}, ${hard ? 0.95 : 0.99})`, offset: at(fall + 240), easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" },
      { transform: "translateY(0) scale(1, 1)", offset: 1 },
    ],
    total,
  };
}

function initLoader() {
  const html = document.documentElement;
  const el = document.querySelector("[data-loader]");
  if (!el || !html.classList.contains("has-loader")) {
    done({ flown: false });
    return;
  }
  const short = html.classList.contains("intro-short");
  const T = short ? SHORT : FULL;
  try {
    sessionStorage.setItem("markui-intro", "1");
  } catch (error) {
    /* private mode: always the full intro */
  }

  const canvas = el.querySelector("[data-loader-canvas]");
  const ctx = canvas.getContext("2d");
  const stage = el.querySelector("[data-loader-stage]");
  const lineQ = el.querySelector("[data-loader-q]");
  const word = el.querySelector("[data-loader-word]");
  const dot = el.querySelector("[data-loader-dot]");
  const count = el.querySelector("[data-loader-count]");
  const status = el.querySelector("[data-loader-status]");
  const disc = document.querySelector("[data-hero-disc]");
  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const small = W < 768;

  // Split "More Impact" into letters that can fall one by one.
  const letters = [];
  const text = word.textContent;
  word.textContent = "";
  text.split(" ").forEach((w, wi, all) => {
    const wrap = document.createElement("span");
    wrap.className = "loader-wd";
    for (const ch of w) {
      const s = document.createElement("span");
      s.className = "loader-ch";
      s.textContent = ch;
      wrap.appendChild(s);
      letters.push(s);
    }
    word.appendChild(wrap);
    if (wi < all.length - 1) word.appendChild(document.createTextNode(" "));
  });

  const impact = createImpact({ W, H, small });
  let S = 0;
  let phase = "static";
  let shown = -1;
  let swarm = null;
  let byCol = [];
  let palette = [];
  let res = null;
  let qShownAt = 0;
  let travel = 400;
  let floorY = 0;
  let flyer = null;
  let finished = false;
  const anims = [];
  const events = [];
  const at = (ms, fn) => events.push({ ms, fn });

  function setCount(p) {
    const n = Math.round(clamp01(p) * 100);
    if (n === shown) return;
    shown = n;
    count.textContent = String(n).padStart(3, "0");
    el.style.setProperty("--tune", (n / 100).toFixed(2));
  }

  // 1. Static tunes in to "Less Noise." (sampled at its raised position).
  function buildQ() {
    lineQ.style.transform = "translateY(-0.26em)";
    const s = sampleText([lineQ], { left: 0, top: 0, w: W, h: H }, { max: Math.round((small ? 2600 : 3400) * density() + (small ? 400 : 0)), minStep: small ? 2.4 : 1.7 });
    const n = s.n;
    swarm = createSwarm(n);
    swarm.tx.set(s.x);
    swarm.ty.set(s.y);
    swarm.col.set(s.col);
    palette = s.palette;
    const band = lineQ.getBoundingClientRect();
    // Arrival budget: everything has landed on the type before it lands.
    const budget = Math.max(360, T.qLand - 70);
    travel = Math.min(440, budget * 0.5);
    const lead = budget - travel;
    for (let i = 0; i < n; i += 1) {
      const near = swarm.seed[i] < (small ? 0.78 : 0.58);
      swarm.hx[i] = near ? swarm.tx[i] + spread(band.height * 1.6) : Math.random() * W;
      swarm.hy[i] = near ? swarm.ty[i] + spread(band.height * 1.1) : Math.random() * H;
      swarm.st[i] = (Math.random() * 0.55 + (Math.abs(swarm.tx[i] - W / 2) / W) * 0.9) * lead;
    }
    byCol = palette.map((_, c) => Int32Array.from([...Array(n).keys()].filter((i) => swarm.col[i] === c)));
    const nr = Math.round((small ? 520 : 1500) * density());
    res = createSwarm(nr);
    for (let i = 0; i < nr; i += 1) {
      res.hx[i] = Math.random() * W;
      res.hy[i] = Math.random() * H;
    }
  }

  function drawSwarm(t) {
    if (!swarm) return;
    const size = small ? 2.3 : 1.7;
    const qFade = qShownAt ? 1 - clamp01((t - qShownAt) / 220) : 1;
    if (qFade <= 0 && t - T.conv > 760) return;
    if (qFade > 0) {
      for (let c = 0; c < byCol.length; c += 1) {
        ctx.fillStyle = palette[c];
        ctx.globalAlpha = qFade * (0.75 + Math.random() * 0.25);
        const idx = byCol[c];
        for (let k = 0; k < idx.length; k += 1) {
          const i = idx[k];
          const u = clamp01((t - swarm.st[i]) / travel);
          const e = easeOut3(u);
          const j = 1 - e;
          const amp = j > 0.02 ? 1.2 + 34 * j * j : 0;
          ctx.fillRect(swarm.hx[i] + (swarm.tx[i] - swarm.hx[i]) * e + (Math.random() - 0.5) * amp, swarm.hy[i] + (swarm.ty[i] - swarm.hy[i]) * e + (Math.random() - 0.5) * amp, size, size);
        }
      }
    }
    // The leftover static: flickers, then falls away (less noise).
    const fallT = t - T.conv;
    ctx.fillStyle = "#a39a92";
    for (let i = 0; i < res.n; i += 1) {
      let y = res.hy[i];
      if (fallT > 0) {
        const g = fallT * (0.4 + res.seed[i] * 0.8);
        y += 0.0016 * g * g;
        if (y > H) continue;
      }
      ctx.globalAlpha = (fallT > 0 ? Math.max(0, 1 - fallT / 700) : 1) * (0.25 + Math.random() * 0.4);
      ctx.fillRect(res.hx[i] + (Math.random() - 0.5) * 3, y, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  }

  function schedule() {
    const qr = () => lineQ.getBoundingClientRect();
    // 2. "Less Noise." lands softly.
    at(T.qLand, () => {
      performance.mark("intro:less-noise");
      el.classList.add("is-q");
      qShownAt = performance.now() - S;
      lineQ.style.transform = "";
      const r = qr();
      const L = landing(parseFloat(getComputedStyle(lineQ).fontSize) * 0.26, short ? 120 : 200, false);
      anims.push(lineQ.animate(L.frames, { duration: L.total, fill: "backwards" }));
      window.setTimeout(() => impact.dust(r.left + r.width * 0.1, r.right - r.width * 0.1, r.bottom - r.height * 0.18, 26, 0.5, "#a39a92"), short ? 120 : 200);
    });
    // 3. The floor, then "More Impact" slams onto it.
    at(T.floor, () => {
      const lr = word.getBoundingClientRect();
      floorY = baseline();
      impact.floor(lr.left - Math.min(80, W * 0.05), lr.right + Math.min(80, W * 0.05), floorY);
    });
    at(T.lDrop, () => {
      el.classList.add("is-l");
      letters.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const L = landing(r.bottom + 40, T.fall, true);
        const delay = i * T.stagger;
        anims.push(s.animate(L.frames, { duration: L.total, delay, fill: "backwards" }));
        window.setTimeout(() => {
          if (finished) return;
          impact.dust(r.left, r.right, floorY, small ? 10 : 20, 1, "#d8d0c8");
          impact.ripple((r.left + r.right) / 2, i === 0 || i === letters.length - 1 ? 1 : 0.55);
          if (i === 0) {
            performance.mark("intro:impact");
            jolt(1, true);
          }
          if (i === letters.length - 1) jolt(0.55, false);
        }, delay + T.fall);
      });
    });
    // 4. The full stop drops last and bounces.
    at(T.dot, () => {
      el.classList.add("is-dot");
      const r = dot.getBoundingClientRect();
      const f = T.dotFall;
      const tot = f + (short ? 260 : 560);
      const o = (ms) => Math.min(1, ms / tot);
      const hop = short ? 0.3 : 0.55;
      anims.push(
        dot.animate(
          [
            { transform: `translateY(${-(r.bottom + 40)}px) scale(0.7, 1.5)`, offset: 0, easing: "cubic-bezier(0.55, 0, 0.95, 0.4)" },
            { transform: "translateY(0) scale(1.55, 0.58)", offset: o(f), easing: "cubic-bezier(0.2, 0.9, 0.35, 1)" },
            { transform: `translateY(${-hop}em) scale(0.86, 1.18)`, offset: o(f + (short ? 130 : 190)), easing: "cubic-bezier(0.5, 0, 0.9, 0.5)" },
            { transform: "translateY(0) scale(1.25, 0.8)", offset: o(f + (short ? 260 : 350)), easing: "cubic-bezier(0.2, 0.9, 0.35, 1)" },
            { transform: `translateY(${-hop * 0.3}em) scale(0.96, 1.05)`, offset: o(f + 450), easing: "cubic-bezier(0.5, 0, 0.9, 0.5)" },
            { transform: "translateY(0) scale(1, 1)", offset: 1 },
          ],
          { duration: tot, fill: "backwards" },
        ),
      );
      window.setTimeout(() => {
        if (finished) return;
        const d = dot.getBoundingClientRect();
        impact.ring(d.left + d.width / 2, d.top + d.height / 2);
        impact.sparks(d.left + d.width / 2, d.bottom, small ? 22 : 40);
        impact.ripple(d.left + d.width / 2, 0.7);
        jolt(0.45, false);
        el.classList.add("is-found");
        status.textContent = "Signal found";
        performance.mark("intro:dot");
      }, f);
    });
    at(T.go, go);
  }

  // The letters' baseline, from the face's own metrics.
  function baseline() {
    const r = letters[0].getBoundingClientRect();
    const cs = getComputedStyle(letters[0]);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText("M");
    const asc = m.fontBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent;
    return r.top + (r.height - (asc + desc)) / 2 + asc;
  }

  // A camera jolt: the whole stage kicks down and recovers in ~2 frames.
  function jolt(k, knock) {
    stage.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: `translate(${(k * 3).toFixed(1)}px, ${(k * 9).toFixed(1)}px) scale(${1 + k * 0.006})`, offset: 0.18 },
        { transform: `translate(${(-k * 2).toFixed(1)}px, ${(-k * 4).toFixed(1)}px)`, offset: 0.45 },
        { transform: `translate(0, ${(k * 1.5).toFixed(1)}px)`, offset: 0.72 },
        { transform: "translate(0, 0)" },
      ],
      { duration: 200, easing: "linear" },
    );
    if (knock && !short) {
      lineQ.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(-0.14em) rotate(-0.6deg)", offset: 0.3, easing: "cubic-bezier(0.5, 0, 0.9, 0.5)" },
          { transform: "translateY(0) scale(1.03, 0.96)", offset: 0.62, easing: "cubic-bezier(0.2, 0.9, 0.35, 1)" },
          { transform: "translateY(0)" },
        ],
        { duration: 420, composite: "add" },
      );
    }
  }

  function frame(now) {
    const t = now - S;
    while (events.length && t >= events[0].ms) events.shift().fn();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (phase !== "go") drawSwarm(t);
    impact.draw(ctx, now);
    setCount(phase === "go" ? 1 : easeInOut3(clamp01(t / (T.dot + T.dotFall))));
  }

  // The dot is handed to a fixed "flyer" so it holds its place while the
  // words fall away around it.
  function holdDot() {
    if (flyer) return;
    const d = dot.getBoundingClientRect();
    const D = Math.max(12, disc ? disc.getBoundingClientRect().width : 0);
    flyer = document.createElement("div");
    flyer.className = "loader-flyer";
    flyer.style.width = `${D}px`;
    flyer.style.height = `${D}px`;
    flyer.dataset.d = String(D);
    flyer.dataset.from = JSON.stringify([d.left + d.width / 2, d.top + d.height / 2, d.width / D]);
    flyer.style.transform = `translate(${d.left + d.width / 2 - D / 2}px, ${d.top + d.height / 2 - D / 2}px) scale(${d.width / D})`;
    document.body.appendChild(flyer);
  }

  function go(duration = T.fly) {
    if (phase === "go" || finished) return;
    phase = "go";
    performance.mark("intro:go");
    events.length = 0;
    anims.forEach((a) => a.playState !== "finished" && a.finish());
    el.classList.add("is-q", "is-l", "is-dot", "is-drop");
    setCount(1);
    holdDot();
    document.dispatchEvent(new CustomEvent("markui:intro-go"));
    const D = Number(flyer.dataset.d);
    const [fx, fy, fk] = JSON.parse(flyer.dataset.from);
    const r = disc ? disc.getBoundingClientRect() : null;
    window.setTimeout(() => el.classList.add("is-fading"), duration * 0.2);
    if (!r || r.width < 8 || r.bottom < 0 || r.top > H) {
      flyer.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" }).finished.then(() => finish(false));
      return;
    }
    const toX = r.left + r.width / 2;
    const toY = r.top + r.height / 2;
    const toK = r.width / D;
    const cx = fx + (toX - fx) * 0.25;
    const cy = Math.min(fy, toY) - H * 0.18;
    const frames = [];
    for (let i = 0; i <= 20; i += 1) {
      const u = easeInOut3(i / 20);
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
    performance.mark("intro:landed");
    remove(frame);
    detach();
    done({ flown });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (flyer) flyer.remove();
        el.remove();
      });
    });
  }

  function skip() {
    if (phase === "go" || finished) return;
    go(SKIP_FLY);
  }
  const kinds = ["pointerdown", "keydown", "wheel", "touchstart"];
  function detach() {
    kinds.forEach((type) => window.removeEventListener(type, skip, true));
    document.removeEventListener("visibilitychange", onHidden);
  }
  function onHidden() {
    if (document.hidden) skip();
  }
  kinds.forEach((type) => window.addEventListener(type, skip, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", onHidden);

  // Start as soon as the display face is ready. The timeline is relative to
  // this moment, but it is compressed if the page was slow to get here.
  const face = document.fonts ? document.fonts.load('600 100px "Clash Display"') : Promise.resolve();
  Promise.race([face, new Promise((r) => setTimeout(r, 700))])
    .then(() => {
      if (finished || phase === "go") return;
      const late = performance.now() > 900;
      if (late && !short) {
        const cut = 240;
        Object.keys(T).forEach((k) => {
          if (k !== "fall" && k !== "stagger" && k !== "dotFall" && k !== "fly" && T[k] > 0) T[k] = Math.max(0, T[k] - cut);
        });
      }
      if (!short) buildQ();
      else el.classList.add("is-q");
      S = performance.now();
      performance.mark("intro:start");
      phase = "run";
      el.classList.add("is-live");
      schedule();
      add(frame);
    })
    .catch(() => skip());

  window.setTimeout(skip, 6000);
}

try {
  initLoader();
} catch (error) {
  console.warn("[markui] loader did not start", error);
  document.querySelector("[data-loader]")?.remove();
  done({ flown: false });
}
