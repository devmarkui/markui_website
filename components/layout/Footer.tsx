"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { label: "Home",     href: "/"         },
  { label: "Projects", href: "/projects" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "About",    href: "/about"    },
  { label: "Contact",  href: "/contact"  },
];
const SOCIAL    = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Dribbble",  href: "https://dribbble.com"  },
  { label: "LinkedIn",  href: "https://linkedin.com"  },
  { label: "Behance",   href: "https://behance.net"   },
];

export default function Footer() {
  const ref    = useRef<HTMLElement>(null);
  const [rev, setRev] = useState(0);

  /* Scroll-reveal: slides up as footer enters viewport */
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const prog = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight * 0.5), 0), 1);
      setRev(prog);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════
           FOOTER
        ═══════════════════════════════════════════ */
        .ft-root {
          background: #0c0c0c;
          position: relative;
          overflow: hidden;
          will-change: transform, opacity;
        }

        /* noise layer */
        .ft-root::before {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }

        /* ── TOP GRID ────────────────────────────── */
        .ft-grid {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px 24px;
          padding: 52px 24px 44px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          max-width: 1440px; margin: 0 auto;
        }

        .ft-col { display: flex; flex-direction: column; gap: 14px; }

        .ft-col-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.30);
        }
        .ft-label-star { color: #ff6b00; font-size: 10px; }

        /* contact col */
        .ft-phone {
          font-size: 13px; font-weight: 400;
          color: rgba(255,255,255,0.50);
          text-decoration: none; letter-spacing: 0.04em;
          transition: color 0.18s ease;
        }
        .ft-phone:hover { color: #fff; }

        .ft-email {
          font-size: clamp(16px, 3.8vw, 24px);
          font-weight: 500; color: #fff;
          text-decoration: none; letter-spacing: -0.01em;
          line-height: 1.2; word-break: break-all;
          transition: color 0.18s ease;
        }
        .ft-email:hover { color: rgba(255,255,255,0.65); }

        /* map link */
        .ft-map {
          display: block;
          position: relative;
          overflow: hidden;
          border-radius: 6px;
          margin-top: 12px;
          height: 150px;
          opacity: 0.55;
          transition: opacity 0.3s ease;
        }
        .ft-map:hover {
          opacity: 1;
        }

        /* nav links */
        .ft-nav { display: flex; flex-direction: column; gap: 10px; }

        .ft-link {
          font-size: clamp(13px, 3.5vw, 15px);
          font-weight: 500; text-transform: uppercase;
          color: rgba(255,255,255,0.50);
          text-decoration: none; letter-spacing: 0.06em;
          display: inline-flex; align-items: center; gap: 6px;
          width: fit-content;
          transition: color 0.18s ease;
        }
        .ft-link:hover { color: #fff; }

        .ft-link-arrow {
          font-size: 11px; color: rgba(255,255,255,0.25);
          transition: color 0.18s ease, transform 0.18s ease;
        }
        .ft-link:hover .ft-link-arrow {
          color: #ff6b00; transform: translate(2px,-2px);
        }

        /* back to top */
        .ft-col-top { align-items: flex-start; justify-content: flex-start; }

        .ft-top-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px; padding: 11px 20px;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: rgba(255,255,255,0.50); cursor: pointer;
          transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }
        .ft-top-btn:hover {
          border-color: rgba(255,255,255,0.32);
          color: #fff;
          background: rgba(255,255,255,0.04);
        }
        .ft-top-arrow { font-size: 14px; transition: transform 0.18s ease; }
        .ft-top-btn:hover .ft-top-arrow { transform: translateY(-3px); }

        /* ── WORDMARK ────────────────────────────── */
        .ft-wordmark-wrap {
          position: relative; z-index: 1;
          display: flex; align-items: flex-end;
          padding: 0 24px; overflow: hidden;
          line-height: 0.85;
          max-width: 1440px; margin: 0 auto;
          user-select: none; pointer-events: none;
        }
        .ft-wordmark {
          font-size: clamp(72px, 17vw, 200px);
          font-weight: 900; letter-spacing: -0.02em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.05);
          line-height: 1; display: block;
        }
        .ft-wordmark-r {
          font-size: clamp(36px, 8.5vw, 100px);
          font-weight: 700; color: rgba(255,255,255,0.05);
          line-height: 1; margin-left: 4px;
          align-self: flex-start;
          margin-top: clamp(10px, 2.5vw, 24px);
        }

        /* ── BOTTOM BAR ──────────────────────────── */
        .ft-bottom {
          position: relative; z-index: 1;
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          padding: 18px 24px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          max-width: 1440px; margin: 0 auto;
        }
        .ft-copy {
          font-size: 10px; font-weight: 400;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.22);
        }
        .ft-bottom-links { display: flex; gap: 20px; }
        .ft-bottom-link {
          font-size: 10px; font-weight: 400;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.22);
          text-decoration: none;
          transition: color 0.18s ease;
        }
        .ft-bottom-link:hover { color: rgba(255,255,255,0.55); }

        /* Staff entry point — present but understated. */
        .ft-admin-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .ft-admin-link::before {
          content: "";
          width: 4px; height: 4px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }
        .ft-admin-link:hover { color: #ff6b00; }

        /* ── DESKTOP ────────────────────────────── */
        @media (min-width: 900px) {
          .ft-grid {
            grid-template-columns: 1.4fr 1fr 1fr auto;
            gap: 0;
            padding: 60px 64px 52px;
          }
          .ft-col { padding-right: 48px; }
          .ft-col + .ft-col {
            border-left: 1px solid rgba(255,255,255,0.06);
            padding-left: 48px; padding-right: 0;
          }
          .ft-col-top { padding-left: 48px; }
          .ft-wordmark-wrap { padding: 0 64px; }
          .ft-bottom { padding: 20px 64px 32px; }
        }

        /* ── FOCUS VISIBLE ───────────────────────── */
        .ft-top-btn:focus-visible,
        .ft-link:focus-visible,
        .ft-bottom-link:focus-visible {
          outline: 2px solid rgba(255,255,255,0.55);
          outline-offset: 3px;
          border-radius: 4px;
        }

        /* ── REDUCED MOTION ──────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .ft-root { transform: none !important; opacity: 1 !important; }
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>

      <footer
        ref={ref}
        className="ft-root"
        style={{
          transform: `translateY(${(1 - rev) * 56}px)`,
          opacity: rev,
        }}
        aria-label="Site footer"
      >
        {/* ── Top grid ── */}
        <div className="ft-grid">

          {/* Contact */}
          <div className="ft-col">
            <div className="ft-col-label">
              <span className="ft-label-star" aria-hidden="true">✦</span>
              Contact
            </div>
            <a href="tel:+94760887702" className="ft-phone">+94 76 088 7702</a>
            <a href="mailto:info@markui.lk" className="ft-email">
              info@markui.lk
            </a>
            <a 
              href="https://maps.app.goo.gl/foPg5arqickUWhzL7"
              target="_blank"
              rel="noopener noreferrer"
              className="ft-map"
              aria-label="Open Mark UI Location on Google Maps"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.595254377219!2d79.8902469747572!3d6.93888029306115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259003bca9245%3A0xd6d8c6b7efe210b9!2sMark%20UI!5e0!3m2!1sen!2slk!4v1781771867613!5m2!1sen!2slk" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: "invert(90%) grayscale(100%)", transform: "scale(1.5)", pointerEvents: "none" }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Mark UI Location"
              ></iframe>
            </a>
          </div>

          {/* Navigation */}
          <div className="ft-col">
            <div className="ft-col-label">
              <span className="ft-label-star" aria-hidden="true">✦</span>
              Navigation
            </div>
            <nav className="ft-nav" aria-label="Footer navigation">
              {NAV_LINKS.map(({ label, href }) => (
                <Link key={href} href={href} className="ft-link">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div className="ft-col">
            <div className="ft-col-label">
              <span className="ft-label-star" aria-hidden="true">✦</span>
              Social
            </div>
            <nav className="ft-nav" aria-label="Social media links">
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href}
                  className="ft-link" target="_blank" rel="noopener noreferrer">
                  {s.label}
                  <span className="ft-link-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Back to top */}
          <div className="ft-col ft-col-top">
            <button className="ft-top-btn" onClick={scrollTop} aria-label="Scroll back to top">
              Back to Top
              <span className="ft-top-arrow" aria-hidden="true">↑</span>
            </button>
          </div>

        </div>

        {/* Wordmark */}
        <div className="ft-wordmark-wrap" aria-hidden="true">
          <span className="ft-wordmark">MARK UI</span>
          <span className="ft-wordmark-r">®</span>
        </div>

        {/* Bottom bar */}
        <div className="ft-bottom">
          <span className="ft-copy">© {year} Mark UI · All Rights Reserved</span>
          <div className="ft-bottom-links">
            <Link href="/terms" className="ft-bottom-link">Terms of Service</Link>
            <Link href="/privacy" className="ft-bottom-link">Privacy Policy</Link>
            <Link
              href="/admin/login"
              className="ft-bottom-link ft-admin-link"
              rel="nofollow"
            >
              Admin Login
            </Link>
          </div>
        </div>

      </footer>
    </>
  );
}