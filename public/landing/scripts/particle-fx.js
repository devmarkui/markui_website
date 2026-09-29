// Scene treatments on the particle engine (particles.js). One vocabulary,
// varied per section: every text scene starts as static (its homes), tunes
// in to the live type (its targets) and hands over to the real DOM text,
// which is always present underneath. Afterwards it keeps a noise floor of
// dust (louder with the Noise fader) and, on hover or touch, the word under
// the pointer detunes back into particles that part around it.
//
// TuneText options:
//   home   field | band | columns | rain | scan | noise   (what the static looks like)
//   order  origin | ltr | ttb | chars | release           (how the signal sweeps it)
//   bandAt top | bottom (for home: band)                  where the scanline sits
//   split  word | char
//   source element whose text is sampled (the canvas host may be an ancestor)

import { engine, sampleText, wrapWords, createSwarm, bucket, spread, density, grain, easeOut3 } from "./particles.js";

const HAND_MS = 380;
const fine = window.matchMedia("(pointer: fine)").matches;

export class TuneText {
  constructor(host, o = {}) {
    this.o = {
      home: "field", order: "origin", bandAt: "bottom", split: "word", travel: 820, spread: 560,
      max: 2200, dust: 120, interactive: true, waitMax: 2600, useBand: true, charStep: 220, ...o,
    };
    this.host = host;
    this.source = o.source || host;
    this.useBand = this.o.useBand;
    this.words = wrapWords(this.source, this.o.split);
    this.state = "wait";
    this.sw = null;
    this.pointer = null;
    this.relIdx = 0;
    this.lastRel = 0;
    host.classList.add("fx-host");
    this.source.classList.add("fx-wait");
    if (this.o.interactive) this.listen();
    engine.add(this);
  }

  padding(r) {
    const v = Math.max(28, Math.min(160, r.height * 0.45));
    const b = this.o.home === "band" && this.o.bandAt === "bottom" ? Math.max(v, this.o.bandGap || 0) + 20 : v;
    const t = this.o.home === "rain" ? Math.max(v, 90) : this.o.home === "band" && this.o.bandAt === "top" ? Math.max(v, this.o.bandGap || 0) + 20 : v;
    return { t, b, l: 56, r: 56 };
  }

  mount() {
    this.visT = 0;
    this.last = 0;
    this.frameN = 0;
    this.build();
    if (this.pendingOrigin !== undefined && this.state === "wait") this.trigger(this.pendingOrigin);
  }

  unmount() {
    // Leaving the screen mid-tune: jump to the resolved state.
    if (this.state === "wait" || this.state === "tune" || this.state === "hand") this.reveal();
    this.words.forEach((w) => w.classList.remove("fx-off"));
    this.active = null;
  }

  fail() {
    this.reveal();
  }

  build() {
    const b = this.box;
    const s = sampleText(this.words, b, { max: Math.round(this.o.max * density()), minStep: window.innerWidth < 768 ? 2 : 1.5 });
    const n = s.n;
    const sw = createSwarm(n);
    sw.tx.set(s.x);
    sw.ty.set(s.y);
    sw.word.set(s.word);
    sw.col.set(s.col);
    this.palette = s.palette;
    this.rects = s.rects;
    this.size = this.o.size || Math.max(grain(), Math.min(3.4, s.step * 0.55));
    this.byCol = bucket(sw.col, s.palette.length);
    this.byWord = bucket(sw.word, this.words.length);
    this.homes(sw);
    if (this.state !== "wait") sw.st.fill(0);
    this.sw = sw;
    // Release order (for scroll-driven release): particles sorted by x.
    this.orderX = Int32Array.from([...Array(n).keys()].sort((a, c) => sw.tx[a] - sw.tx[c]));
    // The noise floor: a little dust that hangs around the type.
    const nd = Math.round(this.o.dust * density());
    const dust = createSwarm(nd);
    for (let i = 0; i < nd; i += 1) {
      dust.hx[i] = Math.random() * b.w;
      dust.hy[i] = b.padT + b.srcH / 2 + spread(b.srcH * 0.9 + 30);
    }
    this.dust = dust;
    this.active = new Map();
  }

