// Contact scope: a full-width input line above the form. At rest it is one
// flat hairline ("the line is open"). Every keystroke in the form pushes
// energy into it and the line jumps, then settles back to flat. When the form
// is complete it turns orange (signal ready); once sent it holds one clean
// sine: the signal, received. The travelling signal (scripts/signal.js)
// kicks it too as it crosses. Animates only while there is energy to show,
// and never under reduced motion.

import { add, remove } from "./ticker.js";

const STATES = {
  idle: "Line open. Type and we're listening.",
  live: "Receiving.",
  ready: "Signal ready. Send when you are.",
  sent: "Signal received.",
};

export function initScope() {
  const scope = document.querySelector("[data-contact-scope]");
  const form = document.querySelector("[data-contact-form]");
  if (!scope || !form) return;
  const canvas = scope.querySelector("[data-scope-canvas]");
  const label = scope.querySelector("[data-scope-state]");
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let energy = 0;
  let phase = 0;
  let ready = false;
  let sent = false;
  let running = false;

  function setState(key) {
    scope.dataset.state = key;
    if (label.textContent !== STATES[key]) label.textContent = STATES[key];
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    paint();
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const mid = Math.round(h / 2);
    const lit = sent || ready;
    ctx.lineWidth = lit ? 2 : 1;
    ctx.strokeStyle = lit ? "#ff6b00" : "rgba(216, 208, 200, 0.7)";
    ctx.beginPath();
    if (!sent && energy <= 0.002) {
      // At rest: one straight, pixel-aligned line.
      const y = lit ? mid : mid + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      return;
    }
    for (let x = 0; x <= w; x += 3) {
      const u = x / w;
      const taper = Math.sin(Math.PI * u) ** 0.6;
      let y = 0;
      if (sent) {
        y = Math.sin(u * Math.PI * 2 * Math.max(6, w / 150)) * h * 0.32 * taper;
      } else if (energy > 0.002) {
        const a = h * 0.44 * energy * taper;
        y = a * (0.55 * Math.sin(x * 0.021 + phase) + 0.3 * Math.sin(x * 0.067 - phase * 1.7) + 0.25 * (Math.random() * 2 - 1));
      }
      if (x === 0) ctx.moveTo(x, mid + y);
      else ctx.lineTo(x, mid + y);
    }
    ctx.stroke();
  }

  function loop() {
    energy *= 0.94;
    phase += 0.22;
    paint();
    if (energy <= 0.002) {
      energy = 0;
      running = false;
      remove(loop);
      paint();
      if (!sent) setState(ready ? "ready" : "idle");
    }
  }

  function kick(amount) {
    if (sent) return;
    setState(ready ? "ready" : "live");
    if (reduce) {
      paint();
      return;
    }
    energy = Math.min(1, energy + amount);
    if (!running) {
      running = true;
      add(loop);
    }
  }

  form.addEventListener("input", () => kick(0.3));
  // The page's signal crosses this line on its way to the finale.
  scope.addEventListener("signal:pass", () => kick(0.85));
  form.addEventListener("contact:ready", (event) => {
    ready = event.detail;
    if (!running) {
      paint();
      setState(ready ? "ready" : "idle");
    }
  });
  form.addEventListener("contact:sent", () => {
    sent = true;
    energy = 0;
    paint();
    setState("sent");
  });
  form.addEventListener("contact:reset", () => {
    sent = false;
    ready = false;
    energy = 0;
    paint();
    setState("idle");
  });

  let timer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(resize, 150);
  });
  resize();
  setState("idle");
}
