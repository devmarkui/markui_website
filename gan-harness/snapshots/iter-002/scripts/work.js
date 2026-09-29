// Work tuner. Tuning to a channel never hides a project: the gallery lights
// dip, the matching prints are re-hung at the front of the wall (the slots
// are defined by position, see styles/work.css), the rest are turned down
// behind them, the page glides to the first match, and the lights come back
// up print by print. "All" restores the original hang.
// On phones the filter row scrolls sideways; its edges fade to show there
// is more, and the pressed channel is brought into view.

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const DIM_MS = 260;

export function initWork() {
  const tuner = document.querySelector("[data-work-tuner]");
  const grid = document.querySelector("[data-work-grid]");
  if (!tuner || !grid) return;
  const buttons = [...tuner.querySelectorAll("[data-filter]")];
  const items = [...grid.querySelectorAll(".work-item")];
  const foot = grid.querySelector(".work-foot");
  const status = tuner.querySelector("[data-work-status]");
  const scroller = tuner.querySelector("[data-tuner-scroll]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = "all";
  let timer = 0;

  const byIndex = (a, b) => Number(a.dataset.index) - Number(b.dataset.index);

  function rehang(filter) {
    const on = items.filter((it) => filter === "all" || it.dataset.cat === filter).sort(byIndex);
    const off = items.filter((it) => !on.includes(it)).sort(byIndex);
    [...on, ...off].forEach((it, slot) => {
      it.classList.toggle("is-muted", !on.includes(it));
      it.style.setProperty("--slot", String(slot));
      grid.insertBefore(it, foot);
    });
    return on.length;
  }

  function announce(filter, lit) {
    if (filter === "all") {
      status.textContent = "All ten projects in focus.";
      return;
    }
    const label = buttons.find((b) => b.dataset.filter === filter).querySelector(".work-tuner-name").dataset.label;
    status.textContent = `${label}: ${WORDS[lit]} projects moved to the front, the other ${WORDS[items.length - lit]} turned down.`;
  }

  function glideToWall() {
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
    const offset = navH + tuner.offsetHeight + 24;
    const target = window.scrollY + grid.getBoundingClientRect().top - offset;
    if (Math.abs(window.scrollY - target) < 8) return;
    window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
  }

  function select(filter) {
    if (filter === current) return;
    current = filter;
    buttons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter)));
    grid.dataset.filter = filter;
    const pressed = buttons.find((b) => b.dataset.filter === filter);
    if (scroller && scroller.scrollWidth > scroller.clientWidth) {
      pressed.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
    }

    window.clearTimeout(timer);
    if (reduce) {
      announce(filter, rehang(filter));
      glideToWall();
      return;
    }
    grid.classList.add("is-dimming");
    timer = window.setTimeout(() => {
      const lit = rehang(filter);
      announce(filter, lit);
      glideToWall();
      requestAnimationFrame(() => {
        grid.classList.remove("is-dimming");
        grid.classList.add("is-rehung");
        timer = window.setTimeout(() => grid.classList.remove("is-rehung"), 1400);
      });
    }, DIM_MS);
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => select(btn.dataset.filter)));
  items.forEach((it, i) => it.style.setProperty("--slot", String(i)));

  // Edge fades on the sideways-scrolling filter row (phones).
  if (scroller) {
    const edges = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      tuner.classList.toggle("has-more-start", scroller.scrollLeft > 4);
      tuner.classList.toggle("has-more-end", max > 4 && scroller.scrollLeft < max - 4);
    };
    scroller.addEventListener("scroll", edges, { passive: true });
    window.addEventListener("resize", edges);
    edges();
  }
}
