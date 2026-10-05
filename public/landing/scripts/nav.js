// Nav: the new bar and the old one, fused. At the top it is clear over the
// hero; scrolled, it closes in (carbon); past the hero it turns into the old
// orange bar (.is-solid), except over the orange reviews ground. The menu,
// the old full-screen drawer, is for phones and tablets: from 1100px the
// links sit in the bar and the toggle is hidden (Escape closes, focus is
// kept inside the header while open and returned to the toggle afterwards). The React pages run the same design from
// components/layout/Navbar.tsx.

import { once } from "./ticker.js";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  const toggle = nav.querySelector("[data-nav-toggle]");
  const label = nav.querySelector("[data-nav-toggle-text]");
  const menu = nav.querySelector("[data-nav-menu]");
  const hero = document.querySelector("[data-hero]");
  // The orange grounds (the reviews): the orange bar would vanish into them.
  const orange = [...document.querySelectorAll(".voices")];
  const outside = [document.getElementById("main"), document.querySelector("footer"), document.querySelector(".skip-link")].filter(Boolean);

  // Scrolled and past-the-hero (on the shared frame loop)
  let scrolled = null;
  let solid = null;
  const update = () => {
    const nextScrolled = window.scrollY > 24;
    const navH = nav.firstElementChild.offsetHeight;
    const onOrange = orange.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < navH && r.bottom > navH / 2;
    });
    const nextSolid = (!hero || hero.getBoundingClientRect().bottom <= navH) && !onOrange;
    if (nextScrolled !== scrolled) {
      scrolled = nextScrolled;
      nav.classList.toggle("is-scrolled", nextScrolled);
    }
    if (nextSolid !== solid) {
      solid = nextSolid;
      nav.classList.toggle("is-solid", nextSolid);
    }
  };
  window.addEventListener("scroll", () => once(update), { passive: true });
  window.addEventListener("resize", () => once(update));
  update();

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

  // The toggle is gone on wide screens, so a drawer left open while the
  // window grows (or a tablet turns) would have no way to close.
  window.matchMedia("(min-width: 1100px)").addEventListener("change", (event) => {
    if (event.matches) close({ restoreFocus: false });
  });

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
}
