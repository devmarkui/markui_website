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
    // Add /public/insights/article-1.jpg and put the path back to show a photo.
    image: "",
    tall: false,
  },
  {
    id: 2,
    date: "NOVEMBER 12, 2025",
    title: "Branding Is a System,\nNot just a Logo",
    slug: "/insights/branding-is-a-system",
    // Add /public/insights/article-2.jpg and put the path back to show a photo.
    image: "",
    tall: true,
  },
  {
    id: 3,
    date: "OCT 24, 2025",
    title: "Clarity Is the New Advantage",
    slug: "/insights/clarity-is-the-new-advantage",
    // Add /public/insights/article-3.jpg and put the path back to show a photo.
    image: "",
    tall: false,
  },
  {
    id: 4,
    date: "OCTOBER 11, 2025",
    title: "From Aesthetic to Experience",
    slug: "/insights/from-aesthetic-to-experience",
    // Add /public/insights/article-4.jpg and put the path back to show a photo.
    image: "",
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
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&display=swap');

        /* ── SECTION ── */
        .art-section {
          background: #f0efed;
          padding: 72px 0 0;
          font-family: 'Barlow', sans-serif;
          overflow: hidden;
        }

        /* ── CONTAINER ── */
        .art-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 40px;
        }

        /* ── TOP ROW ── */
        .art-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .art-top.in {
          opacity: 1;
          transform: translateY(0);
        }

        /* left: badge + headline */
        .art-top-left {}

        .art-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .art-badge-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e03020;
          flex-shrink: 0;
        }
        .art-badge-count {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          letter-spacing: 0.04em;
        }
        .art-badge-label {
          font-size: 13px;
          font-weight: 500;
          color: #111;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .art-headline {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(52px, 6.5vw, 96px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 0.9;
          color: #111111;
          margin: 0;
        }

        /* right: description + CTA button */
        .art-top-right {
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .art-desc {
          font-size: 15px;
          line-height: 1.68;
          color: #555555;
          max-width: 440px;
          margin: 0;
        }

        .art-all-btn {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #111111;
          color: #ffffff;
          padding: 20px 28px;
          border-radius: 100px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          width: 100%;
          max-width: 480px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .art-all-btn:hover {
          background: #222;
          transform: translateY(-1px);
        }
        .art-all-btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
          color: #fff;
        }

        /* ── CARDS GRID ── */
        /*
          4-column grid where:
          col 1 → short card (image crops at ~260px, title below)
          col 2 → tall card (taller image, title below image)
          col 3 → short card
          col 4 → short card
          The tall card in col 2 extends further down visually.
        */
        .art-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: start;
          /* hairline column separators */
          gap: 0;
        }

        /* ── CARD ── */
        .art-card {
          border-left: 1px solid rgba(0,0,0,0.1);
          padding: 0 0 40px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .art-card:last-child {
          border-right: 1px solid rgba(0,0,0,0.1);
        }
        .art-card.in {
          opacity: 1;
          transform: translateY(0);
        }
        /* stagger delays */
        .art-card:nth-child(1) { transition-delay: 0.05s; }
        .art-card:nth-child(2) { transition-delay: 0.12s; }
        .art-card:nth-child(3) { transition-delay: 0.19s; }
        .art-card:nth-child(4) { transition-delay: 0.26s; }

        .art-card a {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        /* date row */
        .art-card-date-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          margin-bottom: 0;
        }
        .art-card-date-icon {
          width: 14px;
          height: 14px;
          background: #e03020;
          flex-shrink: 0;
          border-radius: 2px;
        }
        .art-card-date {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #444;
        }

        /* image */
        .art-card-img {
          width: 100%;
          overflow: hidden;
          display: block;
          position: relative;
          background: #1a1a1a;
        }
        /* short card image height */
        .art-card-img.short {
          height: 260px;
        }
        /* tall card image height */
        .art-card-img.tall {
          height: 380px;
        }
        .art-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.5s ease;
          filter: grayscale(1);
        }
        .art-card:hover .art-card-img img {
          transform: scale(1.04);
        }

        /* Shown until a real article image exists in /public/insights */
        .art-card-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(90% 120% at 30% 10%, #232323 0%, #141414 70%);
        }
        .art-card-placeholder span {
          font-family: var(--font-display);
          font-size: 54px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.08);
        }

        /* title */
        .art-card-title {
          font-size: 15px;
          font-weight: 500;
          line-height: 1.45;
          color: #111;
          margin: 0;
          padding: 18px 20px 0;
          white-space: pre-line;
          transition: color 0.2s ease;
        }
        .art-card:hover .art-card-title {
          color: #e03020;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .art-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .art-card:nth-child(2) { border-right: 1px solid rgba(0,0,0,0.1); }
          .art-card:nth-child(3) { border-top: 1px solid rgba(0,0,0,0.1); }
          .art-card:nth-child(4) {
            border-right: 1px solid rgba(0,0,0,0.1);
            border-top: 1px solid rgba(0,0,0,0.1);
          }
          .art-card-img.tall { height: 320px; }
        }

        @media (max-width: 768px) {
          .art-container { padding: 0 20px; }
          .art-section { padding: 56px 0 0; }

          .art-top {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .art-all-btn { max-width: 100%; }

          .art-grid {
            grid-template-columns: 1fr;
          }
          .art-card {
            border-left: none;
            border-right: none !important;
            border-top: 1px solid rgba(0,0,0,0.1);
          }
          .art-card:first-child { border-top: none; }
          .art-card-img.short,
          .art-card-img.tall { height: 220px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .art-top,
          .art-card {
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
                <span className="art-badge-count">{TOTAL_ARTICLES}</span>
                <span className="art-badge-label">Insights</span>
              </div>
              <h2 className="art-headline">
                Latest From<br />Our Studio.
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
                <span className="art-all-btn-icon" aria-hidden="true">+</span>
              </Link>
            </div>

          </div>

        </div>

        {/* ── CARDS GRID (full-width, flush to section edges) ── */}
        <div className="art-grid">
          {articles.map((article, i) => (
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
                <div className={`art-card-img ${article.tall ? "tall" : "short"}`}>
                  {article.image ? (
                    <Image
                      src={article.image}
                      alt={article.title.replace("\n", " ")}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="art-card-placeholder" aria-hidden="true">
                      <span>{String(article.id).padStart(2, "0")}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <p className="art-card-title">{article.title}</p>

              </Link>
            </div>
          ))}
        </div>

      </section>
    </>
  );
}