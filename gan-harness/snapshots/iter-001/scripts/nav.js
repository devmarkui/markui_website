// Nav: scrolled state and the mobile menu (Escape closes, focus is kept
// inside the header while open and returned to the toggle afterwards).

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  const toggle = nav.querySelector("[data-nav-toggle]");
  const label = nav.querySelector("[data-nav-toggle-text]");
  const menu = nav.querySelector("[data-nav-menu]");
  const outside = [document.getElementById("main"), document.querySelector("footer"), document.querySelector(".skip-link")].filter(Boolean);

  // Scrolled state
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menu
  menu.inert = true;
  const isOpen = () => nav.classList.contains("is-open");

  function open() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    label.textContent = "Close";
    menu.inert = false;
    outside.forEach((el) => {
      el.inert = true;
    });
    document.body.classList.add("is-locked");
    const first = menu.querySelector(FOCUSABLE);
    window.setTimeout(() => first && first.focus({ preventScroll: true }), 60);
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen()) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    label.textContent = "Menu";
    menu.inert = true;
    outside.forEach((el) => {
      el.inert = false;
    });
    document.body.classList.remove("is-locked");
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => (isOpen() ? close() : open()));

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...nav.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null && !el.closest("[inert]"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) close({ restoreFocus: false });
  });

  window.matchMedia("(min-width: 1100px)").addEventListener("change", (event) => {
    if (event.matches) close({ restoreFocus: false });
  });
}
