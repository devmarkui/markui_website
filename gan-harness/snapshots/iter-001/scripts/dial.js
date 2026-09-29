// Client dial: an analogue tuning needle sweeps from name to name, turning
// each one up as it arrives. Horizontal on wide screens, vertical on phones.
// Hovering a name tunes straight to it. Static under reduced motion.

export function initDial() {
  const root = document.querySelector("[data-dial]");
  if (!root) return;
  const body = root.querySelector(".proof-dial-body");
  const names = [...root.querySelectorAll(".proof-dial-name")];
  const needle = root.querySelector("[data-dial-needle]");
  const freq = root.querySelector("[data-dial-freq]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;
  let timer = 0;
  let visible = false;
  let held = false;

  function place() {
    const b = body.getBoundingClientRect();
    const r = names[current].getBoundingClientRect();
    const vertical = getComputedStyle(root).getPropertyValue("--dial-axis").trim() === "y";
    needle.style.transform = vertical
      ? `translate3d(0, ${(r.top + r.height / 2 - b.top).toFixed(1)}px, 0)`
      : `translate3d(${(r.left + r.width / 2 - b.left).toFixed(1)}px, 0, 0)`;
  }

  function tune(index) {
    current = index;
    names.forEach((el, i) => el.classList.toggle("is-on", i === index));
    freq.textContent = `${String(index + 1).padStart(2, "0")} / ${String(names.length).padStart(2, "0")}`;
    place();
  }

  function stop() {
    window.clearInterval(timer);
    timer = 0;
  }

  function start() {
    if (timer || reduce.matches || !visible || held) return;
    timer = window.setInterval(() => tune((current + 1) % names.length), 1700);
  }

  names.forEach((el, i) => {
    el.addEventListener("pointerenter", () => {
      held = true;
      stop();
      tune(i);
    });
  });
  body.addEventListener("pointerleave", () => {
    held = false;
    start();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }).observe(root);
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(place, 120);
  });
  if (document.fonts) document.fonts.ready.then(place);

  root.classList.add("is-ready");
  tune(0);
}
