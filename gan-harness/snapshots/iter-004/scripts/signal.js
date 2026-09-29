// The signal: the hero's disc shrinks into a dot and travels the whole page
// along one trace, lighting each channel it passes, riding the Process wave,
// pulsing the contact scope and docking as the full stop of the finale
// ("Less Noise. More Impact●").
//
// - Layout is measured once (and again on resize, font load and any change
//   in page height); signal-route.js turns it into a timeline.
// - Scrolling then only reads scrollY, finds the dot on the timeline and
//   writes what changed: one transform, one or two dash offsets, a few
//   classes. No layout reads after setup.
// - The trace lives in one SVG under all section content (z-index 1 between
//   section grounds and content), so it never covers text.
// - Reduced motion: the whole route is drawn lit, every channel is fed, the
//   dot sits docked in the finale, and nothing moves.

import { once } from "./ticker.js";
import { buildRoute } from "./signal-route.js";
import { processWave } from "./process.js";
import { createComet } from "./signal-comet.js";
import { desk } from "./desk.js";

const NS = "http://www.w3.org/2000/svg";
const GHOST = { dark: ["#f1ece6", 0.5], light: ["#15110e", 0.38], orange: ["#15110e", 0.5] };
const LIT = { dark: ["#ff6b00", 1], light: ["#ff6b00", 1], orange: ["#15110e", 1] };

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function offsetIn(el, root) {
  let x = 0;
  let y = 0;
  let e = el;
  while (e && e !== root) {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function groundOf(el) {
  const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
  if (!m) return "dark";
  const [r, g, b] = m.map(Number);
  if (r > 200 && g < 150 && b < 60) return "orange";
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 128 ? "light" : "dark";
}

function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  parent.appendChild(node);
  return node;
}

export function initSignal(heroParts) {
  const layer = document.querySelector("[data-signal]");
  const svg = layer && layer.querySelector("[data-signal-svg]");
  const heroEl = document.querySelector("[data-hero]");
  if (!layer || !svg || !heroEl || !heroParts) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqDesktop = window.matchMedia("(min-width: 1100px)");
  const { stage, disc, title, field, type } = heroParts;
  const heroSvg = stage.querySelector("[data-hero-route]");
  const heroGhost = heroSvg.querySelector("[data-ghost]");
  const heroLit = heroSvg.querySelector("[data-lit]");
  const heroBranchG = heroSvg.querySelector("[data-branches]");
  const channels = stage.querySelector(".hero-channels");
  const heroInner = stage.querySelector(".hero-inner");
  const channelItems = [...stage.querySelectorAll("[data-channel]")];
  const meterEls = channelItems.map((li) => li.querySelector("[data-meter]"));
  const sections = [...document.querySelectorAll("main > section[data-section]")];
  const footer = document.querySelector("[data-footer]");
  const finale = document.querySelector("[data-finale]");
  const stopEl = document.querySelector("[data-finale-stop]");
  const scope = document.querySelector("[data-contact-scope]");
  const contact = document.getElementById("contact");
  const ghostG = svg.querySelector("[data-signal-ghost]");
  const litG = svg.querySelector("[data-signal-lit]");
  const branchG = svg.querySelector("[data-signal-branches]");
  const dot = svg.querySelector("[data-signal-dot]");
  const gradGhost = svg.querySelector("[data-grad-ghost]");
  const gradLit = svg.querySelector("[data-grad-lit]");
  const rows = [...document.querySelectorAll("[data-service]")];
  const items = [...document.querySelectorAll(".work-item")];
  const voices = document.getElementById("voices");
  const xxl = document.querySelector(".voices-item-xxl");
  const comet = createComet(layer, dot);
  desk.subscribe((v) => comet.setNoise(v));
  comet.setNoise(desk.get());

  let route = null;
  let m = null;
  let grounds = [];
  let chunks = [];
  let branches = [];
  const state = { lit: -1, heroLit: -1, pageLit: -1, wu: -1, docked: null, ground: "", moving: null, sp: -1, scopeSide: null };

  function measure() {
    const sy = window.scrollY;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const stageW = stage.offsetWidth;
    const stageH = stage.offsetHeight;
    const P = Math.max(0, heroEl.offsetHeight - stageH);
    const desktop = mqDesktop.matches;
    const padHero = parseFloat(getComputedStyle(heroInner).paddingLeft) || 24;
    const discBox = { x: disc.offsetLeft + disc.offsetWidth / 2, y: disc.offsetTop + disc.offsetHeight / 2, d: disc.offsetWidth };
    const rule = offsetIn(channels, stage);
    const ref = document.querySelector(".proof-inner") || heroInner;
    const rr = ref.getBoundingClientRect();
    const ipad = parseFloat(getComputedStyle(ref).paddingLeft) || padHero;
    const gL = rr.left + ipad / 2;
    const gR = rr.right - ipad / 2;

    let wave = null;
    if (processWave.svg && processWave.points && processWave.points.length > 2) {
      const r = processWave.svg.getBoundingClientRect();
      const sec = processWave.svg.closest("section");
      wave = {
        x: r.left,
        y: r.top + sy,
        w: r.width,
        h: r.height,
        pts: processWave.points,
        vertical: processWave.vertical,
        cross: sec ? sec.getBoundingClientRect().bottom + sy - 44 : r.bottom + sy + 40,
      };
    }
    const leds = [];
    sections.forEach((sec, k) => {
      const led = sec.querySelector(".chan-led");
      if (!led) return;
      const r = led.getBoundingClientRect();
      const y = r.top + sy + r.height / 2;
      if (wave && y > wave.y) return;
      leds.push({ k, x: r.left, y, ground: groundOf(sec) });
    });
    // Services rows and Work prints get their own feeds; the gallery rail
    // (desktop) slides its prints sideways, so they tune in as they enter.
    const feeds = [];
    rows.forEach((row, k) => {
      const idx = row.querySelector(".services-index") || row;
      const r = idx.getBoundingClientRect();
      const y = r.top + sy + Math.min(r.height / 2, 12);
      if (wave && y > wave.y) return;
      feeds.push({ key: `row:${k}`, x: row.getBoundingClientRect().left, y, ground: "dark" });
    });
    if (!document.documentElement.classList.contains("work-rail")) {
      items.forEach((it, k) => {
        const f = it.querySelector(".work-frame");
        if (!f) return;
        const r = f.getBoundingClientRect();
        feeds.push({ key: `print:${k}`, x: r.left, y: r.top + sy, ground: "light", print: true });
      });
    }
    // The sweep: the dot crosses the whole Voices ground under the big
    // review (writing it) and crosses back at the section's foot.
    const sweeps = [];
    if (voices && xxl && !reduce) {
      const vr = voices.getBoundingClientRect();
      const xr = xxl.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(xxl.parentElement).rowGap) || 64;
      const pb = parseFloat(getComputedStyle(voices).paddingBottom) || 96;
      sweeps.push({ y1: xr.bottom + sy + gap * 0.5, y2: vr.bottom + sy - pb * 0.5 });
    }
    const st = stopEl.getBoundingClientRect();
    const sc = scope ? scope.getBoundingClientRect() : null;
    grounds = [heroEl, ...sections, footer].filter(Boolean).map((node) => {
      const r = node.getBoundingClientRect();
      return { top: r.top + sy, bottom: r.bottom + sy, ground: node === heroEl ? "dark" : groundOf(node) };
    });
    const dotD = desktop ? 14 : 11;
    const s1 = P > 1 ? P * 0.38 : Math.max(60, Math.min(vh * 0.24, discBox.y - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64) - 30));
    return {
      vw, vh, docH, maxScroll: Math.max(0, docH - vh), desktop, pinned: P > 1 && !reduce, P, s1, dotD,
      hero: {
        top: heroEl.getBoundingClientRect().top + sy, stageW, stageH, gutter: padHero / 2, disc: discBox,
        ruleY: rule.y + 0.5, title: offsetIn(title, stage),
        meters: meterEls.map((mt) => offsetIn(mt, stage)),
      },
      gL, gR, leds, feeds, sweeps, wave,
      scopeY: sc ? sc.top + sy + sc.height / 2 : null,
      stop: { x: st.left + st.width / 2, y: st.top + sy + st.height / 2, d: st.width },
    };
  }

  function stops(grad, palette, H) {
    grad.textContent = "";
    grad.setAttribute("y2", String(H));
    grounds.forEach((g) => {
      const [c, o] = palette[g.ground];
      el("stop", { offset: (g.top / H).toFixed(5), "stop-color": c, "stop-opacity": o }, grad);
      el("stop", { offset: (g.bottom / H).toFixed(5), "stop-color": c, "stop-opacity": o }, grad);
    });
  }

  function render() {
    const H = m.docH;
    svg.setAttribute("width", String(m.vw));
    svg.setAttribute("height", String(H));
    svg.setAttribute("viewBox", `0 0 ${m.vw} ${H}`);
    stops(gradGhost, GHOST, H);
    stops(gradLit, LIT, H);

    heroSvg.setAttribute("viewBox", `0 0 ${m.hero.stageW} ${m.hero.stageH}`);
    heroGhost.setAttribute("d", route.hero.d);
    heroLit.setAttribute("d", route.hero.d);
    heroLit.style.strokeDasharray = `${route.hero.len} ${route.hero.len + 10}`;

    ghostG.textContent = "";
    litG.textContent = "";
    branchG.textContent = "";
    heroBranchG.textContent = "";
    chunks = route.page.chunks.map((c) => {
      el("path", { d: c.d, class: "sig-ghost", stroke: "url(#sig-ghost-grad)" }, ghostG);
      const lit = el("path", { d: c.d, class: "sig-lit", stroke: "url(#sig-lit-grad)" }, litG);
      lit.style.strokeDasharray = `${c.len} ${c.len + 10}`;
      lit.style.strokeDashoffset = String(c.len);
      return { ...c, el: lit, shown: 0 };
    });
    const target = (key) => {
      const [kind, k] = key.split(":");
      if (kind === "meter") return channelItems[Number(k)];
      if (kind === "row") return rows[Number(k)];
      if (kind === "print") return items[Number(k)];
      return sections[Number(k)];
    };
    branches = [
      ...route.hero.branches.map((b) => ({ ...b, el: el("path", { d: b.d, class: "sig-branch" }, heroBranchG) })),
      ...route.page.branches.map((b) => ({ ...b, el: el("path", { d: b.d, class: "sig-branch", "data-ground": b.ground }, branchG) })),
    ].map((b) => ({ ...b, target: target(b.key), on: null }));
    state.heroLit = state.pageLit = state.wu = -1;
    state.docked = state.moving = state.scopeSide = null;
    state.sp = -1;
    state.ground = "";
    route.sweeps.forEach((sw) => (sw.side = null));
  }

  function locate(s) {
    const S = route.T.s;
    const n = route.T.n;
    if (s <= S[0]) return [0, 0];
    if (s >= S[n - 1]) return [n - 1, 0];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (S[mid] <= s) lo = mid;
      else hi = mid;
    }
    return [lo, (s - S[lo]) / (S[hi] - S[lo] || 1)];
  }

  function setPageLit(lit) {
    if (Math.abs(lit - state.pageLit) < 0.4) return;
    state.pageLit = lit;
    for (const c of chunks) {
      const shown = Math.max(0, Math.min(c.len, lit - c.l0));
      if (Math.abs(shown - c.shown) < 0.4 && shown !== 0 && shown !== c.len) continue;
      if (shown === c.shown) continue;
      c.shown = shown;
      c.el.style.strokeDashoffset = (c.len - shown).toFixed(1);
    }
  }

  function frame() {
    if (!route) return;
    const s = reduce ? route.dockS + 1 : window.scrollY;
    const T = route.T;
    const [i, t] = locate(s);
    const j = Math.min(T.n - 1, i + 1);
    const hero = T.sp[i] === 0 && T.sp[j] === 0;
    const yi = T.sp[i] === 0 && !hero ? T.y[i] + route.off : T.y[i];
    const yj = T.sp[j] === 0 && !hero ? T.y[j] + route.off : T.y[j];
    const x = T.x[i] + (T.x[j] - T.x[i]) * t;
    const y = yi + (yj - yi) * t;
    const hl = T.hl[i] + (T.hl[j] - T.hl[i]) * t;
    const pl = T.pl[i] + (T.pl[j] - T.pl[i]) * t;
    const wu = T.wu[i] + (T.wu[j] - T.wu[i]) * t;
    const docked = s >= route.dockS - 1;

    // The disc: shrinks over the first stretch of scroll, then is the dot.
    const D = m.hero.disc.d;
    const k = reduce ? 1 : 1 - (1 - m.dotD / D) * easeInOut(clamp01(s / route.s1));
    if (hero || reduce) {
      // Desktop: the route starts at the disc's lowest point, so the circle
      // keeps its bottom there while it shrinks. Phone and tablet: the route
      // starts at the centre and the disc slides along it as it shrinks.
      const kMin = m.dotD / D;
      const lift = m.desktop ? (D / 2 - m.dotD / 2) * clamp01((k - kMin) / (1 - kMin)) : 0;
      const px = reduce ? m.hero.disc.x : x;
      const py = reduce ? m.hero.disc.y : y - lift;
      disc.style.transform = `translate3d(${(px - m.hero.disc.x).toFixed(2)}px, ${(py - m.hero.disc.y).toFixed(2)}px, 0) scale(${k.toFixed(4)})`;
      type.setClip(px - m.hero.title.x, py - m.hero.title.y, (D / 2) * k);
      field.setDisc(px, py, (D / 2) * k);
      // The rings calm down with the disc, but a faint wake follows the dot
      // until it leaves the hero.
      field.setFade(reduce ? 1 : Math.max(0.2, (1 - clamp01(s / route.s1)) ** 1.3));
    } else if (state.sp !== 1) {
      type.setClip(0, 0, 0);
      field.setFade(0);
    }
    if (state.sp !== (hero ? 0 : 1)) {
      state.sp = hero ? 0 : 1;
      disc.classList.toggle("is-away", !hero && !reduce);
    }
    const docY = hero ? y + route.off : y;
    const g = grounds.find((r) => docY >= r.top && docY < r.bottom);
    const ground = g ? g.ground : "dark";
    if (!hero && !docked) comet.move(x, y, ground);
    if (docked !== state.docked) {
      // Docking (not a page that loads already scrolled to the end) builds
      // the finale out of the dot (tune-in.js).
      if (docked && state.docked === false) finale.dispatchEvent(new CustomEvent("signal:dock", { detail: { x: m.stop.x, y: m.stop.y } }));
      state.docked = docked;
      finale.classList.toggle("is-docked", docked);
      dot.classList.toggle("is-docked", docked);
    }
    dot.classList.toggle("is-hidden", hero || docked);
    comet.hide(hero || docked);

    // Lit route: the hero path, then the page chunks, then the Process wave.
    if (Math.abs(hl - state.heroLit) > 0.4) {
      state.heroLit = hl;
      heroLit.style.strokeDashoffset = (route.hero.len - hl).toFixed(1);
    }
    setPageLit(pl);
    if (Math.abs(wu - state.wu) > 0.0008) {
      state.wu = wu;
      if (processWave.setProgress) processWave.setProgress(wu);
    }

    // Branches light the channel or section they feed.
    for (const b of branches) {
      const on = s >= b.s - 0.5;
      if (on === b.on) continue;
      // The dot arriving (not a page loaded mid-way) tunes the target in
      // from the point it touched (tune-in.js).
      if (on && b.on === false && b.target && b.end) b.target.dispatchEvent(new CustomEvent("signal:feed", { detail: { x: b.end[0], y: b.end[1] } }));
      b.on = on;
      b.el.classList.toggle("is-lit", on);
      if (b.target) b.target.classList.toggle("is-fed", on);
    }
    for (const sw of route.sweeps) {
      const inside = s >= sw.s0 && s <= sw.s1;
      if (inside) voices.dispatchEvent(new CustomEvent("signal:sweep", { detail: { x } }));
      else if (s > sw.s1 && sw.side !== "past") voices.dispatchEvent(new CustomEvent("signal:sweep", { detail: { x: 1e9 } }));
      sw.side = inside ? "in" : s > sw.s1 ? "past" : "before";
    }
    for (const ev of route.events) {
      const side = s >= ev.s;
      if (side === state.scopeSide) continue;
      if (side && state.scopeSide === false && scope && !reduce) scope.dispatchEvent(new CustomEvent("signal:pass"));
      state.scopeSide = side;
      if (contact) contact.classList.toggle("is-fed", side);
    }

    if (ground !== state.ground) {
      state.ground = ground;
      dot.setAttribute("data-ground", ground);
    }
    const moving = s > 6;
    if (moving !== state.moving) {
      state.moving = moving;
      heroEl.classList.toggle("is-moving", moving);
    }
  }

  let lastH = 0;
  function rebuild() {
    m = measure();
    lastH = m.docH;
    route = buildRoute(m);
    render();
    frame();
    layer.classList.add("is-ready");
  }

  let timer = 0;
  const later = (ms) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(rebuild, ms);
  };

  rebuild();
  if (document.fonts) document.fonts.ready.then(() => later(60));
  window.addEventListener("resize", () => later(200));
  window.addEventListener("load", () => later(60));
  document.addEventListener("markui:hero-in", () => later(1600));
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (Math.abs(document.documentElement.scrollHeight - lastH) > 1) later(220);
    }).observe(document.body);
  }
  if (!reduce) window.addEventListener("scroll", () => once(frame), { passive: true });
}