  homes(sw) {
    const { w, h, padT, srcH } = this.box;
    const o = this.o;
    const lineY = o.bandAt === "top" ? padT - (o.bandGap || 16) : padT + srcH + (o.bandGap || 16);
    for (let i = 0; i < sw.n; i += 1) {
      const tx = sw.tx[i];
      const ty = sw.ty[i];
      const r = sw.seed[i];
      let x;
      let y;
      if (o.home === "band") {
        x = tx + spread(w * 0.06);
        y = lineY + spread(2.5);
      } else if (o.home === "columns") {
        x = Math.round(tx / 11) * 11 + spread(1.2);
        y = Math.random() * h;
      } else if (o.home === "rain") {
        x = tx + spread(14);
        y = ty - 40 - Math.random() * Math.min(h * 0.7, 260);
      } else if (o.home === "scan") {
        x = Math.random() * w;
        y = Math.round(ty / 7) * 7 + spread(1);
      } else if (o.home === "noise") {
        const k = 1 - tx / w;
        x = tx + spread(30 + 60 * k);
        y = padT + srcH / 2 + spread(srcH * (0.25 + 0.9 * k));
      } else if (r < 0.62) {
        x = tx + spread(srcH * 0.7);
        y = ty + spread(srcH * 0.45);
      } else {
        x = Math.random() * w;
        y = padT + srcH / 2 + spread(srcH * 0.9);
      }
      sw.hx[i] = Math.max(0, Math.min(w, x));
      sw.hy[i] = Math.max(0, Math.min(h, y));
    }
  }

  // Tune in. origin = the point the signal arrived at (document px) or null.
  trigger(origin = null) {
    if (this.state !== "wait") return;
    if (!engine.isMounted(this) || !this.sw) {
      this.pendingOrigin = origin;
      return;
    }
    const sw = this.sw;
    const b = this.box;
    const now = performance.now();
    const o = this.o;
    let ox = b.padL - 20;
    let oy = b.padT + b.srcH / 2;
    if (origin) {
      ox = origin.x - b.docLeft;
      oy = origin.y - b.docTop;
    }
    const diag = Math.hypot(b.w, b.h) || 1;
    for (let i = 0; i < sw.n; i += 1) {
      let d;
      if (o.order === "ltr") d = sw.tx[i] / b.w;
      else if (o.order === "ttb") d = (sw.ty[i] - b.padT) / Math.max(1, b.srcH);
      else if (o.order === "chars") d = (sw.word[i] * o.charStep) / o.spread;
      else if (o.order === "release") continue;
      else d = Math.hypot(sw.tx[i] - ox, sw.ty[i] - oy) / diag;
      sw.st[i] = now + d * o.spread + Math.random() * o.spread * 0.3;
    }
    this.state = o.order === "release" ? "release" : "tune";
    this.t0 = now;
    if (this.onTrigger) this.onTrigger();
    engine.wake();
  }

  // Scroll-driven release (the Voices sweep): everything left of x tunes in.
  release(docX) {
    if (this.state === "wait") this.trigger(null);
    if (this.state !== "release" || !this.sw) return;
    const x = docX - this.box.docLeft;
    const sw = this.sw;
    const now = performance.now();
    while (this.relIdx < sw.n && sw.tx[this.orderX[this.relIdx]] <= x) {
      sw.st[this.orderX[this.relIdx]] = now + Math.random() * 140;
      this.relIdx += 1;
    }
    this.lastRel = now;
    engine.wake();
  }

  fallback() {
    if (this.o.order === "release") {
      if (this.state === "wait") this.trigger(null);
      return;
    }
    this.trigger(null);
  }

  reveal() {
    if (this.state === "idle") return;
    this.state = "idle";
    this.source.classList.remove("fx-wait");
    this.source.classList.add("fx-in");
    if (this.onReveal) this.onReveal();
  }

  onNoise() {}

