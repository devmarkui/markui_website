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

// The heading is a crescendo: its characters get heavier and brighter from
// the first letter to the last. Each character carries its position (--i,
// 0–1); CSS multiplies it by the scroll progress (--p) and the page noise.
export function initRamp() {
  document.querySelectorAll("[data-ramp]").forEach((heading) => {
    const lines = [...heading.children].filter((el) => el.matches("span"));
    const total = lines.reduce((n, line) => n + line.textContent.replace(/\s/g, "").length, 0);
    let index = 0;
    lines.forEach((line) => {
      const words = line.textContent.trim().split(/\s+/);
      line.textContent = "";
      words.forEach((word, w) => {
        const wrap = document.createElement("span");
        wrap.className = "ramp-word";
        for (const ch of word) {
          const span = document.createElement("span");
          span.className = "ramp-ch";
          span.style.setProperty("--i", (index / Math.max(1, total - 1)).toFixed(3));
          span.textContent = ch;
          wrap.appendChild(span);
          index += 1;
        }
        line.appendChild(wrap);
        if (w < words.length - 1) line.appendChild(document.createTextNode(" "));
      });
    });
    heading.classList.add("is-ramped");
  });
}
