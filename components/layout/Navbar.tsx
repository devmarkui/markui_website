"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Arrow } from "@/components/site/icons";
import { NAV_LINKS, isActive } from "@/components/site/nav-links";
import { BOOK_CALL_HREF, mailHref, phoneLines, telHref } from "@/lib/contact-details";
import { DEFAULT_CONTACT, type ContactDetails, type SocialLink } from "@/lib/types";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The label twice: the roll slides the first up and the second in. */
function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

/**
 * The site nav — the new bar and the old one, fused (styles/site/nav.css).
 *
 * Transparent over the page's dark masthead, carbon once you scroll, and the
 * old solid orange bar once the masthead has gone (a page without one gets
 * the orange bar straight away) — except over an orange ground, where it
 * stays carbon so it doesn't disappear. From 1100px the links sit centred in
 * the bar; below that they fold into the menu, which opens the old
 * full-screen drawer. The static homepage runs the same design from
 * public/landing (index.html, scripts/nav.js).
 */
export default function Navbar({
  socialLinks = [],
  contact = DEFAULT_CONTACT,
}: {
  socialLinks?: SocialLink[];
  /** Managed in the dashboard (Contact Details). */
  contact?: ContactDetails;
}) {
  const pathname = usePathname();
  const [bar, setBar] = useState({ scrolled: false, solid: false });
  // The path the menu was opened on: following a link closes it by itself.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt !== null && openAt === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Scrolled and past-the-masthead, read on the frame after each scroll.
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const header = headerRef.current;
      const navH = header ? header.offsetHeight : 72;
      const mast = document.querySelector("[data-mast]");
      const scrolled = window.scrollY > 24;
      // Over an orange ground the orange bar would vanish into it, so it
      // goes back to carbon until the ground has passed.
      const onOrange = [...document.querySelectorAll('[data-ground="signal"]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < navH && r.bottom > navH / 2;
      });
      const solid = (!mast || mast.getBoundingClientRect().bottom <= navH) && !onOrange;
      setBar((prev) =>
        prev.scrolled === scrolled && prev.solid === solid ? prev : { scrolled, solid },
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // A streamed page replaces its loading screen without a new pathname.
    const swapped = new MutationObserver(schedule);
    swapped.observe(document.body, { childList: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      swapped.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // While the drawer is open: the page can't scroll or take focus, Escape
  // closes it, and Tab stays inside the header.
  useEffect(() => {
    if (!open) return;
    const outside = [
      document.getElementById("main"),
      document.querySelector<HTMLElement>("footer.footer"),
    ].filter((el): el is HTMLElement => Boolean(el));
    outside.forEach((el) => (el.inert = true));
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenAt(null);
        toggleRef.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab" || !headerRef.current) return;
      const items = [...headerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null && !el.closest("[inert]"),
      );
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
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      outside.forEach((el) => (el.inert = false));
      document.body.style.overflow = previous;
    };
  }, [open]);

  // The toggle is hidden on wide screens, so a drawer left open while the
  // window grows (or a tablet turns) would have no way to close.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1100px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpenAt(null);
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    if (open) {
      setOpenAt(null);
      return;
    }
    setOpenAt(pathname);
    window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
    }, 60);
  };

  const className = [
    "nav sx",
    bar.scrolled && "is-scrolled",
    bar.solid && "is-solid",
    open && "is-open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className} ref={headerRef}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="nav-bar">
        <Link className="nav-logo" href="/" aria-label="Mark UI home">
          <Image
            src="/brand/markui-logo-white.png"
            alt="Mark UI"
            width={1600}
            height={319}
            sizes="130px"
            preload
          />
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <ul className="nav-list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  className="nav-link"
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                >
                  <Roll>{label}</Roll>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-end">
          <div className="nav-actions">
            <Link className="btn-signal nav-cta" href={BOOK_CALL_HREF} onClick={() => setOpenAt(null)}>
              Book a Call <Arrow />
            </Link>
            <button
              ref={toggleRef}
              className="nav-toggle"
              type="button"
              aria-expanded={open}
              aria-controls="nav-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={toggle}
            >
              <span className="nav-toggle-text" aria-hidden="true">
                {open ? "Close" : "Menu"}
              </span>
              <span className="nav-toggle-bars" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="nav-menu" id="nav-menu" ref={menuRef} inert={!open}>
        <nav className="nav-menu-inner" aria-label="Menu">
          <ol className="nav-menu-list">
            {NAV_LINKS.map(({ label, href }, i) => (
              <li key={href}>
                <Link
                  className="nav-menu-link"
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  onClick={() => setOpenAt(null)}
                >
                  <Roll>{label}</Roll>
                  <span className="nav-menu-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="nav-menu-foot">
            <div className="nav-menu-reach">
              {phoneLines(contact).map((line) => (
                <a className="nav-menu-phone" href={telHref(line)} key={line.tel}>
                  {line.label}
                </a>
              ))}
              <a className="nav-menu-email" href={mailHref(contact.email)}>
                {contact.email}
              </a>
            </div>
            {socialLinks.length ? (
              <ul className="nav-menu-social" aria-label="Social media">
                {socialLinks.map((s) => (
                  <li key={`${s.label}-${s.url}`}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
