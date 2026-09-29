// Services: exactly one row is "turned up" at a time. Scroll position picks
// the row crossing the centre of the screen; hover or keyboard focus overrides.

export function initServices() {
  const rows = [...document.querySelectorAll("[data-service]")];
  if (!rows.length) return;

  let fromScroll = null;
  let fromUser = null;

  const apply = () => {
    const active = fromUser || fromScroll;
    rows.forEach((row) => row.classList.toggle("is-on", row === active));
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) fromScroll = entry.target;
        }
        apply();
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    rows.forEach((row) => io.observe(row));
  }

  rows.forEach((row) => {
    row.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      fromUser = row;
      apply();
    });
    row.addEventListener("pointerleave", () => {
      if (fromUser === row) {
        fromUser = null;
        apply();
      }
    });
    row.addEventListener("focusin", () => {
      fromUser = row;
      apply();
    });
    row.addEventListener("focusout", () => {
      if (fromUser === row) {
        fromUser = null;
        apply();
      }
    });
  });
}
