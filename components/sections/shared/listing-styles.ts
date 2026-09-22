/**
 * Styles for the editorial list pages — /services and /products.
 *
 * Both pages share one visual system (white page, full-width bands, info on
 * the left and a media grid on the right), so they share one stylesheet and
 * cannot drift apart. Page-specific additions live in each component.
 */
export const LISTING_CSS = `
        /* ════════════════════════════════════════════
           SERVICES LIST — light, editorial
        ════════════════════════════════════════════ */
        .sl {
          --sl-bg:      #ffffff;
          --sl-soft:    #f4f4f4;
          --sl-border:  rgba(0,0,0,0.10);
          --sl-line:    rgba(0,0,0,0.07);
          --sl-txt:     var(--text-primary, #0a0a0a);
          --sl-txt-2:   var(--text-secondary, #4a4a4a);
          --sl-txt-3:   var(--text-muted, #737373);
          --sl-accent:  var(--primary, #ff6b00);
          --sl-gutter:  48px;

          background: var(--sl-bg);
          color: var(--sl-txt);
          font-family: var(--font-sans);
          padding: 136px 0 96px;
          min-height: 100vh;
        }

        /* The site grid: same box the Home sections and navbar sit in. */
        .sl-wrap,
        .sl-row-inner {
          max-width: var(--container-width, 1440px);
          margin: 0 auto;
          padding: 0 var(--sl-gutter);
        }

        /* ── Reveal ── */
        .sl-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.6s ease,
            transform 0.6s cubic-bezier(0.25,1,0.5,1);
        }
        .sl-reveal[data-in="true"] { opacity: 1; transform: none; }

        /* ── Header ── */
        .sl-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
          margin-bottom: 56px;
        }

        .sl-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--sl-txt-3);
          margin-bottom: 20px;
        }
        .sl-eyebrow::before {
          content: "";
          width: 8px; height: 8px;
          border-radius: 2px;
          background: var(--sl-accent);
          flex-shrink: 0;
        }

        .sl-heading {
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0;
        }
        .sl-heading em,
        .sl-cta-heading em { font-style: normal; color: var(--sl-accent); }

        .sl-subtext {
          font-size: 15px;
          line-height: 1.75;
          color: var(--sl-txt-2);
          max-width: 440px;
          margin: 0 0 6px;
        }

        /* ── Orange page header ──
           The opening band on Projects, Products and Services. It runs the
           full page width and starts under the fixed navbar, so the section
           drops its own top padding when it has one. */
        .sl:has(> .sl-band) { padding-top: 0; }
        .sl-band {
          background: var(--sl-accent);
          color: #ffffff;
          padding: 136px 0 56px;
        }
        .sl-band .sl-header { margin-bottom: 0; }
        .sl-band .sl-eyebrow { color: rgba(255,255,255,0.85); }
        .sl-band .sl-eyebrow::before { background: #ffffff; }
        .sl-band .sl-heading em { color: #0a0a0a; }
        .sl-band .sl-subtext { color: rgba(255,255,255,0.9); }
        .sl-band + .sl-wrap { padding-top: 48px; }
        .sl-band + .sl-list { border-top: 0; }

        /* ── Service bands ──
           Rules span the full page width; the content inside them sits on
           the site grid, so there is no box floating inside another box. */
        .sl-list { border-top: 1px solid var(--sl-border); }

        .sl-row { border-bottom: 1px solid var(--sl-border); }

        .sl-row-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }

        /* ── Left: details ── */
        .sl-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 64px 56px 64px 0;
        }

        .sl-info-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .sl-index {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--sl-accent);
        }

        .sl-tags {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sl-txt-3);
          margin: 0;
        }

        .sl-name {
          font-family: var(--font-display);
          font-size: clamp(30px, 3.4vw, 48px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0 0 20px;
          overflow-wrap: anywhere;
        }

        .sl-short {
          font-size: 17px;
          line-height: 1.6;
          color: var(--sl-txt);
          margin: 0 0 12px;
          max-width: 580px;
        }

        .sl-full {
          font-size: 14.5px;
          line-height: 1.75;
          color: var(--sl-txt-2);
          margin: 0 0 32px;
          max-width: 580px;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sl-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--sl-accent);
          margin: 0 0 12px;
        }

        .sl-features {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 32px;
          margin: 0 0 36px;
          padding: 0;
        }
        .sl-features li {
          font-size: 14px;
          line-height: 1.5;
          color: var(--sl-txt);
          padding: 11px 0;
          border-bottom: 1px solid var(--sl-line);
        }

        .sl-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          align-self: flex-start;
          margin-top: auto;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--sl-txt);
          border: 1px solid var(--sl-txt);
          border-radius: 2px;
          padding: 14px 24px;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .sl-btn:hover,
        .sl-btn:focus-visible {
          background: var(--sl-accent);
          border-color: var(--sl-accent);
          color: #fff;
          outline: none;
        }
        .sl-btn--solid {
          background: var(--sl-accent);
          border-color: var(--sl-accent);
          color: #fff;
        }
        .sl-btn--solid:hover,
        .sl-btn--solid:focus-visible {
          background: var(--primary-hover, #e55c00);
          border-color: var(--primary-hover, #e55c00);
        }

        /* ── Right: top work ── */
        .sl-work {
          min-width: 0;
          padding: 64px 0 64px 56px;
          border-left: 1px solid var(--sl-border);
        }

        .sl-work-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .sl-work-head .sl-label { margin: 0; }
        .sl-work-count {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          color: var(--sl-txt-3);
        }

        .sl-work-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px 16px;
        }

        .sl-item {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
          text-decoration: none;
          color: inherit;
        }
        /* An odd count leads with one wide piece so the grid stays even. */
        .sl-item[data-feature="true"] { grid-column: 1 / -1; }

        .sl-thumb {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 2px;
          overflow: hidden;
          background: var(--sl-soft);
        }
        .sl-item[data-feature="true"] .sl-thumb { aspect-ratio: 16 / 9; }

        .sl-thumb img,
        .sl-thumb video {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        }

        /* Poster sits over the video and fades once playback starts. */
        .sl-thumb .sl-poster { transition: opacity 0.35s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); }
        .sl-thumb[data-playing="true"] .sl-poster { opacity: 0; }

        .sl-thumb-kind {
          position: absolute;
          left: 10px; bottom: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
          background: rgba(0,0,0,0.55);
          border-radius: 2px;
          padding: 5px 8px;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .sl-thumb-kind::before {
          content: "";
          border-style: solid;
          border-width: 4px 0 4px 6px;
          border-color: transparent transparent transparent #fff;
        }
        .sl-thumb[data-playing="true"] .sl-thumb-kind { opacity: 0; }

        a.sl-item:hover .sl-thumb img,
        a.sl-item:hover .sl-thumb video { transform: scale(1.03); }
        a.sl-item:hover .sl-item-title,
        a.sl-item:focus-visible .sl-item-title { color: var(--sl-accent); }
        a.sl-item:focus-visible { outline: none; }
        a.sl-item:focus-visible .sl-thumb {
          outline: 2px solid var(--sl-accent);
          outline-offset: 2px;
        }

        .sl-item-title {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.35;
          margin: 0;
          transition: color 0.2s ease;
        }
        .sl-item-title-text {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sl-item-go {
          flex-shrink: 0;
          font-size: 12px;
          color: var(--sl-accent);
        }
        .sl-item-label {
          display: block;
          margin-top: 3px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sl-txt-3);
        }

        .sl-work-empty {
          margin: 0;
          font-size: 14px;
          color: var(--sl-txt-3);
        }

        /* ── Empty ── */
        .sl-empty {
          padding: 80px 20px;
          text-align: center;
          color: var(--sl-txt-3);
          font-size: 14px;
          border-top: 1px solid var(--sl-border);
          border-bottom: 1px solid var(--sl-border);
        }

        /* ── Closing CTA ── */
        .sl-cta {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
          margin-top: 112px;
        }
        .sl-cta-heading {
          font-family: var(--font-display);
          font-size: clamp(40px, 5.5vw, 76px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0;
        }
        .sl-cta-side {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
          max-width: 400px;
        }
        .sl-cta-text {
          font-size: 15px;
          line-height: 1.75;
          color: var(--sl-txt-2);
          margin: 0;
        }
        .sl-cta .sl-btn { margin-top: 0; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .sl-row-inner { grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); }
          .sl-info { padding: 56px 40px 56px 0; }
          .sl-work { padding: 56px 0 56px 40px; }
          .sl-features { grid-template-columns: minmax(0, 1fr); }
        }

        @media (max-width: 960px) {
          .sl { --sl-gutter: 28px; }
          .sl-row-inner { grid-template-columns: minmax(0, 1fr); }
          .sl-info { padding: 48px 0 40px; }
          .sl-work {
            padding: 40px 0 48px;
            border-left: none;
            border-top: 1px solid var(--sl-border);
          }
          .sl-features { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sl-short, .sl-full { max-width: none; }
        }

        @media (max-width: 640px) {
          .sl { --sl-gutter: 16px; padding: 112px 0 64px; }
          .sl-header { margin-bottom: 40px; }
          .sl-band { padding: 112px 0 40px; }
          .sl-band + .sl-wrap { padding-top: 36px; }
          .sl-heading { font-size: clamp(40px, 12vw, 58px); }
          .sl-subtext { max-width: 100%; }
          .sl-info { padding: 36px 0 32px; }
          .sl-work { padding: 32px 0 40px; }
          .sl-short { font-size: 15.5px; }
          .sl-features { grid-template-columns: minmax(0, 1fr); }
          .sl-work-grid { gap: 22px 12px; }
          .sl-btn { align-self: stretch; justify-content: center; }
          .sl-cta { margin-top: 72px; }
          .sl-cta-side { max-width: none; width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sl-reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .sl-thumb img, .sl-thumb video { transition: none !important; }
          a.sl-item:hover .sl-thumb img,
          a.sl-item:hover .sl-thumb video { transform: none; }
        }
      `;
