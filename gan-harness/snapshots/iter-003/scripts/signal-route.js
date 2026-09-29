// Signal route: pure geometry. Takes a measurement of the page (see
// measure() in signal.js) and returns:
//   - the hero route (stage coordinates) and the page route (document
//     coordinates) as SVG path data, split into short chunks,
//   - the branches that feed each channel meter and section LED,
//   - one timeline of samples: where the dot is (x, y), at which scroll
//     position it gets there (s), and how much of each path is lit then.
// The timeline is built once per layout, so scrolling only ever does a
// binary search and a few writes.
//
// How scroll maps to the route: on desktop the hero is pinned, so the
// shrink and the run along the desk get their own stretch of scroll. After
// that the dot rides an anchor line in the viewport (a bit below centre). It
// runs ahead of the anchor into the Process wave and rides it across the
// screen, rises on horizontal crossings and catches up on the verticals,
// and drops towards the finale so it docks before the page runs out.

const STEP = 6;
const K_H = 0.4;
const DECAY = 0.45;
const A_IN = 0.76;
const A_OUT = 0.32;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smooth = (t) => t * t * (3 - 2 * t);
const ease = (t) => 0.62 * t + 0.38 * smooth(t);

function densify(out, a, b) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP));
  for (let k = 1; k <= n; k += 1) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
}

