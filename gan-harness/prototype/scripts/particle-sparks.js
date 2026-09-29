// Sparks, on the particle engine (particles.js).

import { engine, createSwarm, spread } from "./particles.js";

// Sparks: short-lived static thrown off a point (the Why knob's pointer, the
// signal's arrival). Gravity-free, dragged, fading. Idle: a slow orbit of
// static around the host whose density is the Noise level.
export class Sparks {
  constructor(host, { color = "#ff6b00", ring = 0.5, pad = 70 } = {}) {
    this.host = host;
    this.color = color;
    this.ring = ring;
    this.padPx = pad;
    this.cap = 420;
    this.p = createSwarm(this.cap);
    this.p.st.fill(-1);
    this.count = 0;
    engine.add(this);
  }

  padding() {
    return { t: this.padPx, b: this.padPx, l: this.padPx, r: this.padPx };
  }

  mount() {}

  unmount() {}

  fallback() {}

  // Burst from an angle on the host's rim (radians, 0 = 3 o'clock).
  burst(angle, n = 70) {
    if (!this.box) return;
    const b = this.box;
    const cx = b.padL + b.srcW / 2;
    const cy = b.padT + b.srcH / 2;
    const R = (b.srcW / 2) * this.ring * 2;
    const now = performance.now();
    const p = this.p;
    for (let k = 0; k < n; k += 1) {
      const i = this.count++ % this.cap;
      const a = angle + spread(0.5);
      const sp = 1.4 + Math.random() * 4.2;
      p.hx[i] = cx + Math.cos(a) * R;
      p.hy[i] = cy + Math.sin(a) * R;
      p.vx[i] = Math.cos(a) * sp + spread(1);
      p.vy[i] = Math.sin(a) * sp + spread(1);
      p.st[i] = now;
      p.tx[i] = 500 + Math.random() * 700;
    }
    this.hot = true;
    engine.wake();
  }

  frame(now) {
    this.frameN = (this.frameN || 0) + 1;
    // Nothing in flight: the orbit only needs ~20 fps.
    if (!this.hot && this.frameN % 3 !== 0) return true;
    const b = this.box;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, b.w, b.h);
    const p = this.p;
    let live = false;
    ctx.fillStyle = this.color;
    for (let i = 0; i < this.cap; i += 1) {
      if (p.st[i] < 0) continue;
      const age = (now - p.st[i]) / p.tx[i];
      if (age >= 1) {
        p.st[i] = -1;
        continue;
      }
      live = true;
      p.vx[i] *= 0.95;
      p.vy[i] *= 0.95;
      p.hx[i] += p.vx[i];
      p.hy[i] += p.vy[i];
      ctx.globalAlpha = (1 - age) ** 1.3;
      ctx.fillRect(p.hx[i], p.hy[i], 2, 2);
    }
    // Orbiting noise floor.
    const nz = engine.noise;
    const n = Math.round(24 + nz * 160);
    const cx = b.padL + b.srcW / 2;
    const cy = b.padT + b.srcH / 2;
    const R = b.srcW / 2;
    const t = now * 0.00012;
    ctx.fillStyle = "#d8d0c8";
    ctx.globalAlpha = 0.22 + nz * 0.45;
    for (let k = 0; k < n; k += 1) {
      const a = (k / n) * Math.PI * 2 + t * (1 + (k % 3)) + Math.sin(k * 12.9) * 0.4;
      const rr = R * (1.06 + ((k * 0.618) % 1) * 0.16) + (Math.random() - 0.5) * (1 + nz * 10);
      ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
    this.hot = live;
    return true;
  }
}
