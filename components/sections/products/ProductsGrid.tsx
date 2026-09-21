"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Product } from "@/lib/types";

/**
 * The public /products page. Products are what Mark UI sells; services live on
 * their own page and never appear here. Everything is database-driven.
 */
export default function ProductsGrid({ products }: { products: Product[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.03 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="pg"
      ref={sectionRef}
      data-in={inView}
      aria-labelledby="pg-heading"
    >
      <div className="pg-wrap">
        <header className="pg-header">
          <div>
            <span className="pg-eyebrow">
              <span className="pg-eyebrow-dot" aria-hidden="true" />
              What we sell
            </span>
            <h1 className="pg-heading" id="pg-heading">
              Our<br />
              <em>Products</em>
            </h1>
          </div>
          <p className="pg-subtext">
            Ready-made tools and packages built by our team. Looking for work
            delivered for you instead? That is on the Services page.
          </p>
        </header>

        {products.length === 0 ? (
          <div className="pg-empty">
            <span className="pg-empty-mark" aria-hidden="true">
              ▣
            </span>
            <h2 className="pg-empty-title">Products are on the way</h2>
            <p className="pg-empty-text">
              We are putting the finishing touches to our product line-up. In
              the meantime, everything our team delivers hands-on is listed
              under Services.
            </p>
            <div className="pg-empty-actions">
              <Link href="/services" className="pg-btn pg-btn--primary">
                Explore our services
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/contact" className="pg-btn">
                Talk to us
              </Link>
            </div>
          </div>
        ) : (
          <div className="pg-grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {products.length > 0 ? (
          <div className="pg-foot">
            <p className="pg-foot-text">
              Need something tailored rather than off the shelf? Our services
              team builds to order.
            </p>
            <Link href="/services" className="pg-foot-link">
              View services
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}
      </div>

      <style>{`
        /* ════════════════════════════════════════════
           PRODUCTS
        ════════════════════════════════════════════ */
        .pg {
          --pg-bg:      #0a0a0a;
          --pg-card:    #121212;
          --pg-card-2:  #171717;
          --pg-border:  rgba(255,255,255,0.09);
          --pg-txt:     #ffffff;
          --pg-txt-2:   #a8a8a8;
          --pg-txt-3:   #6f6f6f;
          --pg-accent:  var(--primary, #ff6b00);

          background: var(--pg-bg);
          color: var(--pg-txt);
          font-family: var(--font-sans);
          padding: 156px 0 110px;
          min-height: 100vh;
        }

        .pg-wrap {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
        }

        .pg-header, .pg-grid, .pg-empty, .pg-foot {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .pg[data-in="true"] .pg-header { opacity:1; transform:none; transition-delay:0.05s; }
        .pg[data-in="true"] .pg-grid,
        .pg[data-in="true"] .pg-empty  { opacity:1; transform:none; transition-delay:0.18s; }
        .pg[data-in="true"] .pg-foot   { opacity:1; transform:none; transition-delay:0.3s; }

        .pg-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
          margin-bottom: 56px;
        }

        .pg-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--pg-txt-2);
          border: 1px solid var(--pg-border);
          border-radius: 999px;
          padding: 6px 14px;
          margin-bottom: 24px;
        }

        .pg-eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--pg-accent);
        }

        .pg-heading {
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0;
        }
        .pg-heading em { font-style: normal; color: var(--pg-accent); }

        .pg-subtext {
          font-size: 15px;
          line-height: 1.75;
          color: var(--pg-txt-2);
          max-width: 400px;
          margin: 0 0 8px;
        }

        /* ── Grid ── */
        .pg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
          align-items: start;
        }

        @keyframes pgRise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pg-card {
          display: flex;
          flex-direction: column;
          background: var(--pg-card);
          border: 1px solid var(--pg-border);
          border-radius: 20px;
          overflow: hidden;
          animation: pgRise 0.5s cubic-bezier(0.25,1,0.5,1) backwards;
          animation-delay: calc(var(--i, 0) * 0.06s);
          transition: border-color 0.25s ease, background 0.25s ease;
        }
        .pg-card:hover {
          border-color: rgba(255,107,0,0.4);
          background: var(--pg-card-2);
        }

        .pg-card-visual {
          position: relative;
          aspect-ratio: 16 / 10;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(90% 120% at 25% 0%, #1e1e1e 0%, #0f0f0f 72%);
          border-bottom: 1px solid var(--pg-border);
          overflow: hidden;
        }

        .pg-card-icon {
          font-size: 50px;
          line-height: 1;
          color: var(--pg-accent);
        }

        .pg-card-price {
          position: absolute;
          top: 12px; right: 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #fff;
          background: rgba(0,0,0,0.66);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          padding: 6px 13px;
        }

        .pg-card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 24px;
          flex: 1;
        }

        .pg-card-title {
          font-family: var(--font-display);
          font-size: 21px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .pg-card-desc {
          font-size: 14px;
          line-height: 1.65;
          color: var(--pg-txt-2);
          margin: 0;
        }

        .pg-card-full {
          font-size: 13.5px;
          line-height: 1.75;
          color: var(--pg-txt-2);
          margin: 0;
          padding-top: 12px;
          border-top: 1px solid var(--pg-border);
        }

        .pg-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          list-style: none;
          margin: 2px 0 0;
          padding: 0;
        }

        .pg-chip {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--pg-txt-2);
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--pg-border);
          border-radius: 999px;
          padding: 5px 11px;
        }

        .pg-card-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: auto;
          padding-top: 16px;
        }

        .pg-more {
          background: none;
          border: none;
          padding: 0;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--pg-txt-3);
          cursor: pointer;
          transition: color 0.18s ease;
        }
        .pg-more:hover { color: var(--pg-txt); }

        /* ── Buttons ── */
        .pg-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 13px 26px;
          border-radius: 999px;
          border: 1px solid var(--pg-border);
          color: var(--pg-txt-2);
          transition: color 0.2s ease, border-color 0.2s ease,
                      background 0.2s ease, gap 0.2s ease;
        }
        .pg-btn:hover {
          color: var(--pg-txt);
          border-color: rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.05);
        }

        .pg-btn--primary {
          background: var(--pg-accent);
          border-color: var(--pg-accent);
          color: #fff;
        }
        .pg-btn--primary:hover {
          background: var(--primary-hover, #e55c00);
          border-color: var(--primary-hover, #e55c00);
          color: #fff;
          gap: 13px;
        }
        .pg-btn:focus-visible, .pg-more:focus-visible, .pg-foot-link:focus-visible {
          outline: 2px solid var(--pg-accent);
          outline-offset: 3px;
        }

        /* ── Empty state ── */
        .pg-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 92px 28px;
          border: 1px dashed var(--pg-border);
          border-radius: 24px;
          background:
            radial-gradient(70% 100% at 50% 0%, rgba(255,107,0,0.07), transparent 70%);
        }

        .pg-empty-mark {
          font-size: 46px;
          line-height: 1;
          color: var(--pg-accent);
          opacity: 0.85;
          margin-bottom: 22px;
        }

        .pg-empty-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 3.4vw, 36px);
          font-weight: 800;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin: 0 0 14px;
        }

        .pg-empty-text {
          font-size: 15px;
          line-height: 1.75;
          color: var(--pg-txt-2);
          max-width: 46ch;
          margin: 0 0 30px;
        }

        .pg-empty-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* ── Foot ── */
        .pg-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 48px;
          padding-top: 26px;
          border-top: 1px solid var(--pg-border);
        }

        .pg-foot-text {
          font-size: 14px;
          line-height: 1.7;
          color: var(--pg-txt-2);
          max-width: 460px;
          margin: 0;
        }

        .pg-foot-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--pg-accent);
          border: 1px solid rgba(255,107,0,0.35);
          border-radius: 999px;
          padding: 13px 26px;
          transition: background 0.2s ease, gap 0.2s ease;
        }
        .pg-foot-link:hover { background: rgba(255,107,0,0.12); gap: 13px; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .pg-wrap { padding: 0 28px; }
        }

        @media (max-width: 640px) {
          .pg { padding: 116px 0 72px; }
          .pg-header { margin-bottom: 36px; }
          .pg-heading { font-size: clamp(40px, 12vw, 58px); }
          .pg-subtext { max-width: 100%; }
          .pg-grid { grid-template-columns: 1fr; }
          .pg-card-body { padding: 20px; }
          .pg-empty { padding: 64px 20px; }
          .pg-empty-actions .pg-btn { flex: 1 1 100%; justify-content: center; }
          .pg-foot { flex-direction: column; align-items: flex-start; }
          .pg-foot-link { width: 100%; justify-content: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pg-header, .pg-grid, .pg-empty, .pg-foot, .pg-card {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasDetail =
    Boolean(product.fullDescription) &&
    product.fullDescription !== product.shortDescription;

  return (
    <article
      className="pg-card"
      style={{ "--i": Math.min(index, 11) } as React.CSSProperties}
    >
      <div className="pg-card-visual">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            priority={index === 0}
          />
        ) : (
          <span className="pg-card-icon" aria-hidden="true">
            {product.icon || "▣"}
          </span>
        )}
        {product.price ? (
          <span className="pg-card-price">{product.price}</span>
        ) : null}
      </div>

      <div className="pg-card-body">
        <h2 className="pg-card-title">{product.name}</h2>
        <p className="pg-card-desc">{product.shortDescription}</p>

        {hasDetail && expanded ? (
          <p className="pg-card-full">{product.fullDescription}</p>
        ) : null}

        {product.features.length ? (
          <ul className="pg-chips">
            {(expanded ? product.features : product.features.slice(0, 4)).map(
              (feature) => (
                <li className="pg-chip" key={feature}>
                  {feature}
                </li>
              ),
            )}
            {!expanded && product.features.length > 4 ? (
              <li className="pg-chip">+{product.features.length - 4}</li>
            ) : null}
          </ul>
        ) : null}

        <div className="pg-card-actions">
          {product.link ? (
            <a
              className="pg-btn pg-btn--primary"
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {product.ctaLabel || "Learn more"}
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <Link href="/contact" className="pg-btn pg-btn--primary">
              {product.ctaLabel || "Enquire now"}
              <span aria-hidden="true">→</span>
            </Link>
          )}

          {hasDetail || product.features.length > 4 ? (
            <button
              type="button"
              className="pg-more"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Less −" : "Details +"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
