// Process: one line that starts as pure noise (Discover), finds a pattern
// (Plan), takes a shape (Create) and ends as one clean orange sine (Deliver).
// The path is generated for the real pixel size of the scope, horizontal on
// wide screens and running down the left edge on phones. Its ends sit on the
// centre line so the page's signal trace can plug straight into it: when the
// signal is running (scripts/signal.js) the travelling dot draws this line
// as it rides it, and each stage turns up as the dot reaches it. Without the
// signal, scrolling draws it (scrub.js) as before.

import { addScrub } from "./scrub.js";

// Shared with signal.js: the wave's geometry and a way to drive it.
export const processWave = { svg: null, points: null, vertical: false, setProgress: null, manual: false };

// Deterministic randomness so the waveform is the same on every load.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Piecewise-linear envelope over u (0–1) for the four stages.
function envelope(points, u) {
  for (let i = 1; i < points.length; i += 1) {
    if (u <= points[i][0]) {
      const [u0, v0] = points[i - 1];
      const [u1, v1] = points[i];
      return v0 + ((u - u0) / (u1 - u0)) * (v1 - v0);
    }
  }
  return points[points.length - 1][1];
}

const NOISE = [[0, 1], [0.23, 1], [0.29, 0.5], [0.48, 0.46], [0.54, 0.16], [0.73, 0.12], [0.79, 0], [1, 0]];
const SIGNAL = [[0, 0.1], [0.23, 0.12], [0.29, 0.3], [0.48, 0.34], [0.54, 0.58], [0.73, 0.6], [0.79, 0.86], [1, 0.86]];

// Returns the path and a table of how much of its length has been used by
// each point along the axis: the noisy stretch is far longer per pixel than
// the clean one, so drawing "to x" has to be mapped through it.
function buildPath(length, amp, mid, vertical, wavelength) {
  const rand = mulberry32(2023);
  let n = 0;
  let run = 0;
  let prev = null;
  const pts = [];
  const table = [];
  const raw = [];
  for (let t = 0; t <= length; t += 3) {
    const u = t / length;
    n = n * 0.3 + (rand() * 2 - 1) * 0.7;
    // Taper both ends onto the centre line, where the trace joins.
    const taper = Math.min(1, t / 30, (length - t) / 30);
    const offset = taper * amp * (envelope(NOISE, u) * n + envelope(SIGNAL, u) * Math.sin((t / wavelength) * Math.PI * 2));
    const y = mid - offset;
    if (prev) run += Math.hypot(t - prev[0], y - prev[1]);
    prev = [t, y];
    table.push([u, run]);
    pts.push(vertical ? `${y.toFixed(1)} ${t.toFixed(1)}` : `${t.toFixed(1)} ${y.toFixed(1)}`);
    raw.push(vertical ? [y, t] : [t, y]);
  }
  table.forEach((row) => (row[1] /= run || 1));
  return { d: `M${pts.join("L")}`, table, raw };
}

function lengthAt(table, u) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const i = Math.min(table.length - 1, Math.max(1, Math.ceil(u * (table.length - 1))));
  const [u0, l0] = table[i - 1];
  const [u1, l1] = table[i];
  return l0 + ((u - u0) / (u1 - u0 || 1)) * (l1 - l0);
}

export function initProcess() {
  const scope = document.querySelector("[data-process]");
  if (!scope) return;
  const svg = scope.querySelector("[data-process-wave]");
  const path = scope.querySelector("[data-process-path]");
  const ghost = scope.querySelector("[data-process-ghost]");
  const grad = scope.querySelector("[data-process-grad]");
  const steps = [...scope.querySelectorAll("[data-process-step]")];
  let size = "";
  let table = [[0, 0], [1, 1]];
  let progress = 0;

  function paint() {
    path.style.strokeDashoffset = (1 - lengthAt(table, progress)).toFixed(4);
    steps.forEach((step, i) => {
      const s = Math.min(1, Math.max(0, (progress - i * 0.25 - 0.02) / 0.12));
      step.style.setProperty("--s", s.toFixed(3));
    });
  }

  function draw() {
    const box = svg.getBoundingClientRect();
    const w = Math.round(box.width);
    const h = Math.round(box.height);
    const key = `${w}x${h}`;
    if (!w || !h || key === size) return;
    size = key;
    const vertical = h > w;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const built = vertical
      ? buildPath(h, w * 0.4, w / 2, true, 64)
      : buildPath(w, h * 0.42, h / 2, false, Math.max(70, w / 18));
    table = built.table;
    processWave.points = built.raw;
    processWave.vertical = vertical;
    path.setAttribute("d", built.d);
    ghost.setAttribute("d", built.d);
    paint();
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", "0");
    grad.setAttribute("x2", vertical ? "0" : String(w));
    grad.setAttribute("y2", vertical ? String(h) : "0");
  }

  processWave.svg = svg;
  processWave.setProgress = (p) => {
    processWave.manual = true;
    progress = p;
    paint();
  };

  draw();
  let timer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(draw, 150);
  });
  if (document.fonts) document.fonts.ready.then(draw);

  addScrub(scope, "draw", (p) => {
    if (processWave.manual) return;
    progress = p;
    paint();
  });
}
