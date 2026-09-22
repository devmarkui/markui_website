"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const NAV_LINKS = [
  { label: "Home",     href: "/"         },
  { label: "Projects", href: "/projects" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "About",    href: "/about"    },
  { label: "Contact",  href: "/contact"  },
];

/** A link stays active on its nested pages too (e.g. /services/[slug]). */
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Labels past this length get a smaller type scale so they still fit. */
const LONG_LABEL = 12;

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Dribbble",  href: "https://dribbble.com"  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen]     = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll: hide on down, show on up
  useEffect(() => {
    let ticking = false;
    const handle = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > lastScrollY.current && y > 80 && !open) setHidden(true);
        else setHidden(false);
        lastScrollY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, [open]);

  return (
    <>
      <style>{`
        /* ── RESET ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ══════════════════════════════════════
           HEADER BAR
        ══════════════════════════════════════ */
        .nav-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 300;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          /* A solid orange bar, so links stay readable over any content. */
          background: #ff6b00;
          /* hide/show */
          transform: translateY(0);
          transition: transform 0.4s cubic-bezier(0.76,0,0.24,1), color 0.4s ease;
        }
        /* The open drawer has its own background; let the bar blend into it. */
        .nav-header[data-open="true"] { background: transparent; }
        .nav-header[data-hidden="true"]:not([data-open="true"]) {
          transform: translateY(-100%);
        }

        /* ── LOGO ── */
        .nav-logo {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          line-height: 0;
          position: relative;
          z-index: 310;
        }
        /* White wordmark (1600 × 319); height sets the size. */
        .nav-logo img {
          display: block;
          height: 26px;
          width: auto;
        }
        .nav-logo:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 6px;
          border-radius: 2px;
        }

        /* ── DESKTOP NAV LINKS ── */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: clamp(18px, 3.2vw, 64px);
          list-style: none;
          transition: opacity 0.3s ease;
        }
        .nav-header[data-open="true"] .nav-desktop {
          opacity: 0;
          pointer-events: none;
        }
        .nav-desktop a {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          position: relative;
          display: inline-flex;
          flex-direction: column;
          overflow: hidden;
          transition: color 0.35s ease, opacity 0.2s ease;
        }

        /* Tighter tracking between the tablet breakpoint and 1100px, where the
           six labels would otherwise crowd the burger. */
        @media (max-width: 1100px) {
          .nav-desktop a { letter-spacing: 0.12em; font-size: 10px; }
        }
        .nav-desktop a span {
          transition: transform 0.4s cubic-bezier(0.76,0,0.24,1);
        }
        .nav-desktop a::after {
          content: attr(data-text);
          position: absolute;
          top: 100%; left: 0;
          width: 100%;
          transition: transform 0.4s cubic-bezier(0.76,0,0.24,1);
        }
        .nav-desktop a:hover span,
        .nav-desktop a:hover::after { transform: translateY(-100%); }

        .nav-desktop a { color: #fff; opacity: 0.85; }
        .nav-desktop a:hover { opacity: 1 !important; }

        .nav-desktop a[data-active="true"] span,
        .nav-desktop a[data-active="true"]::after {
          text-decoration: line-through;
          text-decoration-thickness: 0.1em;
          text-decoration-color: rgba(255,255,255,0.5);
        }

        /* ── BURGER ── */
        .nav-burger {
          background: none; border: none;
          padding: 6px; cursor: pointer;
          display: flex; flex-direction: column;
          gap: 6px; flex-shrink: 0;
          position: relative; z-index: 310;
        }
        .nav-burger span {
          display: block;
          width: 26px; height: 1.5px;
          transition: transform 0.35s ease, opacity 0.3s ease, background 0.35s ease;
          transform-origin: center;
        }
        .nav-burger span { background: #fff; }

        /* X animation */
        .nav-burger[aria-expanded="true"] span:nth-child(1) {
          transform: translateY(7.5px) rotate(45deg);
        }
        .nav-burger[aria-expanded="true"] span:nth-child(2) {
          transform: translateY(-7.5px) rotate(-45deg);
        }

        /* ══════════════════════════════════════
           FULLSCREEN DRAWER  (Image 1 style)
           - Dark red-orange bg
           - Giant centred nav links
           - Bottom-left: phone + email
           - Bottom-right: social links
        ══════════════════════════════════════ */
        .nav-drawer {
          position: fixed;
          inset: 0;
          z-index: 290;
          background: #c94000;          /* deep burnt-orange like Image 1 */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          /* slide from top */
          transform: translateY(-100%);
          transition: transform 0.55s cubic-bezier(0.76,0,0.24,1);
          will-change: transform;
        }
        .nav-drawer[data-open="true"] {
          transform: translateY(0);
        }

        /* ── Diagonal light beams (decorative, Image 1) ── */
        .nav-drawer::before,
        .nav-drawer::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }
        .nav-drawer::before {
          top: -20%; left: 20%;
          width: 55%; height: 160%;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(255,100,0,0.18) 50%,
            transparent 65%
          );
          transform: rotate(-5deg);
        }
        .nav-drawer::after {
          top: -20%; left: 55%;
          width: 30%; height: 160%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,120,20,0.10) 50%,
            transparent 70%
          );
          transform: rotate(-5deg);
        }

        /* ── Link list — centred, giant ── */
        .nav-drawer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 2;
        }

        .nav-drawer-links li { overflow: hidden; }

        .nav-drawer-links a {
          display: inline-block;
          /* Height term keeps all six links clear of the bottom bar on
             shorter screens. */
          font-size: clamp(40px, min(9vw, 10.5vh), 110px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.05;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,255,255,0.22);   /* dim by default like Image 1 */
          position: relative;
          overflow: hidden;
          /* stagger slide-up */
          transform: translateY(110%);
          transition:
            transform 0.55s cubic-bezier(0.76,0,0.24,1),
            color 0.25s ease;
        }

        /* Longer labels drop a scale step so they never run off the edge of
           the drawer. */
        .nav-drawer-links a[data-long="true"] {
          font-size: clamp(26px, 5.2vw, 64px);
        }

        /* inner text + clone for roll effect */
        .nav-drawer-links a .dl-text {
          display: block;
          transition: transform 0.45s cubic-bezier(0.76,0,0.24,1);
        }
        .nav-drawer-links a .dl-clone {
          position: absolute;
          top: 100%; left: 0;
          display: block;
          transition: transform 0.45s cubic-bezier(0.76,0,0.24,1);
          color: #fff;
        }
        .nav-drawer-links a:hover .dl-text  { transform: translateY(-100%); }
        .nav-drawer-links a:hover .dl-clone { transform: translateY(-100%); }
        .nav-drawer-links a:hover { color: #fff; }

        /* active = strikethrough */
        .nav-drawer-links a[data-active="true"] .dl-text,
        .nav-drawer-links a[data-active="true"] .dl-clone {
          text-decoration: line-through;
          text-decoration-thickness: 0.04em;
          text-decoration-color: rgba(255,255,255,0.45);
        }
        .nav-drawer-links a[data-active="true"] { color: rgba(255,255,255,0.50); }

        /* staggered entrance when open */
        .nav-drawer[data-open="true"] .nav-drawer-links li:nth-child(1) a {
          transform: translateY(0); transition-delay: 0.08s;
        }
        .nav-drawer[data-open="true"] .nav-drawer-links li:nth-child(2) a {
          transform: translateY(0); transition-delay: 0.14s;
        }
        .nav-drawer[data-open="true"] .nav-drawer-links li:nth-child(3) a {
          transform: translateY(0); transition-delay: 0.20s;
        }
        .nav-drawer[data-open="true"] .nav-drawer-links li:nth-child(4) a {
          transform: translateY(0); transition-delay: 0.26s;
        }
        .nav-drawer[data-open="true"] .nav-drawer-links li:nth-child(5) a {
          transform: translateY(0); transition-delay: 0.32s;
        }
        .nav-drawer[data-open="true"] .nav-drawer-links li:nth-child(6) a {
          transform: translateY(0); transition-delay: 0.38s;
        }

        /* ── DRAWER BOTTOM BAR ── */
        .nav-drawer-bottom {
          position: absolute;
          bottom: 40px; left: 48px; right: 48px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          z-index: 2;
          /* fade in after links */
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.4s ease 0.38s, transform 0.4s ease 0.38s;
        }
        .nav-drawer[data-open="true"] .nav-drawer-bottom {
          opacity: 1;
          transform: translateY(0);
        }

        /* bottom-left: phone + email */
        .nav-drawer-contact { display: flex; flex-direction: column; gap: 6px; }
        .nav-drawer-phone {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          text-transform: uppercase;
        }
        .nav-drawer-email {
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #fff;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .nav-drawer-email:hover { opacity: 0.75; }

        /* bottom-right: social */
        .nav-drawer-social { display: flex; gap: 32px; align-items: center; }
        .nav-drawer-social a {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.2s ease;
        }
        .nav-drawer-social a:hover { color: #fff; }
        .nav-drawer-social a::after {
          content: "↗";
          font-size: 12px;
          opacity: 0.75;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 767px) {
          .nav-header { padding: 0 20px; }
          .nav-header { padding: 0 24px; }
          .nav-desktop { display: none; }
          .nav-logo img { height: 22px; }

          .nav-drawer-bottom { left: 24px; right: 24px; bottom: 32px; }
          .nav-drawer-social { gap: 20px; }
          .nav-drawer-links a {
            font-size: clamp(32px, min(12vw, 8.5vh), 80px);
          }
          .nav-drawer-links a[data-long="true"] {
            font-size: clamp(22px, 6.4vw, 40px);
          }

          .nav-drawer-bottom { 
            left: 24px; right: 24px; bottom: 32px; 
            flex-direction: column;
            align-items: center;
            gap: 24px;
            text-align: center;
          }
          .nav-drawer-contact { align-items: center; }
          .nav-drawer-social { 
            gap: 20px; justify-content: center; flex-wrap: wrap;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-drawer,
          .nav-drawer-links a,
          .nav-drawer-bottom { transition: none !important; }
        }
      `}</style>

      {/* ── HEADER BAR ── */}
      <header
        className="nav-header"
        data-open={String(open)}
        data-hidden={String(hidden)}
        role="banner"
      >
        <Link href="/" className="nav-logo" aria-label="Mark UI — home">
          <Image
            src="/brand/markui-logo-white.png"
            alt="Mark UI"
            width={1600}
            height={319}
            sizes="130px"
            priority
          />
        </Link>

        {/* Desktop links */}
        <nav aria-label="Primary navigation">
          <ul className="nav-desktop">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-active={String(isActive(pathname, href))}
                  data-text={label}
                >
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Burger — always visible */}
        <button
          className="nav-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="nav-drawer"
          onClick={() => setOpen(v => !v)}
        >
          <span />
          <span />
        </button>
      </header>

      {/* ══════════════════════════════════════
          FULLSCREEN DRAWER
      ══════════════════════════════════════ */}
      <div
        id="nav-drawer"
        className="nav-drawer"
        data-open={String(open)}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        {/* Giant centred nav links */}
        <nav aria-label="Drawer navigation">
          <ul className="nav-drawer-links">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-active={String(isActive(pathname, href))}
                  data-long={String(label.length > LONG_LABEL)}
                  onClick={() => setOpen(false)}
                >
                  <span className="dl-text">{label}</span>
                  <span className="dl-clone" aria-hidden="true">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom bar — contact left, socials right */}
        <div className="nav-drawer-bottom" aria-hidden="true">
          <div className="nav-drawer-contact">
            <a href="tel:+94760887702" className="nav-drawer-phone">+94 76 088 7702</a>
            <a href="mailto:info@markui.lk" className="nav-drawer-email">
              info@markui.lk
            </a>
          </div>
          <div className="nav-drawer-social">
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}