  listen() {
    const move = (e) => {
      if (e.pointerType === "mouse" && !fine) return;
      if (!this.box) return;
      const c = this.canvas;
      if (!c) return;
      const r = c.getBoundingClientRect();
      this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      engine.wake();
    };
    const out = () => {
      this.pointer = null;
      engine.wake();
    };
    this.source.addEventListener("pointermove", move);
    this.source.addEventListener("pointerdown", move);
    this.source.addEventListener("pointerleave", out);
    this.source.addEventListener("pointercancel", out);
    this.source.addEventListener("pointerup", (e) => e.pointerType !== "mouse" && out());
  }

  frame(now) {
    if (!this.sw) return false;
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    this.frameN += 1;
    const ctx = this.ctx;
    const b = this.box;
    const st = this.state;
    if (st === "idle" && this.stillAt === engine.noise && !this.pointer && !(this.active && this.active.size)) return false;
    if (st === "wait" || st === "release") {
      const top = b.docTop + b.padT - window.scrollY;
      if (top < window.innerHeight * 0.94 && top + b.srcH > 0) this.visT += dt;
      if (this.visT > this.o.waitMax && (st === "wait" || now - this.lastRel > 1400)) {
        if (st === "wait") this.trigger(null);
        if (this.state === "release") this.release(Infinity);
      }
      // Waiting static flickers at ~20 fps; it is noise, it should look like it.
      if (st === "wait" && this.frameN % 3 !== 1) return true;
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, b.w, b.h);
    if (st === "wait" || st === "tune" || st === "release") return this.drawTune(ctx, now);
    if (st === "hand") return this.drawHand(ctx, now);
    return this.drawIdle(ctx, now, dt);
  }

  drawTune(ctx, now) {
    const sw = this.sw;
    const s = this.size;
    const travel = this.o.travel;
    const jit = 3 + engine.noise * 14;
    let done = this.state !== "wait";
    let maxEnd = 0;
    for (let c = 0; c < this.byCol.length; c += 1) {
      const idx = this.byCol[c];
      ctx.fillStyle = this.palette[c];
      // Static first (dim, flickering), then the ones on their way in.
      ctx.globalAlpha = 0.34 + Math.random() * 0.22;
      for (let k = 0; k < idx.length; k += 1) {
        const i = idx[k];
        const t0 = sw.st[i];
        if (t0 >= 0 && now >= t0) continue;
        done = false;
        if (sw.seed[i] > 0.62) continue;
        ctx.fillRect(sw.hx[i] + (Math.random() - 0.5) * jit, sw.hy[i] + (Math.random() - 0.5) * jit, s, s);
      }
      ctx.globalAlpha = 0.95;
      for (let k = 0; k < idx.length; k += 1) {
        const i = idx[k];
        const t0 = sw.st[i];
        if (t0 < 0 || now < t0) continue;
        const u = Math.min(1, (now - t0) / travel);
        if (t0 + travel > maxEnd) maxEnd = t0 + travel;
        const e = easeOut3(u);
        const j = 1 - e;
        const amp = j > 0.02 ? 1.5 + 26 * j * j : 0;
        ctx.fillRect(
          sw.hx[i] + (sw.tx[i] - sw.hx[i]) * e + (Math.random() - 0.5) * amp,
          sw.hy[i] + (sw.ty[i] - sw.hy[i]) * e + (Math.random() - 0.5) * amp,
          s,
          s,
        );
      }
    }
    ctx.globalAlpha = 1;
    if (done && now >= maxEnd) {
      this.state = "hand";
      this.handT = now;
      this.reveal();
      this.state = "hand";
    }
    return true;
  }

  drawHand(ctx, now) {
    const u = (now - this.handT) / HAND_MS;
    if (u >= 1) {
      this.state = "idle";
      return this.drawIdle(ctx, now, 16);
    }
    const sw = this.sw;
    const s = this.size;
    ctx.globalAlpha = (1 - u) ** 1.5 * 0.95;
    for (let c = 0; c < this.byCol.length; c += 1) {
      ctx.fillStyle = this.palette[c];
      const idx = this.byCol[c];
      for (let k = 0; k < idx.length; k += 1) ctx.fillRect(sw.tx[idx[k]], sw.ty[idx[k]], s, s);
    }
    ctx.globalAlpha = 1;
    this.drawDust(ctx, now, u);
    return true;
  }

