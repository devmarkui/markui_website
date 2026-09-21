"use client";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const advantages = [
  {
    label: "INTEGRATED TEAM",
    title: "Design + Dev,\nUnder One Roof",
    body: "No handoff chaos — our designers and developers work side by side, so what gets designed is exactly what gets built.",
    num: "01",
  },
  {
    label: "FULL-STACK EXECUTION",
    title: "Strategy to\nExecution",
    body: "From brand identity and UI to code deployment and ad campaigns. One team handles the full stack, start to finish.",
    num: "02",
  },
  {
    label: "CREATIVE ENGINEERING",
    title: "Creative Meets\nTechnology",
    body: "We don't trade beauty for function. Every project fuses cinematic visual thinking with solid, scalable engineering.",
    num: "03",
  },
  {
    label: "RESULTS DRIVEN",
    title: "Results, Not\nJust Visuals",
    body: "We measure success by leads generated and brands elevated — not just how premium it looks on a screen.",
    num: "04",
  },
];

const TICKER_PHRASES = [
  { text: "DESIGN THE FUTURE", accent: false },
  { text: "DEFINE THE EXPERIENCE", accent: true },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function WhyMarkUI() {
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [headingIn, setHeadingIn] = useState(false);
  const [cardsIn, setCardsIn] = useState(false);
  const [ctaIn, setCtaIn] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === headingRef.current && e.isIntersecting) setHeadingIn(true);
          if (e.target === cardsRef.current && e.isIntersecting) setCardsIn(true);
          if (e.target === ctaRef.current && e.isIntersecting) setCtaIn(true);
        });
      },
      { threshold: 0.12 }
    );
    if (headingRef.current) obs.observe(headingRef.current);
    if (cardsRef.current) obs.observe(cardsRef.current);
    if (ctaRef.current) obs.observe(ctaRef.current);
    return () => obs.disconnect();
  }, []);

  // Parallax Scroll Effect for the Headline
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (parallaxRef.current && sectionRef.current) {
            if (window.innerWidth <= 768) {
              parallaxRef.current.style.transform = 'none';
            } else {
              // Read from the static section container to prevent transform jitter
              const rect = sectionRef.current.getBoundingClientRect();
              const offset = (window.innerHeight / 2 - rect.top) * 0.12;
              parallaxRef.current.style.transform = `translateY(${offset}px)`;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll(); // Trigger once on mount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        /* ── SECTION SHELL ── */
        .wmui {
          background: #0a0a0a;
          position: relative;
          overflow: hidden;
          font-family: var(--font-sans);
        }

        /* subtle dot grid texture */
        .wmui::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── TOP HALF: HEADING + CARDS ── */
        .wmui-top {
          position: relative;
          z-index: 1;
          padding: 100px 0 0;
        }

        .wmui-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
        }

        /* ── HEADING ROW ── */
        .wmui-heading-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .wmui-heading-row.in {
          opacity: 1;
          transform: translateY(0);
        }

        .wmui-headline {
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: var(--white);
          margin: 0;
        }
        .wmui-headline em {
          font-style: normal;
          color: var(--primary);
        }

        .wmui-desc {
          max-width: 360px;
          font-size: 15px;
          line-height: 1.72;
          color: var(--text-secondary);
          margin: 0;
          flex-shrink: 0;
        }

        /* ── CARDS GRID ── */
        .wmui-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .wmui-card {
          background: #111111;
          border-right: 1px solid rgba(255,255,255,0.07);
          padding: 32px 28px 28px;
          position: relative;
          overflow: hidden;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(32px);
          transition: background 0.25s ease, opacity 0.6s ease, transform 0.6s ease;
        }
        .wmui-cards.in .wmui-card {
          opacity: 1;
          transform: translateY(0);
        }
        .wmui-card:last-child {
          border-right: none;
        }
        .wmui-card:hover {
          background: #161616;
        }
        .wmui-card:nth-child(1) { transition-delay: 0s, 0.1s, 0.1s; }
        .wmui-card:nth-child(2) { transition-delay: 0s, 0.2s, 0.2s; }
        .wmui-card:nth-child(3) { transition-delay: 0s, 0.3s, 0.3s; }
        .wmui-card:nth-child(4) { transition-delay: 0s, 0.4s, 0.4s; }

        /* orange top line reveal */
        .wmui-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: #ff6b00;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }
        .wmui-card:hover::before {
          transform: scaleX(1);
        }

        /* label row */
        .wmui-card-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 24px;
        }
        .wmui-card-bullet {
          width: 8px;
          height: 8px;
          background: #ff6b00;
          flex-shrink: 0;
        }
        .wmui-card-label-text {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #555555;
        }

        /* card title */
        .wmui-card-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          line-height: 1.15;
          color: #ffffff;
          margin: 0 0 12px;
          white-space: pre-line;
        }

        /* card body */
        .wmui-card-body {
          font-size: 13px;
          line-height: 1.68;
          color: #6b6b6b;
          margin: 0;
          flex: 1;
        }

        /* large faded number */
        .wmui-card-num {
          position: absolute;
          bottom: 12px;
          right: 18px;
          font-family: var(--font-display);
          font-size: 64px;
          font-weight: 900;
          color: rgba(255,255,255,0.04);
          line-height: 1;
          letter-spacing: -0.03em;
          user-select: none;
          transition: color 0.25s ease;
        }
        .wmui-card:hover .wmui-card-num {
          color: rgba(255,107,0,0.06);
        }

        /* ── BOTTOM / CTA SECTION ── */
        .wmui-cta-section {
          position: relative;
          z-index: 1;
          margin-top: 0;
          height: 340px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        /* grayscale bg image overlay */
        .wmui-cta-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom, #0a0a0a 0%, transparent 18%, transparent 82%, #0a0a0a 100%),
            linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 100%);
          z-index: 1;
        }

        /* If no real image is available we show a dark cinematic gradient stand-in */
        .wmui-cta-imgbg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 40%, #1c1410 100%);
          filter: grayscale(1);
          z-index: 0;
        }

        /* When a real image is used, replace the above with:
           background: url('/images/office.jpg') center/cover no-repeat;
        */

        /* ticker strip */
        .wmui-ticker-wrap {
          position: relative;
          z-index: 2;
          width: 100%;
          overflow: hidden;
          display: flex;
        }
        .wmui-ticker-track {
          display: flex;
          white-space: nowrap;
          animation: wmui-ticker 22s linear infinite;
          will-change: transform;
        }
        .wmui-ticker-group {
          display: flex;
          align-items: center;
        }
        .wmui-ticker-item {
          display: flex;
          align-items: center;
          gap: clamp(32px, 5vw, 64px);
          margin-right: clamp(32px, 5vw, 64px);
        }
        .wmui-ticker-text {
          font-family: var(--font-display);
          font-size: clamp(48px, 7vw, 96px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          color: var(--white, #ffffff);
          line-height: 1;
          text-shadow: 0 2px 40px rgba(0,0,0,0.8);
          white-space: nowrap;
        }
        .wmui-ticker-text.wmui-accent {
          color: var(--primary, #ff6b00);
        }
        .wmui-ticker-badge {
          width: clamp(28px, 4vw, 48px);
          height: clamp(28px, 4vw, 48px);
          color: var(--primary, #ff6b00);
          flex-shrink: 0;
        }

        @keyframes wmui-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* CTA button */
        .wmui-cta-btn-wrap {
          position: relative;
          z-index: 2;
          margin-top: 32px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.55s ease 0.2s, transform 0.55s ease 0.2s;
        }
        .wmui-cta-btn-wrap.in {
          opacity: 1;
          transform: translateY(0);
        }

        .wmui-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 36px;
          background: #ffffff;
          color: #0a0a0a;
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wmui-cta-btn:hover {
          background: #ff6b00;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(255,107,0,0.35);
        }

        .wmui-cta-btn-icon {
          width: 18px;
          height: 18px;
          background: #0a0a0a;
          border-radius: 50%;
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s ease;
        }
        .wmui-cta-btn:hover .wmui-cta-btn-icon {
          background: #ffffff;
        }
        .wmui-cta-btn-icon svg {
          width: 9px;
          height: 9px;
          transition: color 0.2s ease;
        }
        .wmui-cta-btn:hover .wmui-cta-btn-icon svg {
          color: #ff6b00;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .wmui-container { padding: 0 28px; }
        }

        @media (max-width: 1024px) {
          .wmui-cards { grid-template-columns: repeat(2, 1fr); }
          .wmui-card:nth-child(2) { border-right: none; }
          .wmui-card:nth-child(3) { border-top: 1px solid rgba(255,255,255,0.07); }
          .wmui-card:nth-child(4) { border-top: 1px solid rgba(255,255,255,0.07); border-right: none; }
        }

        @media (max-width: 768px) {
          .wmui-top { padding: 60px 0 0; }
          .wmui-heading-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 40px;
          }
          .wmui-headline {
            transform: none !important; /* Ensure no transform on mobile */
            will-change: auto; /* Remove will-change on mobile */
          }
          .wmui-cards { grid-template-columns: 1fr; }
          .wmui-card { border-right: none !important; border-top: 1px solid rgba(255,255,255,0.07); }
          .wmui-card:first-child { border-top: none; }
          .wmui-cta-section { height: 300px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wmui-ticker-track { animation: none; }
          .wmui-heading-row,
          .wmui-headline,
          .wmui-card,
          .wmui-cta-btn-wrap {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <section className="wmui" ref={sectionRef} aria-label="Why choose Mark UI">

        {/* ── TOP: HEADING + CARDS ── */}
        <div className="wmui-top">
          <div className="wmui-container">

            {/* Heading Row */}
            <div
              ref={headingRef}
              className={`wmui-heading-row${headingIn ? " in" : ""}`}
            >
              <h2 className="wmui-headline" ref={parallaxRef}>
                Why Choose<br />
                <em>Mark UI</em>
              </h2>
              <p className="wmui-desc">
                We create functional, beautiful digital experiences — designed
                to deliver clarity, innovation, and meaningful impact for
                every client we work with.
              </p>
            </div>

          </div>

          {/* Cards — full width, flush */}
          <div
            ref={cardsRef}
            className={`wmui-cards${cardsIn ? " in" : ""}`}
          >
            {advantages.map((a) => (
              <div className="wmui-card" key={a.num}>
                <div className="wmui-card-label">
                  <div className="wmui-card-bullet" aria-hidden="true" />
                  <span className="wmui-card-label-text">{a.label}</span>
                </div>
                <h3 className="wmui-card-title">{a.title}</h3>
                <p className="wmui-card-body">{a.body}</p>
                <span className="wmui-card-num" aria-hidden="true">{a.num}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM: CTA WITH TICKER ── */}
        <div
          ref={ctaRef}
          className="wmui-cta-section"
        >
          {/* Bg layers */}
          <div className="wmui-cta-imgbg" aria-hidden="true" />
          <div className="wmui-cta-bg" aria-hidden="true" />

          {/*
            TO USE A REAL OFFICE IMAGE, replace .wmui-cta-imgbg with:
            <div style={{
              position:"absolute", inset:0, zIndex:0,
              background:"url('/images/your-office.jpg') center/cover no-repeat",
              filter:"grayscale(1)"
            }} />
          */}

          {/* Marquee ticker */}
          <div className="wmui-ticker-wrap" aria-hidden="true">
            <div className="wmui-ticker-track">
              {[...Array(4)].map((_, i) => (
                <div className="wmui-ticker-group" key={i}>
                  {TICKER_PHRASES.map((phrase, j) => (
                    <div className="wmui-ticker-item" key={j}>
                      <span className={`wmui-ticker-text ${phrase.accent ? "wmui-accent" : ""}`}>
                        {phrase.text}
                      </span>
                      <svg className="wmui-ticker-badge" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" />
                      </svg>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className={`wmui-cta-btn-wrap${ctaIn ? " in" : ""}`}>
            <a href="/contact" className="wmui-cta-btn">
              Work With Us
              <span className="wmui-cta-btn-icon">
                <svg viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M1.5 7.5L7.5 1.5M7.5 1.5H2.5M7.5 1.5V6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </div>
        </div>

      </section>
    </>
  );
}