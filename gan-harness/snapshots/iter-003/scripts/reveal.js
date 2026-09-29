// Reveal: adds .is-in once to [data-reveal] elements as they enter, and keeps
// .is-live on the section currently holding the middle of the viewport (it
// lights the channel LED in that section's label).

export function initReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  const sections = document.querySelectorAll("[data-section]");

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const revealer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );
  targets.forEach((el) => revealer.observe(el));

  const live = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) entry.target.classList.toggle("is-live", entry.isIntersecting);
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  sections.forEach((el) => live.observe(el));
}