// A polyline through `verts` with rounded corners. Returns the dense points
// (motion) and the sparse points (drawing); both describe the same shape.
function rounded(verts, radius) {
  const dense = [verts[0]];
  const draw = [verts[0]];
  let prev = verts[0];
  for (let i = 1; i < verts.length; i += 1) {
    const v = verts[i];
    const next = verts[i + 1];
    const lin = Math.hypot(v[0] - prev[0], v[1] - prev[1]);
    if (!next || lin < 0.5) {
      if (lin >= 0.5) {
        densify(dense, prev, v);
        draw.push(v);
        prev = v;
      }
      continue;
    }
    const lout = Math.hypot(next[0] - v[0], next[1] - v[1]);
    const r = Math.min(radius, lin * 0.5, lout * 0.5);
    const p0 = [v[0] - ((v[0] - prev[0]) / lin) * r, v[1] - ((v[1] - prev[1]) / lin) * r];
    const p2 = [v[0] + ((next[0] - v[0]) / (lout || 1)) * r, v[1] + ((next[1] - v[1]) / (lout || 1)) * r];
    densify(dense, prev, p0);
    draw.push(p0);
    for (let k = 1; k <= 10; k += 1) {
      const t = k / 10;
      const q = [
        (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * v[0] + t * t * p2[0],
        (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * v[1] + t * t * p2[1],
      ];
      dense.push(q);
      draw.push(q);
    }
    prev = p2;
  }
  return { dense, draw };
}

const toD = (pts) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}`;

function lengthOf(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i += 1) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

// Split a drawn polyline into chunks of about `size` px so a scroll frame
// only repaints the chunk the dot is in.
function chunk(draw, l0, size) {
  const out = [];
  let cur = [draw[0]];
  let start = l0;
  let run = l0;
  for (let i = 1; i < draw.length; i += 1) {
    run += Math.hypot(draw[i][0] - draw[i - 1][0], draw[i][1] - draw[i - 1][1]);
    cur.push(draw[i]);
    if (run - start >= size && i < draw.length - 1) {
      out.push({ d: toD(cur), l0: start, len: run - start });
      cur = [draw[i]];
      start = run;
    }
  }
  if (cur.length > 1) out.push({ d: toD(cur), l0: start, len: run - start });
  return out;
}

export function buildRoute(m) {
  const { vh, hero } = m;
  const disc = hero.disc;
  const gH = hero.gutter;
  const R = m.desktop ? 36 : 26;

  // Hero route -------------------------------------------------------------
  // Desktop: the disc drains down into its lowest point and the route drops
  // from there, so it never runs behind the headline crossing the disc.
  let verts;
  if (m.desktop) {
    const base = disc.y + disc.d / 2 - m.dotD / 2;
    verts = [[disc.x, base], [disc.x, hero.ruleY], [gH, hero.ruleY], [gH, hero.stageH]];
  } else {
    const gx = hero.stageW - gH;
    verts = [[disc.x, disc.y], [gx, disc.y], [gx, hero.ruleY], [gH, hero.ruleY], [gH, hero.stageH]];
  }
  const heroPath = rounded(verts, R);
  const heroPts = heroPath.dense;
  const heroLen = lengthOf(heroPts);

  // End of the part of the hero route that has its own scroll stretch: the
  // corner into the margin (desktop, pinned) or the right margin (phone).
  const cornerY = m.desktop ? hero.ruleY + 4 : disc.y + 4;
  let fixedEnd = heroPts.findIndex((p, i) => i > 0 && (m.desktop ? p[0] <= gH + 0.5 && p[1] >= cornerY : p[0] >= hero.stageW - gH - 0.5 && p[1] >= cornerY));
  if (fixedEnd < 0) fixedEnd = 0;
  if (m.desktop && !m.pinned) fixedEnd = 0;

  // Page route -------------------------------------------------------------
  const off = hero.top + m.P;
  const J = [gH, off + hero.stageH];
  const gL = m.gL;
  const gR = m.gR;
  const pv = [J];
  if (Math.abs(gL - gH) > 1) {
    pv.push([gH, J[1] + 36], [gL, J[1] + 36]);
  }
  const page1 = [];
  const page2 = [];
  let wave = null;
  let pre = pv;
  if (m.wave) {
    const w = m.wave;
    if (!w.vertical) {
      const mid = w.y + w.h / 2;
      pre.push([gL, mid], [w.x - 1, mid]);
      const first = rounded(pre, R);
      page1.push(...first.dense);
      wave = { pts: w.pts.map((p) => [w.x + p[0], w.y + p[1]]), mid, vertical: false, x0: w.x, x1: w.x + w.w };
      const last = wave.pts[wave.pts.length - 1];
      const post = rounded([[w.x + w.w + 1, mid], [gR, mid], [gR, m.stop.y], [m.stop.x, m.stop.y]], R);
      page2.push([last[0], last[1]], ...post.dense);
      wave.draw2 = [[last[0], last[1]], ...post.draw];
      wave.draw1 = first.draw;
    } else {
      const cx = w.x + w.w / 2;
      pre.push([gL, w.y - 26], [cx, w.y - 26], [cx, w.y]);
      const first = rounded(pre, 14);
      page1.push(...first.dense);
      wave = { pts: w.pts.map((p) => [w.x + p[0], w.y + p[1]]), vertical: true, y0: w.y, y1: w.y + w.h };
      const last = wave.pts[wave.pts.length - 1];
      const cross = Math.max(last[1] + 30, w.cross);
      const post = rounded([[cx, last[1] + 1], [cx, cross], [gR, cross], [gR, m.stop.y], [m.stop.x, m.stop.y]], R);
      page2.push([last[0], last[1]], ...post.dense);
      wave.draw2 = [[last[0], last[1]], ...post.draw];
      wave.draw1 = first.draw;
    }
  } else {
    const whole = rounded([...pv, [gL, m.stop.y - 60], [gR, m.stop.y - 60], [gR, m.stop.y], [m.stop.x, m.stop.y]], R);
    page1.push(...whole.dense);
    wave = null;
    pre = whole.draw;
  }

  // Timeline samples ---------------------------------------------------------
  // sp: 0 = hero (stage coords), 1 = page (document coords)
  const S = [];
  let hl = 0;
  heroPts.forEach((p, i) => {
    if (i) hl += Math.hypot(p[0] - heroPts[i - 1][0], p[1] - heroPts[i - 1][1]);
    S.push({ x: p[0], y: p[1], sp: 0, gx: p[0], gy: off + p[1], hl, pl: 0, wu: 0 });
  });
  let pl = 0;
  const pushPage = (pts, wu) => {
    pts.forEach((p) => {
      const q = S[S.length - 1];
      if (q.sp === 1) pl += Math.hypot(p[0] - q.x, p[1] - q.y);
      S.push({ x: p[0], y: p[1], sp: 1, gx: p[0], gy: p[1], hl: heroLen, pl, wu });
    });
  };
  pushPage(page1, 0);
  const plWave = pl;
  let w0 = -1;
  let w1 = -1;
  if (wave) {
    w0 = S.length;
    const span = wave.vertical ? wave.y1 - wave.y0 : wave.x1 - wave.x0;
    wave.pts.forEach((p) => {
      const u = clamp01(wave.vertical ? (p[1] - wave.y0) / span : (p[0] - wave.x0) / span);
      S.push({ x: p[0], y: p[1], sp: 1, gx: p[0], gy: p[1], hl: heroLen, pl: plWave, wu: u, wave: true });
    });
    w1 = S.length - 1;
    // The page length restarts counting after the wave (the wave is drawn by
    // the Process section itself).
    page2.forEach((p, i) => {
      if (i) pl += Math.hypot(p[0] - page2[i - 1][0], p[1] - page2[i - 1][1]);
      S.push({ x: p[0], y: p[1], sp: 1, gx: p[0], gy: p[1], hl: heroLen, pl, wu: 1 });
    });
  }
  const pageLen = pl;
  const n = S.length;

  // Scroll schedule ----------------------------------------------------------
  const L = new Float64Array(n);
  for (let i = 1; i < n; i += 1) L[i] = L[i - 1] + Math.hypot(S[i].gx - S[i - 1].gx, S[i].gy - S[i - 1].gy);
  const s = new Float64Array(n);
  const s1 = m.s1;
  const Lf = L[fixedEnd] || 1;
  if (m.pinned) {
    s[0] = s1;
    for (let i = 1; i <= fixedEnd; i += 1) s[i] = s1 + (m.P - s1) * ease(L[i] / Lf);
  } else {
    for (let i = 0; i <= fixedEnd; i += 1) s[i] = fixedEnd ? s1 * ease(L[i] / Lf) : 0;
  }
  const Abase = m.desktop ? 0.56 : 0.52;
  const A0 = (S[fixedEnd].gy - s[fixedEnd]) / vh;
  const RAMP = 0.8 * vh;
  const PRE = 0.65 * vh;
  const POST = 0.75 * vh;
  const END = 1.0 * vh;
  const Ltot = L[n - 1];
  const Aend = Math.min(0.9, Math.max(0.2, (m.stop.y - (m.maxScroll - 12)) / vh));
  const horizontalWave = wave && !wave.vertical;
  let debt = 0;
  for (let i = fixedEnd + 1; i < n; i += 1) {
    const p = S[i];
    const q = S[i - 1];
    let A = Abase + (A0 - Abase) * (1 - smooth(clamp01((L[i] - L[fixedEnd]) / RAMP)));
    let ref = p.gy;
    if (horizontalWave) {
      if (i < w0) A += (A_IN - A) * smooth(clamp01((L[i] - (L[w0] - PRE)) / PRE));
      else if (i <= w1) {
        A = A_IN + (A_OUT - A_IN) * p.wu;
        ref = wave.mid;
      } else A = A_OUT + (A - A_OUT) * smooth(clamp01((L[i] - L[w1]) / POST));
    }
    if (!p.wave) {
      const dx = Math.abs(p.gx - q.gx);
      const dy = Math.abs(p.gy - q.gy);
      if (dx > dy) debt += K_H * dx;
      else debt = Math.max(0, debt - DECAY * dy);
    }
    A -= debt / vh;
    if (Aend > A) A += (Aend - A) * smooth(clamp01((L[i] - (Ltot - END)) / END));
    s[i] = ref - A * vh;
  }
  for (let i = 1; i < n; i += 1) if (s[i] < s[i - 1] + 0.02) s[i] = s[i - 1] + 0.02;
  const cap = m.maxScroll - 6;
  if (s[n - 1] > cap) {
    let j = n - 1;
    while (j > fixedEnd + 1 && s[j] > s[n - 1] - 1.6 * vh) j -= 1;
    const k = (cap - s[j]) / (s[n - 1] - s[j] || 1);
    for (let i = j + 1; i < n; i += 1) s[i] = s[j] + (s[i] - s[j]) * k;
  }

  // Branches ---------------------------------------------------------------
  // Hero: from the route to each channel meter. Page: from the margin to
  // each section's channel LED. Each lights when the dot passes its root.
  const nearest = (x, y, from, to) => {
    let best = from;
    let bd = Infinity;
    for (let i = from; i <= to; i += 1) {
      const d = (S[i].x - x) ** 2 + (S[i].y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  };
  const heroBranches = hero.meters.map((mt, k) => {
    const i = nearest(mt.x + mt.w / 2, mt.y + mt.h / 2, 0, heroPts.length - 1);
    const P0 = S[i];
    const vertical = Math.abs(P0.y - (mt.y + mt.h / 2)) > Math.abs(P0.x - (mt.x + mt.w / 2));
    const end = vertical ? [P0.x, P0.y < mt.y ? mt.y - 3 : mt.y + mt.h + 3] : [P0.x < mt.x ? mt.x - 3 : mt.x + mt.w + 3, P0.y];
    return { key: `meter:${k}`, s: s[i], d: toD([[P0.x, P0.y], end]) };
  });
  const firstAt = (y, from) => {
    for (let i = from; i < n; i += 1) if (S[i].sp === 1 && S[i].gy >= y) return i;
    return n - 1;
  };
  const pageStart = heroPts.length;
  const pageBranches = m.leds.map((led) => {
    const i = firstAt(led.y, pageStart);
    return { key: `led:${led.k}`, s: s[i], d: toD([[S[i].x, led.y], [led.x - 3, led.y]]), ground: led.ground };
  });
  const events = [];
  if (m.scopeY != null) events.push({ key: "scope", s: s[firstAt(m.scopeY, w1 > 0 ? w1 : pageStart)] });

  // Drawing ------------------------------------------------------------------
  const chunks = [];
  if (wave) {
    chunks.push(...chunk(wave.draw1, 0, 1400));
    chunks.push(...chunk(wave.draw2, plWave, 1400));
  } else {
    chunks.push(...chunk(pre, 0, 1400));
  }

  const T = {
    n,
    x: Float32Array.from(S, (p) => p.x),
    y: Float32Array.from(S, (p) => p.y),
    sp: Uint8Array.from(S, (p) => p.sp),
    hl: Float32Array.from(S, (p) => p.hl),
    pl: Float32Array.from(S, (p) => p.pl),
    wu: Float32Array.from(S, (p) => p.wu),
    s,
  };

  return {
    T,
    s1,
    off,
    hero: { d: toD(heroPath.draw), len: heroLen, branches: heroBranches, end: heroPts.length - 1 },
    page: { chunks, len: pageLen, branches: pageBranches },
    events,
    dockS: s[n - 1],
  };
}
