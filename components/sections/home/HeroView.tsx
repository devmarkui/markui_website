import Link from "next/link";

import RichText from "@/components/ui/RichText";
import type { HomeContent } from "@/lib/types";

/** Site paths navigate in-app; a full URL opens in a new tab. */
function SmartLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

/**
 * Home-page hero: the headline and call to action on the left, the three
 * things we do on the right.
 *
 * Everything here is CSS-only — the entrance, the drifting decorations and the
 * service a visitor is reading — so the whole hero stays a Server Component and
 * ships no JavaScript. The open service is expressed as a selector rather than
 * state: the list shows the first service until a pointer or keyboard focus
 * picks another one (see `.h-svc-list:not(:hover)` below).
 */
export default function HeroView({ content }: { content: HomeContent }) {
  // The order the three read in on the page. They are read-only: the list says
  // what we do, it does not navigate anywhere.
  const services = [
    { key: "marketing", title: content.marketingTitle, description: content.marketingDescription },
    { key: "it", title: content.itTitle, description: content.itDescription },
    { key: "media", title: content.mediaTitle, description: content.mediaDescription },
  ];

  return (
    <>
      <style>{`
        .h-hero {
          --h-orange: #ff6b00;
          position: relative;
          min-height: 100svh;
          background: var(--h-orange);
          display: flex;
          overflow: hidden;
          font-family: Inter, sans-serif;
        }

        /* ── Background watermark ── */
        .h-watermark {
          position: absolute;
          right: -3%;
          top: 50%;
          transform: translateY(-50%);
          font-family: var(--font-display), Inter, sans-serif;
          font-size: clamp(14rem, 28vw, 30rem);
          font-weight: 900;
          color: rgba(255,255,255,0.045);
          line-height: 0.85;
          letter-spacing: -0.06em;
          text-transform: uppercase;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          opacity: 0;
          animation: h-fade-in 2s ease 0.5s forwards;
        }

        /* ── Grid ── */
        .h-grid { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

        .h-grid-v {
          position: absolute;
          top: 0;
          width: 1px;
          height: 100%;
          background: rgba(255,255,255,0.06);
          transform-origin: top;
          transform: scaleY(0);
          animation: h-grow-y 1.2s ease-out forwards;
        }

        .h-grid-h {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.06);
          transform-origin: left;
          transform: scaleX(0);
          animation: h-grow-x 1.2s ease-out forwards;
        }

        @keyframes h-grow-y { to { transform: scaleY(1); } }
        @keyframes h-grow-x { to { transform: scaleX(1); } }
        @keyframes h-fade-in { to { opacity: 1; } }

        /* ── Floating decorations ── */
        .h-dot-1,
        .h-dot-2,
        .h-cross { position: absolute; z-index: 1; pointer-events: none; }

        .h-dot-1 {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #fff;
          top: 12%; left: 8%;
          animation: h-float-up 4s ease-in-out infinite;
        }

        .h-dot-2 {
          width: 6px; height: 6px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.5);
          top: 25%; left: 45%;
          animation: h-float-down 5s ease-in-out 1s infinite;
        }

        .h-cross {
          bottom: 20%; left: 12%;
          font-size: 2rem;
          font-weight: 200;
          color: rgba(255,255,255,0.2);
          animation: h-spin 12s linear infinite;
        }

        @keyframes h-float-up {
          0%, 100% { transform: translateY(0);     opacity: 0.4; }
          50%      { transform: translateY(-15px); opacity: 0.8; }
        }

        @keyframes h-float-down {
          0%, 100% { transform: translateY(0);    opacity: 0.3; }
          50%      { transform: translateY(12px); opacity: 0.6; }
        }

        @keyframes h-spin { to { transform: rotate(360deg); } }

        /* ── Left column ── */
        /* min-width:0 overrides a flex item's automatic minimum size, which
           otherwise lets a long word push a column wider than the screen. */
        .h-left,
        .h-right { min-width: 0; max-width: 100%; }

        .h-left {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 112px 5vw 60px;
          z-index: 2;
        }

        .h-headline {
          margin: 0;
          font-family: var(--font-display), Inter, sans-serif;
          font-size: clamp(3rem, 6.4vw, 4.5rem);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #fff;
          overflow-wrap: anywhere;
        }

        /* Each heading line rises in turn. RichText renders one .rt-line per line. */
        .h-headline .rt-line {
          opacity: 0;
          animation: h-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
        }

        .h-headline .rt-line:nth-child(2) { animation-delay: 0.35s; }
        .h-headline .rt-line:nth-child(3) { animation-delay: 0.5s; }
        .h-headline .rt-line:nth-child(n+4) { animation-delay: 0.65s; }

        @keyframes h-rise {
          from { opacity: 0; transform: translateY(60px) skewY(3deg); }
          to   { opacity: 1; transform: none; }
        }

        .h-rule {
          width: 60px;
          height: 3px;
          margin-top: 24px;
          border-radius: 2px;
          background: #fff;
          transform: scaleX(0);
          transform-origin: left;
          animation: h-grow-x 0.8s ease 0.8s forwards;
        }

        .h-sub {
          max-width: 400px;
          margin: 24px 0 36px;
          font-size: clamp(0.85rem, 1.2vw, 1rem);
          line-height: 1.7;
          color: rgba(255,255,255,0.75);
          opacity: 0;
          animation: h-rise-sm 0.6s ease 0.7s forwards;
        }

        @keyframes h-rise-sm {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: none; }
        }

        .h-ctas {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
          opacity: 0;
          animation: h-rise-sm 0.5s ease 0.9s forwards;
        }

        .h-cta,
        .h-cta-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 15px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: background 0.3s, border-color 0.3s, transform 0.2s, box-shadow 0.3s;
        }

        .h-cta { background: #fff; color: #0a0a0a; }

        .h-cta:hover {
          background: #f0f0f0;
          transform: scale(1.04);
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }

        .h-cta-icon { font-size: 1.1rem; transition: transform 0.3s; }
        .h-cta:hover .h-cta-icon { transform: translate(2px, -2px); }

        .h-cta-ghost {
          padding: 15px 28px;
          color: #fff;
          border: 2px solid rgba(255,255,255,0.4);
        }

        .h-cta-ghost:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.1);
          transform: scale(1.04);
        }

        .h-cta:active,
        .h-cta-ghost:active { transform: scale(0.96); }

        /* ── Divider ── */
        .h-divider {
          width: 1px;
          margin: 80px 0;
          align-self: stretch;
          background: rgba(255,255,255,0.18);
          transform: scaleY(0);
          transform-origin: top;
          animation: h-grow-y 1s ease 0.5s forwards;
          z-index: 2;
        }

        /* ── Right column ── */
        .h-right {
          flex: 0.9;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          padding: 112px 5vw 60px;
          z-index: 2;
        }

        .h-right-label {
          margin: 0 0 28px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.5);
          opacity: 0;
          animation: h-fade-in 0.5s ease 0.6s forwards;
        }

        .h-svc-list { width: 100%; max-width: min(420px, 100%); }

        .h-svc {
          position: relative;
          padding: 20px 16px;
          margin-bottom: 4px;
          border-radius: 12px;
          opacity: 0;
          transition: padding-left 0.3s, background 0.3s;
          animation: h-slide-in 0.5s ease forwards;
        }

        .h-svc:nth-child(1) { animation-delay: 0.5s; }
        .h-svc:nth-child(2) { animation-delay: 0.6s; }
        .h-svc:nth-child(3) { animation-delay: 0.7s; }

        @keyframes h-slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: none; }
        }

        .h-svc-head {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .h-svc-num {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.4);
          font-size: 0.75rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          transition: border-color 0.3s, color 0.3s, background 0.3s, transform 0.2s;
        }

        .h-svc-title {
          flex: 1;
          font-size: 1.2rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          transition: color 0.3s;
        }

        /* The description opens by animating the row from 0fr to 1fr. */
        .h-svc-desc {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.3s ease, opacity 0.3s ease;
        }

        .h-svc-desc > p {
          overflow: hidden;
          margin: 0;
          padding-left: 48px;
          font-size: 0.82rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.55);
        }

        .h-svc-bar {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 0;
          height: 1px;
          border-radius: 1px;
          background: rgba(255,255,255,0.15);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s;
        }

        /* ── Which service is open ──
           The one under the pointer; otherwise the first one. Nothing here is a
           link — the list only reads, so hovering just opens the description. */
        .h-svc:hover,
        .h-svc-list:not(:hover) .h-svc:first-child {
          padding-left: 24px;
          background: rgba(255,255,255,0.08);
        }

        .h-svc:hover .h-svc-num,
        .h-svc-list:not(:hover) .h-svc:first-child .h-svc-num {
          background: #fff;
          border-color: #fff;
          color: var(--h-orange);
          font-weight: 800;
          transform: scale(1.15);
        }

        .h-svc:hover .h-svc-title,
        .h-svc-list:not(:hover) .h-svc:first-child .h-svc-title { color: #fff; }

        .h-svc:hover .h-svc-desc,
        .h-svc-list:not(:hover) .h-svc:first-child .h-svc-desc {
          grid-template-rows: 1fr;
          opacity: 1;
          padding-top: 10px;
        }

        .h-svc:hover .h-svc-bar,
        .h-svc-list:not(:hover) .h-svc:first-child .h-svc-bar { transform: scaleX(1); }

        /* ── Rotating dashed circles ── */
        .h-circle {
          position: absolute;
          width: 280px;
          height: 280px;
          right: -4%;
          bottom: 2%;
          opacity: 0.7;
          pointer-events: none;
          z-index: 0;
          animation: h-spin 25s linear infinite;
        }

        .h-circle svg { width: 100%; height: 100%; }

        /* ── Touch: nothing hovers, so every service reads open ── */
        @media (hover: none) {
          .h-svc-desc { grid-template-rows: 1fr; opacity: 1; padding-top: 10px; }
          .h-svc-bar  { transform: scaleX(1); }
          .h-svc-title { color: #fff; }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .h-hero { flex-direction: column; }

          .h-watermark {
            font-size: 8rem;
            top: auto;
            bottom: 5%;
            right: -5%;
            transform: none;
          }

          .h-left { padding: 104px 24px 32px; }

          .h-divider {
            width: calc(100% - 48px);
            height: 1px;
            margin: 0 24px;
            align-self: auto;
            transform: scaleX(0);
            transform-origin: left;
            animation-name: h-grow-x;
          }

          .h-right { padding: 32px 24px 60px; }

          .h-headline { font-size: clamp(2.5rem, 11vw, 4rem); }

          .h-ctas { flex-direction: column; align-items: stretch; width: 100%; }

          .h-cta,
          .h-cta-ghost { width: 100%; justify-content: center; }

          .h-circle { width: 180px; height: 180px; right: -5%; bottom: 0; opacity: 0.4; }

          .h-svc { padding: 16px 12px; }

          .h-dot-1, .h-dot-2 { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .h-hero *,
          .h-hero *::before,
          .h-hero *::after {
            animation: none !important;
            transition: none !important;
          }
          /* Anything that animates in has to start visible instead. */
          .h-watermark, .h-sub, .h-ctas, .h-right-label, .h-svc,
          .h-headline .rt-line { opacity: 1; }
          .h-grid-v, .h-divider { transform: scaleY(1); }
          .h-grid-h, .h-rule { transform: scaleX(1); }
        }
      `}</style>

      <section className="h-hero" aria-label="Hero">
        <div className="h-watermark" aria-hidden="true">MARK</div>

        <div className="h-grid" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`v${i}`}
              className="h-grid-v"
              style={{ left: `${((i + 1) * 100) / 13}%`, animationDelay: `${i * 0.06}s` }}
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`h${i}`}
              className="h-grid-h"
              style={{ top: `${((i + 1) * 100) / 9}%`, animationDelay: `${0.3 + i * 0.06}s` }}
            />
          ))}
        </div>

        <div className="h-dot-1" aria-hidden="true" />
        <div className="h-dot-2" aria-hidden="true" />
        <div className="h-cross" aria-hidden="true">+</div>

        {/* ── Headline and calls to action ── */}
        <div className="h-left">
          <h1 className="h-headline">
            <RichText doc={content.heading} />
          </h1>
          <div className="h-rule" aria-hidden="true" />

          <p className="h-sub">
            <RichText doc={content.description} />
          </p>

          <div className="h-ctas">
            <SmartLink
              href={content.ctaLink}
              className="h-cta"
              style={{
                ...(content.ctaSize ? { fontSize: `${content.ctaSize}px` } : {}),
                ...(content.ctaWeight ? { fontWeight: content.ctaWeight } : {}),
                ...(content.ctaColor ? { color: content.ctaColor } : {}),
              }}
            >
              {content.ctaText}
              <span className="h-cta-icon" aria-hidden="true">↗</span>
            </SmartLink>
            <Link href="/projects" className="h-cta-ghost">
              View Projects
            </Link>
          </div>
        </div>

        <div className="h-divider" aria-hidden="true" />

        {/* ── What we do ── */}
        <div className="h-right">
          <p className="h-right-label">WHAT WE DO</p>

          <div className="h-svc-list">
            {services.map((service, i) => (
              <div key={service.key} className="h-svc">
                <div className="h-svc-head">
                  <span className="h-svc-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-svc-title">{service.title}</span>
                </div>
                {service.description ? (
                  <div className="h-svc-desc">
                    <p>{service.description}</p>
                  </div>
                ) : null}
                <span className="h-svc-bar" aria-hidden="true" />
              </div>
            ))}
          </div>

          <div className="h-circle" aria-hidden="true">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="5 10" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 8" />
              <circle cx="100" cy="10" r="5" fill="rgba(255,255,255,0.6)" />
              <circle cx="190" cy="100" r="3" fill="rgba(255,255,255,0.3)" />
            </svg>
          </div>
        </div>
      </section>
    </>
  );
}
