"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";

import type { Service } from "@/lib/types";

/**
 * Home-page services accordion.
 *
 * Presentation only — the services themselves come from the database via the
 * server component in `Services.tsx`, so renaming or reordering a service in
 * the dashboard changes this section too.
 */
const MOBILE_QUERY = "(max-width: 768px)";

export default function ServicesAccordion({
  services,
}: {
  services: Service[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  /* Detect mobile (≤768 px). Subscribing to the media query directly avoids
     the extra render that setting state from an effect would cause. */
  const isMobile = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false, // Server render assumes desktop; hover is a no-op either way.
  );

  /* Intersection observer for entrance animation */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  /* Desktop: hover open / close; Mobile: click open / close */
  const handleMouseEnter = (i: number) => { if (!isMobile) setOpenIndex(i); };
  const handleMouseLeave = ()           => { if (!isMobile) setOpenIndex(null); };
  const handleClick      = (i: number) => { if  (isMobile) setOpenIndex(openIndex === i ? null : i); };

  if (services.length === 0) return null;

  return (
    <>
      <style>{`
        /* ════════════════════════════════════
           SECTION
        ════════════════════════════════════ */
        .sv-section {
          /* Section-local dark palette. The global tokens are tuned for the
             light sections, so this section overrides them in one place and
             everything below reads from these instead. */
          --sv-bg:          #000000;
          --sv-card:        #0e0e0e;
          --sv-card-border: rgba(255,255,255,0.10);
          --sv-heading:     #ffffff;
          --sv-muted:       #a8a8a8;
          --sv-hairline:    rgba(255,255,255,0.16);
          --sv-dot:         rgba(255,255,255,0.22);

          background: var(--sv-bg);
          padding: 100px 0;
          position: relative;
          overflow: hidden;
        }
        .sv-wrap {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
          position: relative; z-index: 1;
        }

        /* ════════════════════════════════════
           HEADER
        ════════════════════════════════════ */
        .sv-header {
          margin-bottom: 72px;
          opacity: 0; transform: translateY(22px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .sv-section[data-in="true"] .sv-header { opacity:1; transform:translateY(0); }

        .sv-heading {
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em; text-transform: uppercase;
          color: var(--sv-heading); margin: 0 0 22px;
        }
        .sv-heading .dim { color: var(--sv-muted); }
        .sv-subtext {
          max-width: 400px; font-size: 15px;
          line-height: 1.7; color: var(--sv-muted);
        }

        /* ════════════════════════════════════
           CARD LIST
        ════════════════════════════════════ */
        .sv-list {
          display: flex; flex-direction: column; gap: 8px;
        }

        /* ── Base card wrapper ── */
        .sv-card {
          position: relative;
          border-radius: 6px;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .sv-section[data-in="true"] .sv-card { opacity:1; transform:translateY(0); }
        .sv-card:nth-child(1){transition-delay:0.06s}
        .sv-card:nth-child(2){transition-delay:0.12s}
        .sv-card:nth-child(3){transition-delay:0.18s}
        .sv-card:nth-child(4){transition-delay:0.24s}
        .sv-card:nth-child(5){transition-delay:0.30s}
        .sv-card:nth-child(6){transition-delay:0.36s}
        .sv-card:nth-child(7){transition-delay:0.42s}

        /* ── Card inner shell ── */
        .sv-card-shell {
          position: relative;
          overflow: hidden;
          border-radius: 6px;

          /* Closed: matching Trust.tsx */
          background: var(--sv-card);
          border: 1px solid var(--sv-card-border);

          /* Smooth colour transition */
          transition:
            background 0.38s ease,
            border-color 0.38s ease,
            box-shadow 0.38s ease;
        }

        /* Open: full primary background */
        .sv-card.is-open .sv-card-shell {
          background: var(--primary);
          border-color: var(--primary-hover);
          box-shadow: var(--shadow-orange);
        }

        /*
          Angled corner cuts — top-left & bottom-left
          Using clip-path so it works on the whole shell
        */
        .sv-card-shell {
          clip-path: polygon(
            18px 0%, 100% 0%,
            100% 100%, 18px 100%,
            0% calc(100% - 18px),
            0% 18px
          );
        }

        /* ── HEADER ROW (always visible) ── */
        .sv-row {
          display: flex;
          align-items: center;
          padding: 0 24px 0 24px;
          height: 76px;
          gap: 0;
          cursor: default; /* desktop: hover; no pointer needed */
        }

        /* Mobile: row acts as clickable */
        @media (max-width: 768px) {
          .sv-row { cursor: pointer; }
        }

        /* Number pill */
        .sv-num {
          flex-shrink: 0;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--sv-muted);
          border: 1px solid var(--sv-hairline);
          border-radius: 100px;
          padding: 4px 11px;
          margin-right: 18px;
          transition: color 0.3s, border-color 0.3s;
        }
        .sv-card.is-open .sv-num {
          color: var(--white);
          border-color: rgba(255, 255, 255, 0.30);
        }

        /* Dotted line */
        .sv-dots {
          flex-shrink: 0;
          width: 60px; height: 1px;
          margin-right: 24px;
          background: repeating-linear-gradient(
            90deg,
            var(--sv-dot) 0, var(--sv-dot) 2px,
            transparent 2px, transparent 6px
          );
          transition: background 0.3s;
        }
        .sv-card.is-open .sv-dots {
          background: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.30) 0, rgba(255,255,255,0.30) 2px,
            transparent 2px, transparent 6px
          );
        }

        /* Title */
        .sv-title {
          flex: 1;
          font-size: clamp(14px, 1.6vw, 20px);
          font-weight: 700;
          color: var(--sv-heading);
          letter-spacing: 0.01em;
          text-align: left;
          transition: color 0.3s ease;
        }
        .sv-card.is-open .sv-title {
          color: var(--white);
        }

        /* Toggle circle */
        .sv-toggle {
          flex-shrink: 0;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid var(--sv-hairline);
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.25s, background 0.25s;
          pointer-events: none; /* hover on card, not button */
        }
        .sv-card.is-open .sv-toggle {
          border-color: var(--white);
          background: var(--white);
        }
        .sv-toggle-bar {
          position: relative; width: 12px; height: 12px;
        }
        .sv-toggle-bar::before,
        .sv-toggle-bar::after {
          content: '';
          position: absolute;
          background: var(--sv-heading);
          border-radius: 2px;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .sv-toggle-bar::before {
          width: 12px; height: 1.5px;
          top: 50%; left: 0; transform: translateY(-50%);
        }
        .sv-toggle-bar::after {
          width: 1.5px; height: 12px;
          left: 50%; top: 0; transform: translateX(-50%);
        }
        .sv-card.is-open .sv-toggle-bar::before,
        .sv-card.is-open .sv-toggle-bar::after {
          background: var(--primary);
        }
        .sv-card.is-open .sv-toggle-bar::after {
          transform: translateX(-50%) rotate(90deg); opacity: 0;
        }

        /* ── EXPAND PANEL ── */
        .sv-panel {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.40s cubic-bezier(0.4,0,0.2,1);
        }
        .sv-card.is-open .sv-panel { grid-template-rows: 1fr; }
        .sv-panel-inner { overflow: hidden; }

        .sv-panel-body {
          padding: 2px 24px 28px 24px;
        }

        /* Separator line between row and panel */
        .sv-panel-body::before {
          content: '';
          display: block;
          height: 1px;
          background: var(--sv-card-border);
          margin-bottom: 22px;
          transition: background 0.3s ease;
        }
        .sv-card.is-open .sv-panel-body::before {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Description */
        .sv-desc {
          font-size: 15px;
          line-height: 1.75;
          color: var(--sv-muted);
          max-width: 560px;
          margin: 0 0 32px;
          transition: color 0.3s ease;
        }
        .sv-card.is-open .sv-desc {
          color: rgba(255, 255, 255, 0.9);
        }

        /* [ ITEM ] chips */
        .sv-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sv-chip {
          font-family: var(--font-sans);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sv-heading);
          background: rgba(255,255,255,0.07);
          border: 1px solid var(--sv-hairline);
          border-radius: 100px;
          padding: 6px 14px;
          white-space: nowrap;
          transition: color 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }
        .sv-card.is-open .sv-chip {
          color: var(--primary);
          background: var(--white);
          border-color: var(--white);
        }

        /* ════════════════════════════════════
           MOBILE  ≤ 768 px
        ════════════════════════════════════ */
        @media (max-width: 960px) {
          .sv-wrap     { padding: 0 28px; }
        }
        @media (max-width: 768px) {
          .sv-section  { padding: 60px 0; }
          .sv-header   { margin-bottom: 44px; }

          .sv-row      { height: 62px; padding: 0 16px; }
          .sv-num      { font-size: 10px; padding: 3px 9px; margin-right: 12px; }
          .sv-dots     { width: 20px; margin-right: 14px; }
          .sv-title    { font-size: 13px; }
          .sv-toggle   { width: 28px; height: 28px; }

          .sv-panel-body { padding: 2px 16px 24px 16px; }
          .sv-desc       { font-size: 13.5px; margin-bottom: 22px; }
          .sv-chip       { font-size: 9.5px; padding: 5px 10px; }

          /* Smaller corner cuts on mobile */
          .sv-card-shell {
            clip-path: polygon(
              12px 0%, 100% 0%,
              100% 100%, 12px 100%,
              0% calc(100% - 12px),
              0% 12px
            );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sv-card, .sv-header { opacity:1 !important; transform:none !important; }
          .sv-panel { transition: none !important; }
        }
      
        /* ── "View service" link inside the open panel ── */
        .sv-more {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 22px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sv-heading);
          border-bottom: 1px solid rgba(255,255,255,0.35);
          padding-bottom: 4px;
          transition: gap 0.2s ease, border-color 0.2s ease;
        }
        .sv-card.is-open .sv-more {
          color: var(--white);
          border-bottom-color: rgba(255,255,255,0.6);
        }
        .sv-more:hover { gap: 12px; border-bottom-color: var(--white); }
        .sv-more:focus-visible {
          outline: 2px solid var(--white);
          outline-offset: 3px;
        }

        /* ── Footer link to the full services page ── */
        .sv-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 40px;
          padding-top: 26px;
          border-top: 1px solid var(--sv-card-border);
        }
        .sv-footer-text {
          font-size: 14px;
          line-height: 1.7;
          color: var(--sv-muted);
          max-width: 460px;
          margin: 0;
        }
        .sv-footer-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--white);
          background: var(--primary);
          border-radius: 999px;
          padding: 15px 30px;
          transition: background 0.2s ease, gap 0.2s ease;
        }
        .sv-footer-link:hover {
          background: var(--primary-hover);
          gap: 14px;
        }
        @media (max-width: 640px) {
          .sv-footer { flex-direction: column; align-items: flex-start; }
          .sv-footer-link { width: 100%; justify-content: center; }
        }
`}</style>

      <section className="sv-section font-sans" id="services" ref={sectionRef} data-in={inView}>
        <div className="sv-wrap">

          {/* ── Header ── */}
          <div className="sv-header">
            <h2 className="sv-heading font-display">
              Design services<br />
              that&nbsp;<span className="dim">drive results</span>
            </h2>
            <p className="sv-subtext">
              From strategy to visuals — we craft designs that elevate brands,
              connect with users, and deliver measurable impact.
            </p>
          </div>

          {/* ── Card list ── */}
          <div className="sv-list">
            {services.map((svc, i) => {
              const isOpen = openIndex === i;
              const num = String(i + 1).padStart(3, "0");
              return (
                <div
                  key={svc.id}
                  className={`sv-card${isOpen ? " is-open" : ""}`}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="sv-card-shell">

                    {/* Always-visible header row */}
                    <div
                      className="sv-row"
                      onClick={() => handleClick(i)}
                      role={isMobile ? "button" : undefined}
                      aria-expanded={isMobile ? isOpen : undefined}
                      aria-controls={`sv-panel-${svc.id}`}
                      tabIndex={isMobile ? 0 : -1}
                      onKeyDown={(e) => {
                        if (isMobile && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault(); handleClick(i);
                        }
                      }}
                    >
                      <span className="sv-num font-mono">{num}</span>
                      <div className="sv-dots" aria-hidden="true" />
                      <span className="sv-title font-display">{svc.name}</span>
                      <div className="sv-toggle" aria-hidden="true">
                        <div className="sv-toggle-bar" />
                      </div>
                    </div>

                    {/* Expandable panel */}
                    <div
                      className="sv-panel"
                      id={`sv-panel-${svc.id}`}
                      aria-hidden={!isOpen}
                    >
                      <div className="sv-panel-inner">
                        <div className="sv-panel-body">
                          <p className="sv-desc">{svc.shortDescription}</p>
                          <div className="sv-chips">
                            {svc.features.map((item) => (
                              <span key={item} className="sv-chip font-sans">{item}</span>
                            ))}
                          </div>
                          <Link
                            href={`/services/${svc.slug}`}
                            className="sv-more"
                            tabIndex={isOpen ? 0 : -1}
                          >
                            View service
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div className="sv-footer">
            <p className="sv-footer-text">
              Every service has its own page with what is included, how we work,
              and the work we are proudest of.
            </p>
            <Link href="/services" className="sv-footer-link">
              All services
              <span aria-hidden="true">→</span>
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}
