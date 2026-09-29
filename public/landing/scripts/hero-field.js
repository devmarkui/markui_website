// Hero field: noisy concentric rings flowing out of the disc. Rings are born
// orange at the disc's edge and cool to bone as they travel outward; their
// turbulence is the page's Noise level (the desk), and the cursor pushes them
// aside so they bend around it. When the disc lands (end of the loader) a
// shockwave ring runs out first. As the disc shrinks into the dot on scroll
// the whole field is turned down with it (setFade). Driven by the shared
// ticker, only while the hero is on screen and the tab is visible.

import { add, remove } from "./ticker.js";

const TAU = Math.PI * 2;
const SEG = 150;
const ORANGE = [255, 107, 0];
const BONE = [216, 208, 200];

const palette = Array.from({ length: 16 }, (_, i) => {
  const t = i / 15;
  const c = ORANGE.map((o, k) => Math.round(o + (BONE[k] - o) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
});

export function createField(canvas, { reduce = false } = {}) {
  const ctx = canvas.getContext("2d");
  const cosT = new Float32Array(SEG + 1);
  const sinT = new Float32Array(SEG + 1);
  for (let j = 0; j <= SEG; j += 1) {
    cosT[j] = Math.cos((j / SEG) * TAU);
    sinT[j] = Math.sin((j / SEG) * TAU);
  }

  let w = 0;
  let h = 0;
  let dpr = 1;
  let cx = 0;
  let cy = 0;
  let R = 100;
  let noise = 0.08;
  let level = 0;
  let levelTarget = 0;
  let fade = 1;
  let ptr = null;
  let px = -9999;
  let py = -9999;
  let pk = 0;
  let shockT = -1;
  let last = 0;
  let time = 0;
  let visible = true;
  let running = false;

  function draw(now) {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    time += dt / 1000;
    level += (levelTarget - level) * Math.min(1, dt / 520);
    if (ptr) {
      px += (ptr.x - px) * 0.16;
      py += (ptr.y - py) * 0.16;
      pk += (1 - pk) * 0.07;
    } else {
      pk *= 0.93;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const vis = level * fade;
    if (vis < 0.004 && shockT < 0) return;

    const spacing = Math.max(15, Math.min(32, R * 0.1 + 12));
    const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const flow = (time * (14 + noise * 46)) % spacing;
    const amp = 1.1 + noise * 30;
    const ptrR = 200;
    const bend = 74 * pk;
    ctx.lineWidth = 1;

    for (let r0 = R + flow; r0 < reach; r0 += spacing) {
      const k = (r0 - R) / Math.max(1, reach - R);
      const birth = Math.min(1, (r0 - R) / spacing);
      const alpha = vis * birth * (1 - k) ** 1.6 * 0.44;
      if (alpha < 0.006) continue;
      const a1 = amp * (0.22 + k * 1.4);
      const ph = r0 * 0.018;
      const grit = noise > 0.25 ? (noise - 0.25) * 24 * (0.3 + k) : 0;
      ctx.beginPath();
      for (let j = 0; j <= SEG; j += 1) {
        const th = (j / SEG) * TAU;
        let r = r0 + a1 * (0.62 * Math.sin(3 * th + time * 0.7 + ph) + 0.38 * Math.sin(7 * th - time * 1.3 + ph * 1.7));
        if (grit) r += (Math.random() - 0.5) * grit;
        let x = cx + cosT[j] * r;
        let y = cy + sinT[j] * r;
        if (bend > 0.5) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < ptrR * ptrR) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / ptrR;
            const push = f * f * bend;
            x += (dx / d) * push;
            y += (dy / d) * push;
          }
        }
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = palette[Math.min(15, Math.round((k / 0.2) * 15))];
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }

    if (shockT >= 0) {
      const u = (now - shockT) / 1400;
      if (u >= 1 || u < 0) {
        if (u >= 1) shockT = -1;
      } else {
        const e = 1 - (1 - u) ** 3;
        ctx.globalAlpha = (1 - u) ** 1.4 * 0.95;
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R + e * (reach - R), 0, TAU);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function sync() {
    const should = !reduce && visible && !document.hidden && (level * fade > 0.004 || levelTarget * fade > 0.004 || shockT >= 0);
    if (should === running) return;
    running = should;
    last = 0;
    if (running) add(draw);
    else {
      remove(draw);
      draw(performance.now());
    }
  }

  document.addEventListener("visibilitychange", sync);

  return {
    resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!running) draw(performance.now());
    },
    setDisc(x, y, r) {
      cx = x;
      cy = y;
      R = Math.max(2, r);
    },
    setFade(f) {
      if (Math.abs(f - fade) < 0.001) return;
      fade = f;
      sync();
    },
    setNoise(v) {
      noise = v;
      if (!running) draw(performance.now());
    },
    setPointer(x, y) {
      ptr = { x, y };
      if (px < -9000) {
        px = x;
        py = y;
      }
    },
    clearPointer() {
      ptr = null;
    },
    setVisible(v) {
      visible = v;
      sync();
    },
    // The disc has landed: shockwave, then the rings come up.
    enter() {
      levelTarget = 1;
      shockT = performance.now();
      sync();
    },
    // No entrance (reduced motion, or the loader was not shown).
    show() {
      levelTarget = 1;
      level = 1;
      sync();
      if (!running) draw(performance.now());
    },
  };
}