  drawDust(ctx, now, fadeIn = 1) {
    const d = this.dust;
    if (!d || !d.n) return;
    const nz = engine.noise;
    const frac = 0.14 + nz * 0.46;
    const jit = 0.6 + nz * 5;
    const t = now * 0.00045;
    ctx.fillStyle = this.palette[this.palette.length > 1 ? 1 : 0];
    ctx.globalAlpha = (0.28 + nz * 0.3) * fadeIn;
    const s = this.size;
    for (let i = 0; i < d.n; i += 1) {
      const r = d.seed[i];
      if (r > frac) continue;
      const x = d.hx[i] + Math.sin(t * (0.6 + r) + r * 40) * (8 + nz * 16) + (Math.random() - 0.5) * jit;
      const y = d.hy[i] + Math.cos(t * (0.8 + r) + r * 70) * (5 + nz * 10) + (Math.random() - 0.5) * jit;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  drawIdle(ctx, now) {
    const nz = engine.noise;
    const interacting = this.pointer || (this.active && this.active.size);
    // Clean and untouched: the dust settles and the canvas stops redrawing
    // (it wakes again on hover, touch or a noise change).
    if (!interacting && nz < 0.15) {
      if (this.stillAt === nz) return false;
      this.stillAt = nz;
      this.drawDust(ctx, now);
      return false;
    }
    this.stillAt = -1;
    if (!interacting && this.frameN % 2 !== 0) return true;
    this.drawDust(ctx, now);
    if (this.o.interactive) this.drawDetune(ctx);
    return true;
  }

  // The word under the pointer turns back into particles that part around it.
  drawDetune(ctx) {
    const sw = this.sw;
    const p = this.pointer;
    const R = Math.max(70, Math.min(150, this.box.srcH * 0.8));
    this.rects.forEach((r, wi) => {
      const near = p && p.x > r.x - 30 && p.x < r.x + r.w + 30 && p.y > r.y - 30 && p.y < r.y + r.h + 30;
      if (near && !this.active.has(wi)) {
        this.active.set(wi, true);
        this.words[wi].classList.add("fx-off");
      } else if (!near && this.active.get(wi) === true) this.active.set(wi, false);
    });
    const s = this.size;
    const jit = engine.noise * 3;
    this.active.forEach((on, wi) => {
      const idx = this.byWord[wi];
      let energy = 0;
      ctx.fillStyle = this.palette[sw.col[idx[0]] || 0];
      ctx.globalAlpha = 0.95;
      for (let k = 0; k < idx.length; k += 1) {
        const i = idx[k];
        const x = sw.tx[i] + sw.ox[i];
        const y = sw.ty[i] + sw.oy[i];
        if (on && p) {
          const dx = x - p.x;
          const dy = y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) ** 2 * 3.2;
            sw.vx[i] += (dx / d) * f;
            sw.vy[i] += (dy / d) * f;
          }
        }
        sw.vx[i] = (sw.vx[i] - sw.ox[i] * 0.07) * 0.84;
        sw.vy[i] = (sw.vy[i] - sw.oy[i] * 0.07) * 0.84;
        sw.ox[i] += sw.vx[i];
        sw.oy[i] += sw.vy[i];
        energy += Math.abs(sw.ox[i]) + Math.abs(sw.oy[i]);
        ctx.fillRect(x + (Math.random() - 0.5) * jit, y + (Math.random() - 0.5) * jit, s, s);
      }
      if (!on && energy / idx.length < 0.25) {
        for (let k = 0; k < idx.length; k += 1) {
          sw.ox[idx[k]] = sw.oy[idx[k]] = sw.vx[idx[k]] = sw.vy[idx[k]] = 0;
        }
        this.words[wi].classList.remove("fx-off");
        this.active.delete(wi);
      }
    });
    ctx.globalAlpha = 1;
  }
}
