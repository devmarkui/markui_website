// Why: the four reasons sit on a four-position knob, and scrolling turns it.
// The knob's position comes from where the viewport's centre line falls
// between the reasons; it has detents, so it rests on a clean "+" at each
// reason and only passes through "×" in between. Each reason's volume (--on)
// is how close it is to the centre line, so the one you are reading is loud
// and the others are turned down.

import { addScrub } from "./scrub.js";

const detent = (f) => {
  if (f <= 0.28) return 0;
  if (f >= 0.72) return 1;
  const t = (f - 0.28) / 0.44;
  return t * t * (3 - 2 * t);
};

export function initWhy() {
  const section = document.querySelector("[data-why]");
  if (!section) return;
  const knob = section.querySelector("[data-why-knob]");
  const arc = section.querySelector("[data-why-arc]");
  const inner = section.querySelector(".why-inner");

  // The signal feeds the knob at 7:30 and lights its ring as it turns: the
  // arc runs from the feed point round to the current reason.
  const setArc = (turn) => {
    if (!arc) return;
    const k = (turn + 90) / 90;
    arc.style.strokeDasharray = `${((45 + 90 * k) / 360).toFixed(4)} 1`;
  };
  // Length of the feed line, from the page margin to the knob's rim.
  const feed = () => {
    const r = knob.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(inner).paddingLeft) || 0;
    const gutter = inner.getBoundingClientRect().left + pad / 2;
    knob.style.setProperty("--feed-w", `${Math.max(0, r.left + (r.width / 2) * (1 - Math.SQRT1_2) - gutter).toFixed(1)}px`);
    // A 2px ring whatever the knob's size (the arc's viewBox is 100 wide).
    if (arc && r.width) arc.style.strokeWidth = (200 / r.width).toFixed(3);
  };
  feed();
  window.addEventListener("resize", feed);
  if (document.fonts) document.fonts.ready.then(feed);
  const items = [...section.querySelectorAll("[data-why-item]")];
  const num = section.querySelector("[data-why-num]");
  const name = section.querySelector("[data-why-name]");
  const names = items.map((li) => li.querySelector(".why-label").lastChild.textContent.trim());
  let shown = -1;

  function show(active) {
    if (active === shown) return;
    shown = active;
    num.textContent = String(active + 1).padStart(2, "0");
    name.textContent = names[active];
    section.dataset.active = String(active + 1);
    // The knob throws static off its pointer at each detent (tune-in.js).
    document.dispatchEvent(new CustomEvent("why:turn", { detail: { index: active, angle: ((-90 + 90 * active - 90) * Math.PI) / 180 } }));
  }

  // Reduced motion: every reason stays at full volume and the knob clicks
  // (without turning) to whichever reason crosses the middle of the screen.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((li) => li.style.setProperty("--on", "1"));
    const click = (i) => {
      knob.style.setProperty("--turn", `${-90 + 90 * i}deg`);
      setArc(-90 + 90 * i);
      show(i);
    };
    click(0);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && click(items.indexOf(e.target))),
        { rootMargin: "-45% 0px -45% 0px" },
      );
      items.forEach((li) => io.observe(li));
    }
    return;
  }

  // Each reason's "centre" as an offset inside the section. Offsets don't
  // change with scroll, so they are measured once (and on resize) and the
  // scroll handler never has to read layout.
  let offsets = [];
  const measure = () => {
    const top = section.getBoundingClientRect().top;
    offsets = items.map((li) => {
      const r = li.getBoundingClientRect();
      return r.top - top + r.height * 0.35;
    });
  };
  measure();
  window.addEventListener("resize", measure);
  if (document.fonts) document.fonts.ready.then(measure);

  addScrub(section, "through", (p, rect, vh) => {
    const mid = vh * 0.5;
    const centres = offsets.map((o) => rect.top + o);
    let x = 0;
    if (mid >= centres[centres.length - 1]) x = centres.length - 1;
    else if (mid > centres[0]) {
      const k = centres.findIndex((c, i) => mid >= c && mid < centres[i + 1]);
      x = k + (mid - centres[k]) / (centres[k + 1] - centres[k]);
    }
    const whole = Math.floor(x);
    const angle = -90 + 90 * (whole + detent(x - whole));
    knob.style.setProperty("--turn", `${angle.toFixed(1)}deg`);
    setArc(angle);
    const reach = vh * 0.36;
    items.forEach((li, i) => {
      const on = Math.max(0, 1 - Math.abs(centres[i] - mid) / reach);
      li.style.setProperty("--on", (Math.round(on * 40) / 40).toFixed(3));
    });
    show(Math.min(items.length - 1, Math.round(x)));
  });
}
