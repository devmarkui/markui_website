"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * The /products-services landing page.
 *
 * Its whole job is to send visitors down one of two clearly separate routes —
 * Products or Services — so the two are never mixed in a single grid.
 */

interface Panel {
  key: "products" | "services";
  index: string;
  title: string;
  lede: string;
  href: string;
  count: number;
  countLabel: string;
  highlights: string[];
}

export default function ProductsServicesHub({
  productCount,
  serviceCount,
  serviceNames,
  productNames,
}: {
  productCount: number;
  serviceCount: number;
  serviceNames: string[];
  productNames: string[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState<Panel["key"] | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.04 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const panels: Panel[] = [
    {
      key: "products",
      index: "01",
      title: "Products",
      lede: "Ready-made tools and packages built by Mark UI, priced and ready to put to work.",
      href: "/products",
      count: productCount,
      countLabel: productCount === 1 ? "Product" : "Products",
      highlights: productNames.slice(0, 4),
    },
    {
      key: "services",
      index: "02",
      title: "Services",
      lede: "Professional services we deliver for you — strategy, design, production and build.",
      href: "/services",
      count: serviceCount,
      countLabel: serviceCount === 1 ? "Service" : "Services",
      highlights: serviceNames.slice(0, 4),
    },
  ];

  return (
    <section
      className="psh"
      ref={sectionRef}
      data-in={inView}
      data-hovered={hovered ?? ""}
      aria-labelledby="psh-heading"
    >
      <div className="psh-wrap">
        <header className="psh-header">
          <span className="psh-eyebrow">
            <span className="psh-eyebrow-dot" aria-hidden="true" />
            What we offer
          </span>
          <h1 className="psh-heading" id="psh-heading">
            Products &amp;<br />
            <em>Services</em>
          </h1>
          <p className="psh-subtext">
            Two different things, kept separate on purpose. Products are what we
            have built and you can buy. Services are what our team does for you.
            Pick the one you came for.
          </p>
        </header>

        <div className="psh-panels">
          {panels.map((panel) => (
            <Link
              key={panel.key}
              href={panel.href}
              className="psh-panel"
              data-key={panel.key}
              onMouseEnter={() => setHovered(panel.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(panel.key)}
              onBlur={() => setHovered(null)}
            >
              <span className="psh-panel-index">{panel.index}</span>

              <div className="psh-panel-main">
                <h2 className="psh-panel-title">{panel.title}</h2>
                <p className="psh-panel-lede">{panel.lede}</p>

                {panel.highlights.length ? (
                  <ul className="psh-panel-list">
                    {panel.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    {panel.count > panel.highlights.length ? (
                      <li className="psh-panel-more">
                        +{panel.count - panel.highlights.length} more
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="psh-panel-empty">
                    Nothing listed here yet — check back soon.
                  </p>
                )}
              </div>

              <div className="psh-panel-foot">
                <span className="psh-panel-count">
                  <strong>{panel.count}</strong> {panel.countLabel}
                </span>
                <span className="psh-panel-cta">
                  View {panel.title.toLowerCase()}
                  <span className="psh-panel-arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        /* ════════════════════════════════════════════
           PRODUCTS & SERVICES — LANDING
        ════════════════════════════════════════════ */
        .psh {
          --psh-bg:      #0a0a0a;
          --psh-panel:   #121212;
          --psh-panel-2: #171717;
          --psh-border:  rgba(255,255,255,0.09);
          --psh-txt:     #ffffff;
          --psh-txt-2:   #a8a8a8;
          --psh-txt-3:   #6f6f6f;
          --psh-accent:  var(--primary, #ff6b00);

          background: var(--psh-bg);
          color: var(--psh-txt);
          font-family: var(--font-sans);
          padding: 156px 0 110px;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        /* Soft orange wash behind the header */
        .psh::before {
          content: "";
          position: absolute;
          top: -25%; left: 50%;
          width: 900px; height: 700px;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(255,107,0,0.13) 0%,
            transparent 62%
          );
          pointer-events: none;
        }

        .psh-wrap {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
          position: relative;
          z-index: 1;
        }

        /* ── Header ── */
        .psh-header, .psh-panels {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .psh[data-in="true"] .psh-header { opacity:1; transform:none; transition-delay:0.05s; }
        .psh[data-in="true"] .psh-panels { opacity:1; transform:none; transition-delay:0.18s; }

        .psh-header {
          margin-bottom: 64px;
          max-width: 720px;
        }

        .psh-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--psh-txt-2);
          border: 1px solid var(--psh-border);
          border-radius: 999px;
          padding: 6px 14px;
          margin-bottom: 24px;
        }

        .psh-eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--psh-accent);
        }

        .psh-heading {
          font-family: var(--font-display);
          font-size: clamp(44px, 7vw, 96px);
          font-weight: 800;
          line-height: 0.92;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0 0 22px;
        }
        .psh-heading em { font-style: normal; color: var(--psh-accent); }

        .psh-subtext {
          font-size: 15px;
          line-height: 1.75;
          color: var(--psh-txt-2);
          max-width: 540px;
        }

        /* ── Panels ── */
        .psh-panels {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .psh-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 28px;
          min-height: 460px;
          padding: 36px;
          border: 1px solid var(--psh-border);
          border-radius: 22px;
          background: var(--psh-panel);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition:
            background 0.35s ease,
            border-color 0.35s ease,
            transform 0.35s cubic-bezier(0.25,1,0.5,1);
        }

        /* Dim the panel that is not being pointed at */
        .psh[data-hovered="products"] .psh-panel[data-key="services"],
        .psh[data-hovered="services"] .psh-panel[data-key="products"] {
          opacity: 0.55;
        }

        .psh-panel:hover,
        .psh-panel:focus-visible {
          background: var(--psh-panel-2);
          border-color: rgba(255,107,0,0.45);
          transform: translateY(-4px);
          outline: none;
        }

        /* Orange sweep that rises on hover */
        .psh-panel::after {
          content: "";
          position: absolute;
          inset: auto 0 0 0;
          height: 3px;
          background: var(--psh-accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.45s cubic-bezier(0.25,1,0.5,1);
        }
        .psh-panel:hover::after,
        .psh-panel:focus-visible::after { transform: scaleX(1); }

        .psh-panel-index {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: var(--psh-txt-3);
        }

        .psh-panel-main { flex: 1; }

        .psh-panel-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 4.6vw, 58px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin: 0 0 16px;
          transition: color 0.3s ease;
        }
        .psh-panel:hover .psh-panel-title { color: var(--psh-accent); }

        .psh-panel-lede {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--psh-txt-2);
          max-width: 46ch;
          margin: 0 0 24px;
        }

        .psh-panel-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .psh-panel-list li {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--psh-txt-2);
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--psh-border);
          border-radius: 999px;
          padding: 6px 12px;
        }

        .psh-panel-more {
          color: var(--psh-accent) !important;
          border-color: rgba(255,107,0,0.35) !important;
          background: rgba(255,107,0,0.10) !important;
        }

        .psh-panel-empty {
          font-size: 13px;
          color: var(--psh-txt-3);
          margin: 0;
        }

        .psh-panel-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 22px;
          border-top: 1px solid var(--psh-border);
        }

        .psh-panel-count {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--psh-txt-3);
        }
        .psh-panel-count strong {
          color: var(--psh-txt);
          font-size: 15px;
          font-weight: 700;
          margin-right: 2px;
        }

        .psh-panel-cta {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--psh-accent);
        }

        .psh-panel-arrow {
          transition: transform 0.25s ease;
          font-size: 14px;
        }
        .psh-panel:hover .psh-panel-arrow { transform: translateX(5px); }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .psh-wrap { padding: 0 28px; }
          .psh-panels { grid-template-columns: minmax(0, 1fr); }
          .psh-panel { min-height: 0; padding: 30px; }
          /* Dimming the other panel makes no sense once they are stacked. */
          .psh[data-hovered] .psh-panel { opacity: 1; }
        }

        @media (max-width: 640px) {
          .psh { padding: 116px 0 72px; }
          .psh-header { margin-bottom: 40px; }
          .psh-heading { font-size: clamp(40px, 12vw, 60px); }
          .psh-panel { padding: 24px; gap: 22px; }
          .psh-panel-foot { flex-direction: column; align-items: flex-start; gap: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .psh-header, .psh-panels, .psh-panel, .psh-panel::after,
          .psh-panel-arrow {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .psh-panel::after { transform: scaleX(1) !important; }
        }
      `}</style>
    </section>
  );
}
