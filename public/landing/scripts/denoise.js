// Denoise: a project print tunes in from static. The print is covered by a
// grid of static cells coloured from the photo itself (so the static is the
// picture, detuned); when the signal reaches it, the cells lock on in a
// wave from the contact point, with a bright edge where the picture is
// arriving. Once tuned, a print stays clean: nothing plays over it on hover.
// Runs on the particle engine (one loop, canvases only while on screen).
// The photo underneath is always the real, sharp <img>.

import { engine, clamp01 } from "./particles.js";

const DUR = 650;

// Prints tune in as soon as they come on screen:
// the work is the proof, it should never sit as static for long. If the
// signal's branch reaches a print first, it tunes in from that point.
let early = null;
const byFrame = new Map();
function observeEarly(scene) {
  if (!early) {
    early = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && byFrame.get(e.target)?.trigger(null)),
      { rootMargin: "0px 0px -6% 0px" },
    );
  }
  byFrame.set(scene.host, scene);
  early.observe(scene.host);
}

export class Denoise {
  constructor(frame, { onTune } = {}) {
    this.host = frame;
    this.img = frame.querySelector("img");
    this.state = "wait";
    this.maxDpr = 1;
    this.useBand = false;
    this.onTune = onTune;
    frame.classList.add("fx-host", "fx-static");
    if (this.img && !this.img.complete) this.img.addEventListener("load", () => this.box && this.sample(), { once: true });
    engine.add(this);
    observeEarly(this);
  }

  padding() {
    return { t: 0, b: 0, l: 0, r: 0 };
  }

  mount() {
    const b = this.box;
    const cell = window.innerWidth < 768 ? 7 : 6;
    this.cols = Math.max(4, Math.ceil(b.w / cell));
    this.rows = Math.max(4, Math.ceil(b.h / cell));
    const n = this.cols * this.rows;
    this.small = this.small || document.createElement("canvas");
    this.small.width = this.cols;
    this.small.height = this.rows;
    this.sctx = this.small.getContext("2d", { willReadFrequently: true });
    this.data = this.sctx.createImageData(this.cols, this.rows);
    this.photo = new Uint8ClampedArray(n * 3);
    this.th = new Float32Array(n);
    for (let i = 0; i < n; i += 1) this.th[i] = Math.random();
    this.sample();
    this.frameN = 0;
    if (this.pendingOrigin !== undefined && this.state === "wait") this.trigger(this.pendingOrigin);
  }

  unmount() {
    if (this.state !== "done") this.finish();
  }

  fail() {
    this.finish();
  }

  // The photo's colours, cropped exactly as the frame shows it (cover + position).
  sample() {
    const img = this.img;
    const n = this.cols * this.rows;
    if (!img || !img.complete || !img.naturalWidth) {
      for (let i = 0; i < n * 3; i += 1) this.photo[i] = 40;
      return;
    }
    const b = this.box;
    const cs = getComputedStyle(img);
    const [px, py] = cs.objectPosition.split(" ").map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
    const k = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight);
    const dw = img.naturalWidth * k;
    const dh = img.naturalHeight * k;
    const offX = (b.w - dw) * (Number.isFinite(px) ? px : 0.5);
    const offY = (b.h - dh) * (Number.isFinite(py) ? py : 0.5);
    try {
      this.sctx.drawImage(img, -offX / k, -offY / k, b.w / k, b.h / k, 0, 0, this.cols, this.rows);
      const src = this.sctx.getImageData(0, 0, this.cols, this.rows).data;
      for (let i = 0; i < n; i += 1) {
        this.photo[i * 3] = src[i * 4];
        this.photo[i * 3 + 1] = src[i * 4 + 1];
        this.photo[i * 3 + 2] = src[i * 4 + 2];
      }
    } catch (error) {
      for (let i = 0; i < n * 3; i += 1) this.photo[i] = 40;
    }
  }

  // origin in document px (the branch's contact point) or null (left edge).
  trigger(origin = null) {
    if (this.state !== "wait") return;
    if (!engine.isMounted(this)) {
      this.pendingOrigin = origin;
      return;
    }
    const b = this.box;
    const ox = origin ? (origin.x - b.docLeft) / b.w : 0;
    const oy = origin ? (origin.y - b.docTop) / b.h : 0.5;
    const { cols, rows, th } = this;
    const aspect = b.h / b.w;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const i = r * cols + c;
        const d = Math.hypot(c / cols - ox, (r / rows - oy) * aspect) / 1.15;
        th[i] = clamp01(d * 0.72 + Math.random() * 0.28);
      }
    }
    this.state = "tune";
    this.t0 = performance.now();
    this.host.classList.add("is-tuned");
    if (this.onTune) this.onTune();
    engine.wake();
  }

  fallback() {
    this.trigger(null);
  }

  finish() {
    this.state = "done";
    this.host.classList.remove("fx-static");
    this.host.classList.add("is-tuned");
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  paint(p) {
    const { cols, rows, th, photo } = this;
    const d = this.data.data;
    const n = cols * rows;
    for (let i = 0; i < n; i += 1) {
      const o = i * 4;
      const t = th[i];
      if (t < p) {
        d[o + 3] = 0;
        continue;
      }
      const g = Math.random() * 255;
      const edge = t - p < 0.05;
      if (edge && Math.random() < 0.22) {
        d[o] = 255;
        d[o + 1] = 107;
        d[o + 2] = 0;
      } else {
        const m = edge ? 0.25 : 0.62;
        d[o] = photo[i * 3] * (1 - m) + g * m;
        d[o + 1] = photo[i * 3 + 1] * (1 - m) + g * m;
        d[o + 2] = photo[i * 3 + 2] * (1 - m) + g * m;
      }
      d[o + 3] = 255;
    }
    this.sctx.putImageData(this.data, 0, 0);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.box.w, this.box.h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.small, 0, 0, this.box.w, this.box.h);
  }

  frame(now) {
    this.frameN += 1;
    if (this.state === "wait") {
      if (this.frameN % 3 === 1) this.paint(-1);
      return true;
    }
    if (this.state === "tune") {
      const p = clamp01((now - this.t0) / DUR);
      this.paint(p * 1.08 - 0.04);
      if (p >= 1) this.finish();
      return true;
    }
    return false;
  }
}
