"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const articles = [
  {
    id: 1,
    date: "NOVEMBER 18, 2025",
    title: "The Rules of Modern Branding",
    slug: "/insights/rules-of-modern-branding",
    image: "/insights/article-1.jpg",
    tall: false,
  },
  {
    id: 2,
    date: "NOVEMBER 12, 2025",
    title: "Branding Is a System,\nNot just a Logo",
    slug: "/insights/branding-is-a-system",
    image: "/insights/article-2.jpg",
    tall: true,
  },
  {
    id: 3,
    date: "OCT 24, 2025",
    title: "Clarity Is the New Advantage",
    slug: "/insights/clarity-is-the-new-advantage",
    image: "/insights/article-3.jpg",
    tall: false,
  },
  {
    id: 4,
    date: "OCTOBER 11, 2025",
    title: "From Aesthetic to Experience",
    slug: "/insights/from-aesthetic-to-experience",
    image: "/insights/article-4.jpg",
    tall: false,
  },
];

const TOTAL_ARTICLES = 11;

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function Articles() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.06 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        /* ── SECTION ── */
        .art-section {
          background: var(--background);
          padding: var(--section-space-md) 0 0;
          overflow: hidden;
          position: relative;
        }

        /* subtle top border to separate from previous section */
        .art-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 40px;
          right: 40px;
          height: 1px;
          background: var(--border);
        }

        /* ── CONTAINER ── */
        .art-container {
          max-width: var(--container-width);
          margin: 0 auto;
          padding: 0 40px;
        }

        /* ── TOP ROW ── */
        .art-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .art-top.in {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── BADGE ── */
        .art-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 6px 14px 6px 10px;
        }
        .art-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(255, 107, 0, 0.6);
        }
        .art-badge-text {
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .art-badge-count {
          color: var(--primary);
        }

        /* ── HEADLINE ── */
        .art-headline {
          font-family: var(--font-display);
          font-size: clamp(48px, 5.5vw, 88px);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 0.92;
          color: var(--text-primary);
          margin: 0;
        }
        .art-headline span {
          color: var(--primary);
        }

        /* ── RIGHT SIDE ── */
        .art-top-right {
          padding-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .art-desc {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 420px;
          margin: 0;
        }

        /* ── CTA BUTTON ── */
        .art-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          gap: 12px;
          background: var(--primary);
          color: var(--white);
          padding: 12px 16px 12px 22px;
          padding: 8px 12px 8px 18px;
          border-radius: var(--radius-xl);
          font-family: var(--font-display);
          font-size: 13px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          width: fit-content;
          transition: background var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
        }
        .art-all-btn:hover {
          background: var(--primary-hover);
          box-shadow: var(--shadow-orange);
          transform: translateY(-2px);
        }
        .art-all-btn-icon {
          width: 28px;
          height: 28px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--white);
          transition: background var(--transition-fast);
        }
        .art-all-btn:hover .art-all-btn-icon {
          background: rgba(255,255,255,0.25);
        }

        /* ── CARDS GRID ── */
        .art-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        /* ── CARD ── */
        .art-card {
          border-left: 1px solid var(--border);
          padding-bottom: 0;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .art-card:last-child {
          border-right: 1px solid var(--border);
        }
        .art-card.in {
          opacity: 1;
          transform: translateY(0);
        }
        .art-card:nth-child(1) { transition-delay: 0.05s; }
        .art-card:nth-child(2) { transition-delay: 0.13s; }
        .art-card:nth-child(3) { transition-delay: 0.21s; }
        .art-card:nth-child(4) { transition-delay: 0.29s; }

        .art-card a {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-decoration: none;
          color: inherit;
        }

        /* ── DATE ROW ── */
        .art-card-date-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px 15px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }
        .art-card-date-icon {
          width: 6px;
          height: 6px;
          background: var(--primary);
          flex-shrink: 0;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(255,107,0,0.5);
        }
        .art-card-date {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        /* ── IMAGE ── */
        .art-card-img {
          width: 100%;
          height: 190px;
          overflow: hidden;
          display: block;
          position: relative;
          background: var(--card);
        }
        .art-card-img.short { height: 200px; }
        .art-card-img.tall  { height: 260px; }

        .art-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.55s ease;
          filter: grayscale(0.3) brightness(0.85);
        }
        .art-card:hover .art-card-img img {
          transform: scale(1.05);
          filter: grayscale(0) brightness(1);
        }

        /* orange overlay tint on hover */
        .art-card-img::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(255,107,0,0.18) 0%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity var(--transition-normal);
          pointer-events: none;
        }
        .art-card:hover .art-card-img::after {
          opacity: 1;
        }

        /* ── TITLE ── */
        .art-card-body {
          padding: 20px 20px 28px;
          padding: 16px 18px 22px;
          border-bottom: 1px solid var(--border);
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .art-card-title {
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
          color: var(--text-primary);
          margin: 0 0 16px;
          white-space: pre-line;
          transition: color var(--transition-fast);
        }
        .art-card:hover .art-card-title {
          color: var(--primary);
        }

        .art-card-arrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          transition: color var(--transition-fast), gap var(--transition-fast);
        }
        .art-card:hover .art-card-arrow {
          color: var(--primary);
          gap: 10px;
        }
        .art-card-arrow svg {
          transition: transform var(--transition-fast);
        }
        .art-card:hover .art-card-arrow svg {
          transform: translateX(3px);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .art-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .art-card:nth-child(2) { border-right: 1px solid var(--border); }
          .art-card:nth-child(3) { border-top: 1px solid var(--border); }
          .art-card:nth-child(4) {
            border-right: 1px solid var(--border);
            border-top: 1px solid var(--border);
          }
          .art-card-img.short { height: 200px; }
          .art-card-img.tall  { height: 240px; }
        }

        @media (max-width: 768px) {
          .art-container { padding: 0 20px; }
          .art-section { padding: 80px 0 0; }
          .art-section::before { left: 20px; right: 20px; }

          .art-top {
            grid-template-columns: 1fr;
            gap: 28px;
            margin-bottom: 48px;
          }

          .art-grid { grid-template-columns: 1fr; }
          .art-card {
            border-left: none;
            border-right: none !important;
            border-top: 1px solid var(--border);
          }
          .art-card:first-child { border-top: none; }
          .art-card-img.short,
          .art-card-img.tall { height: 220px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .art-top, .art-card {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <section className="art-section" ref={sectionRef} aria-label="Latest Insights">
        <div className="art-container">

          {/* ── TOP ROW ── */}
          <div className={`art-top${visible ? " in" : ""}`}>

            {/* Left */}
            <div className="art-top-left">
              <div className="art-badge" aria-label={`${TOTAL_ARTICLES} Insights`}>
                <div className="art-badge-dot" aria-hidden="true" />
                <span className="art-badge-text">
                  <span className="art-badge-count">{TOTAL_ARTICLES}</span> Insights
                </span>
              </div>
              <h2 className="art-headline">
                Latest<br />From Our<br /><span>Studio.</span>
              </h2>
            </div>

            {/* Right */}
            <div className="art-top-right">
              <p className="art-desc">
                Ideas, strategies, and innovative creative explorations shaping the
                future of design, emerging technology, and digital experiences.
              </p>
              <Link href="/insights" className="art-all-btn">
                All Articles
                <span className="art-all-btn-icon" aria-hidden="true">
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</span>
              </Link>
            </div>

          </div>

        </div>

        {/* ── CARDS GRID ── */}
        <div className="art-grid">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`art-card${visible ? " in" : ""}`}
            >
              <Link href={article.slug} aria-label={article.title.replace("\n", " ")}>

                {/* Date */}
                <div className="art-card-date-row">
                  <div className="art-card-date-icon" aria-hidden="true" />
                  <span className="art-card-date">{article.date}</span>
                </div>

                {/* Image */}
                <div className="art-card-img">
                  <Image
                    src={article.image}
                    alt={article.title.replace("\n", " ")}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Body */}
                <div className="art-card-body">
                  <p className="art-card-title">{article.title}</p>
                  <span className="art-card-arrow">
                    Read more
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>

              </Link>
            </div>
          ))}
        </div>

      </section>
    </>
  );
}
