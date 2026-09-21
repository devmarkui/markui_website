"use client";

import { useState, useEffect, useRef } from "react";

const STEPS = [
  {
    num: "001",
    title: "Discovery Call",
    tag: "Strategy",
    desc: "We start with a focused conversation to understand your business, goals, and vision. No jargon — just clarity on what you need and what success looks like.",
  },
  {
    num: "002",
    title: "Proposal & Scope",
    tag: "Planning",
    desc: "You receive a clear project proposal with timeline, deliverables, and investment. Everything written in plain language so there are no surprises.",
  },
  {
    num: "003",
    title: "Design & Build",
    tag: "Execution",
    desc: "Our team gets to work — design, development, content, and integrations all under one roof. You stay in the loop with regular updates.",
  },
  {
    num: "004",
    title: "Review & Refine",
    tag: "Quality",
    desc: "You review the work, give feedback, and we refine until it is exactly right. We do not ship until you are fully satisfied.",
  },
  {
    num: "005",
    title: "Launch & Support",
    tag: "Growth",
    desc: "We handle a smooth launch, then stay available for questions, tweaks, and ongoing growth. The relationship does not end at delivery.",
  },
];

export default function ProcessSection() {
  const [active, setActive] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  /* reveal on scroll */
  useEffect(() => {
    const items = sectionRef.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.vis = "1";
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .pr-section {
          background: #F4F4F2;
          padding: 80px 0 100px;
          font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
          overflow: hidden;
        }

        .pr-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
        }

        /* ── HEADER ── */
        .pr-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }
        .pr-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .pr-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E8521A;
        }
        .pr-eyebrow-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #AAAAAA;
          font-family: monospace;
        }
        .pr-heading {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--background);
          line-height: 0.95;
        }
        .pr-heading em {
          font-style: normal;
          color: var(--primary);
        }
        .pr-header-sub {
          font-size: 13px;
          line-height: 1.7;
          color: #777;
          max-width: 230px;
          padding-bottom: 4px;
        }

        /* ── STEP CARDS ── */
        .pr-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* reveal */
        [data-reveal] {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        [data-reveal][data-vis="1"] {
          opacity: 1;
          transform: none;
        }
        [data-reveal]:nth-child(1) { transition-delay: 0.04s; }
        [data-reveal]:nth-child(2) { transition-delay: 0.10s; }
        [data-reveal]:nth-child(3) { transition-delay: 0.16s; }
        [data-reveal]:nth-child(4) { transition-delay: 0.22s; }
        [data-reveal]:nth-child(5) { transition-delay: 0.28s; }

        .pr-card {
          background: #F4F4F4;
          border: 1px solid #E0E0E0;
          border-radius: 16px;
          padding: 20px 28px 22px;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
          outline: none;
        }
        .pr-card:hover {
          background: #EFEFEF;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
        }
        .pr-card[data-open="true"] {
          background: #fff;
          border-color: #D4D4D4;
          box-shadow: 0 6px 30px rgba(0,0,0,0.08);
        }
        .pr-card:focus-visible {
          outline: 2px solid #E8521A;
          outline-offset: 2px;
        }

        /* top row: pill + dashed line */
        .pr-card-top {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 16px;
        }

        /* icon+num pill */
        .pr-pill {
          display: inline-flex;
          align-items: center;
          border: 1px solid #DCDCDC;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          flex-shrink: 0;
          transition: border-color 0.2s;
        }
        .pr-card[data-open="true"] .pr-pill { border-color: rgba(232,82,26,0.35); }

        .pr-pill-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F6F6F6;
          border-right: 1px solid #DCDCDC;
          color: #E8521A;
          font-size: 14px;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .pr-card[data-open="true"] .pr-pill-icon {
          background: #E8521A;
          color: #fff;
          border-color: #E8521A;
        }

        .pr-pill-num {
          padding: 0 12px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.09em;
          color: #AAAAAA;
          line-height: 34px;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .pr-card[data-open="true"] .pr-pill-num { color: #E8521A; }

        /* dashed line to right edge */
        .pr-dash {
          flex: 1;
          height: 0;
          border-top: 1.5px dashed #D8D8D8;
          margin-left: 16px;
          transition: border-color 0.2s;
        }
        .pr-card[data-open="true"] .pr-dash { border-color: rgba(232,82,26,0.2); }

        /* title */
        .pr-card-title {
          font-size: clamp(18px, 2vw, 26px);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #111;
          margin: 0;
          line-height: 1.1;
        }

        /* expandable description */
        .pr-card-desc-wrap {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), margin-top 0.3s ease;
          margin-top: 0;
        }
        .pr-card-desc-wrap[data-open="true"] {
          max-height: 140px;
          margin-top: 12px;
        }
        .pr-card-desc {
          font-size: 13.5px;
          line-height: 1.72;
          color: #666;
          max-width: 680px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .pr-container { padding: 0 28px; }
        }
        @media (max-width: 768px) {
          .pr-section { padding: 60px 0 72px; }
          .pr-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .pr-header-sub { max-width: 100%; }
          .pr-card { padding: 16px 18px 18px; }
          .pr-card-title { font-size: 17px; }
        }
        @media (max-width: 480px) {
          .pr-section { padding: 48px 0 60px; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
          .pr-card-desc-wrap { transition: none; }
          .pr-card { transition: none; }
        }
      `}</style>

      <section className="pr-section" ref={sectionRef}>
        <div className="pr-container">

        {/* ── HEADER ── */}
        <div className="pr-header">
          <div>
            <div className="pr-eyebrow">
              <span className="pr-eyebrow-dot" aria-hidden="true" />
              <span className="pr-eyebrow-text">Our Workflow</span>
            </div>
            <h2 className="pr-heading">
              What Happens After<br />
              You <em>Contact</em> Us?
            </h2>
          </div>
          <p className="pr-header-sub">
            A simple 5-step process — from the first call to launch day and beyond.
            No guesswork, no surprises.
          </p>
        </div>

        {/* ── STEPS ── */}
        <ol className="pr-list" aria-label="Our process">
          {STEPS.map((step, i) => {
            const isOpen = active === i;
            return (
              <li
                key={step.num}
                className="pr-card"
                data-reveal
                data-open={isOpen}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => setActive(isOpen ? null : i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(isOpen ? null : i);
                  }
                }}
              >
                <div className="pr-card-top">
                  <div className="pr-pill">
                    <div className="pr-pill-icon" aria-hidden="true">
                      {/* simple step icons */}
                      {i === 0 && "◈"}
                      {i === 1 && "★"}
                      {i === 2 && "⬡"}
                      {i === 3 && "◎"}
                      {i === 4 && "▲"}
                    </div>
                    <span className="pr-pill-num">{step.num}</span>
                  </div>
                  <div className="pr-dash" aria-hidden="true" />
                </div>

                <h3 className="pr-card-title">{step.title}</h3>

                <div
                  className="pr-card-desc-wrap"
                  data-open={isOpen}
                  aria-hidden={!isOpen}
                >
                  <p className="pr-card-desc">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>

        </div>
      </section>
    </>
  );
}