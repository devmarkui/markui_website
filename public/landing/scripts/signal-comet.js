// The dot's comet: as the signal travels it sheds static (square grains
// that drift back along its path and fade), and it stretches along its
// direction of travel with speed, settling round when the page stops. With
// the Noise fader up, it fizzes with static even at rest (the trace's
// shimmer). One small canvas that rides with the dot; one shared loop.
//
//   comet.move(x, y, ground)  the dot's new position (document px)
//   comet.hide(hidden)        in the hero, or docked: no dot, no comet
//   comet.setNoise(v)

import { add, remove } from "./ticker.js";

const SIZE = 300;
const CAP = 520;

export function createComet(layer, dot) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "signal-comet";
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  layer.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const px = new Float32Array(CAP);
  const py = new Float32Array(CAP);
  const vx = new Float32Array(CAP);
  const vy = new Float32Array(CAP);
  const t0 = new Float32Array(CAP).fill(-1);
  const life = new Float32Array(CAP);
  let head = 0;
  let x = 0;
  let y = 0;
  let lx = null;
  let ly = null;
  let speed = 0;
  let angle = 90;
  let hidden = true;
  let noise = 0.05;
  let color = "#ff6b00";
  let running = false;
  let lastT = 0;
  let placed = "";

  function emit(ex, ey, dx, dy, n) {
    const now = performance.now();
    const len = Math.hypot(dx, dy) || 1;
    for (let k = 0; k < n; k += 1) {
      const i = head;
      head = (head + 1) % CAP;
      const u = Math.random();
      px[i] = ex - dx * u + (Math.random() - 0.5) * 4;
      py[i] = ey - dy * u + (Math.random() - 0.5) * 4;
      const back = 0.25 + Math.random() * 0.9;
      vx[i] = (-dx / len) * back + (Math.random() - 0.5) * 1.3;
      vy[i] = (-dy / len) * back + (Math.random() - 0.5) * 1.3;
      t0[i] = now;
      life[i] = 360 + Math.random() * 520;
    }
  }

  function writeDot() {
    const k = Math.min(1.9, 1 + speed * 0.045);
    const key = `${x.toFixed(1)}|${y.toFixed(1)}|${k.toFixed(2)}|${angle.toFixed(0)}`;
    if (key === placed) return;
    placed = key;
    dot.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${k.toFixed(3)} ${(1 / Math.sqrt(k)).toFixed(3)})`);
  }

  function frame(now) {
    const dt = lastT ? Math.min(50, now - lastT) : 16;
    lastT = now;
    speed *= 0.86 ** (dt / 16);
    if (!hidden && noise > 0.35 && Math.random() < noise * 0.5) emit(x, y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 1);
    writeDot();
    canvas.style.transform = `translate(${(x - SIZE / 2).toFixed(1)}px, ${(y - SIZE / 2).toFixed(1)}px)`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    const ox = x - SIZE / 2;
    const oy = y - SIZE / 2;
    let live = false;
    ctx.fillStyle = color;
    for (let i = 0; i < CAP; i += 1) {
      if (t0[i] < 0) continue;
      const age = (now - t0[i]) / life[i];
      if (age >= 1) {
        t0[i] = -1;
        continue;
      }
      live = true;
      vx[i] *= 0.955;
      vy[i] *= 0.955;
      px[i] += vx[i] + (Math.random() - 0.5) * noise * 2.4;
      py[i] += vy[i] + (Math.random() - 0.5) * noise * 2.4;
      ctx.globalAlpha = (1 - age) ** 1.4 * 0.9;
      const s = age < 0.3 ? 2.2 : 1.6;
      ctx.fillRect(px[i] - ox, py[i] - oy, s, s);
    }
    ctx.globalAlpha = 1;
    if (!live && speed < 0.05 && (hidden || noise <= 0.35)) {
      running = false;
      remove(frame);
      lastT = 0;
    }
  }

  function wake() {
    if (running || reduce) return;
    running = true;
    add(frame);
  }

  return {
    move(nx, ny, ground) {
      color = ground === "orange" ? "#15110e" : "#ff6b00";
      if (reduce) {
        x = nx;
        y = ny;
        writeDot();
        return;
      }
      if (lx !== null && !hidden) {
        const dx = nx - lx;
        const dy = ny - ly;
        const d = Math.hypot(dx, dy);
        if (d > 0.3) {
          speed = Math.min(60, speed * 0.5 + d * 0.5);
          angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (d < 400) emit(nx, ny, dx, dy, Math.min(16, Math.ceil(d * 0.22)));
        }
      }
      x = nx;
      y = ny;
      lx = nx;
      ly = ny;
      wake();
    },
    hide(h) {
      hidden = h;
      canvas.style.visibility = h ? "hidden" : "visible";
      if (h) lx = ly = null;
    },
    setNoise(v) {
      noise = v;
      if (v > 0.35) wake();
    },
  };
}
