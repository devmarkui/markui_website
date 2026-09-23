import { getSettings } from "@/lib/db";

/**
 * The band under the hero: headline, scrolling client names and stat cards.
 * All of it is edited in the admin dashboard (Trust & Stats), so this reads it
 * from the store on each render.
 */
export default async function Trust() {
  const { trust } = await getSettings();

  const lines = (value: string) =>
    value.split("\n").map((line) => line.trim()).filter(Boolean);

  const darkLines = lines(trust.headingDark);
  const mutedLines = lines(trust.headingMuted);
  const STATS = trust.stats;
  const MARQUEE_LOGOS = trust.logos;

  return (
    <>
      <style>{`
        .ts-section {
          background: var(--white);
          padding: 80px 0 60px;
          overflow: hidden;
        }

        .ts-container {
          max-width: var(--container-width, 1440px);
          margin: 0 auto;
          padding: 0 48px;
        }

        /* ── SPLIT LAYOUT ── */
        .ts-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        /* ── LEFT COLUMN ── */
        .ts-left {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* ── HEADLINE ── */
        .ts-line {
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          display: block;
        }

        .ts-line-dark  { color: var(--text-primary); }
        .ts-line-muted { color: var(--text-muted); }

        /* ── SEPARATOR ── */
        .ts-rule {
          width: 100%;
          height: 1px;
          background: #d8d8d6;
          margin: 32px 0 0;
          flex-shrink: 0;
        }

        /* ── INLINE MARQUEE (constrained to left column) ── */
        .ts-inline-marquee {
          overflow: hidden;
          position: relative;
          margin-top: 28px;
          /* fade both edges within the left column */
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            #000 10%,
            #000 90%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            #000 10%,
            #000 90%,
            transparent 100%
          );
        }

        .ts-inline-track {
          display: flex;
          width: max-content;
          animation: ts-inline-scroll 18s linear infinite;
        }

        .ts-inline-track:hover {
          animation-play-state: paused;
        }

        @keyframes ts-inline-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .ts-inline-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 28px;
          border-right: 1px solid #d0d0ce;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
          letter-spacing: 0.03em;
          line-height: 1.8;
        }

        .ts-inline-item:first-child {
          padding-left: 0;
        }

        .ts-inline-icon {
          font-size: 14px;
          color: var(--text-secondary);
        }

        /* ── RIGHT: STAT CARDS ── */
        .ts-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ts-card {
          background: #fdfdfd;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: var(--radius-md, 20px);
          padding: 22px 22px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 160px;
        }

        .ts-card-top {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ts-card-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-muted);
        }

        .ts-card-label::before {
          content: "";
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: var(--primary);
          flex-shrink: 0;
        }

        .ts-card-value {
          font-size: clamp(2.2rem, 3.8vw, 3.4rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          margin-top: 6px;
        }

        .ts-card-suffix {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .ts-card-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
        }

        .ts-card-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.45;
          max-width: 130px;
        }

        .ts-card-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1.5px solid rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--text-muted);
          flex-shrink: 0;
          background: none;
          transition: border-color var(--transition-fast, 0.2s ease), color var(--transition-fast, 0.2s ease);
          line-height: 1;
          padding: 0;
        }

        .ts-card:hover .ts-card-btn {
          border-color: var(--primary);
          color: var(--primary);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .ts-split { grid-template-columns: 1fr; }
          .ts-container { padding: 0 28px; }
          .ts-inline-marquee { margin-top: 24px; }
        }

        @media (max-width: 560px) {
          .ts-section { padding: 48px 0 40px; }
        }

        @media (max-width: 380px) {
          .ts-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="ts-section font-sans">
        <div className="ts-container">
          <div className="ts-split">

            {/* ── LEFT: Headline + rule + inline marquee ── */}
            <div className="ts-left">
              {darkLines.map((line, i) => (
                <span className="ts-line ts-line-dark font-display" key={`d${i}`}>
                  {line}
                </span>
              ))}
              {mutedLines.map((line, i) => (
                <span className="ts-line ts-line-muted font-display" key={`m${i}`}>
                  {line}
                </span>
              ))}

              {/* Thin separator rule */}
              <div className="ts-rule" aria-hidden="true" />

              {/* Inline logo marquee */}
              <div className="ts-inline-marquee" aria-label="Trusted by">
                <div className="ts-inline-track">
                  {/* Duplicate for seamless loop */}
                  {[...MARQUEE_LOGOS, ...MARQUEE_LOGOS].map((logo, i) => (
                    <span className="ts-inline-item" key={i}>
                      <span className="ts-inline-icon" aria-hidden="true">
                        {logo.icon}
                      </span>
                      {logo.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: 2×2 stat cards ── */}
            <div className="ts-cards">
              {STATS.map((stat, i) => (
                <div className="ts-card" key={`${stat.label}-${i}`}>
                  <div className="ts-card-top">
                    <span className="ts-card-label">{stat.label}</span>
                    <span className="ts-card-value font-display">{stat.value}</span>
                    {stat.suffix && (
                      <span className="ts-card-suffix font-display">{stat.suffix}</span>
                    )}
                  </div>
                  <div className="ts-card-bottom">
                    <span className="ts-card-desc">{stat.description}</span>
                    {/* Decorative corner mark — the cards do not expand. */}
                    <span className="ts-card-btn" aria-hidden="true">
                      {i % 2 === 0 ? "▾" : "+"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}