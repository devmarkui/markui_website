// Work tuner: filtering never hides a project. The chosen category stays
// lit; everything else is turned down in place, so the layout never jumps.

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export function initWork() {
  const tuner = document.querySelector("[data-work-tuner]");
  const grid = document.querySelector("[data-work-grid]");
  if (!tuner || !grid) return;
  const buttons = [...tuner.querySelectorAll("[data-filter]")];
  const items = [...grid.querySelectorAll(".work-item")];
  const status = tuner.querySelector("[data-work-status]");

  function select(filter) {
    let lit = 0;
    items.forEach((item) => {
      const on = filter === "all" || item.dataset.cat === filter;
      item.classList.toggle("is-muted", !on);
      if (on) lit += 1;
    });
    buttons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter)));
    grid.dataset.filter = filter;

    if (filter === "all") {
      status.textContent = "All ten projects in focus.";
    } else {
      const label = buttons.find((b) => b.dataset.filter === filter).firstChild.textContent.trim();
      const rest = items.length - lit;
      status.textContent = `${label}: ${WORDS[lit]} projects in focus, the other ${WORDS[rest]} turned down.`;
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => select(btn.dataset.filter));
  });
}
