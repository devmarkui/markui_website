"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useHoverVideo } from "@/hooks/useHoverVideo";
import type { StudioItem } from "@/lib/types";

/** Site paths navigate in-app; anything else is another website. */
function isInternal(link: string) {
  return link.startsWith("/") && !link.startsWith("//");
}

export default function StudioSection({ items }: { items: StudioItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 },
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
        .art-top.in { opacity: 1; transform: translateY(0); }

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
          background: #ff6b00;
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

        /* ── CARDS GRID ── */
        .art-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: start;
          gap: 0;
        }

        /* ── CARD ── */
        .art-card {
          border-left: 1px solid rgba(0,0,0,0.1);
          padding: 0 0 40px;
          min-width: 0;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .art-card:nth-child(4n),
        .art-card:last-child { border-right: 1px solid rgba(0,0,0,0.1); }
        .art-card:nth-child(n+5) { border-top: 1px solid rgba(0,0,0,0.1); }
        .art-card.in { opacity: 1; transform: translateY(0); }
        .art-card:nth-child(4n+1) { transition-delay: 0.05s; }
        .art-card:nth-child(4n+2) { transition-delay: 0.12s; }
        .art-card:nth-child(4n+3) { transition-delay: 0.19s; }
        .art-card:nth-child(4n)   { transition-delay: 0.26s; }

        .art-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .art-card-link:focus-visible {
          outline: 2px solid #ff6b00;
          outline-offset: -2px;
        }

        /* type row */
        .art-card-date-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .art-card-kind {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .art-card-date-icon {
          width: 14px;
          height: 14px;
          background: #ff6b00;
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
        .art-card-arrow {
          font-size: 14px;
          color: #999;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .art-card:hover .art-card-arrow {
          color: #ff6b00;
          transform: translate(2px, -2px);
        }

        /* media */
        .art-card-img {
          width: 100%;
          overflow: hidden;
          display: block;
          position: relative;
          background: #1a1a1a;
          height: 260px;
        }
        .art-card-img.tall { height: 380px; }
        .art-card-img img,
        .art-card-img video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.5s ease;
        }
        .art-card:hover .art-card-img img,
        .art-card:hover .art-card-img video {
          transform: scale(1.04);
        }
        /* The poster sits over the video until it actually plays. */
        .art-card-img .art-card-poster { transition: opacity 0.3s ease, transform 0.5s ease; }
        .art-card-img[data-playing="true"] .art-card-poster { opacity: 0; }

        .art-card-play {
          position: absolute;
          left: 14px;
          bottom: 14px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 4px;
          background: rgba(10,10,10,0.72);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .art-card-img[data-playing="true"] .art-card-play { opacity: 0; }

        /* title */
        .art-card-title {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.45;
          color: #111;
          margin: 0;
          padding: 18px 20px 0;
          transition: color 0.2s ease;
        }
        .art-card:hover .art-card-link .art-card-title { color: #ff6b00; }

        .art-card-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: #666;
          margin: 6px 0 0;
          padding: 0 20px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .art-grid { grid-template-columns: repeat(2, 1fr); }
          .art-card:nth-child(2n) { border-right: 1px solid rgba(0,0,0,0.1); }
          .art-card:nth-child(n+3) { border-top: 1px solid rgba(0,0,0,0.1); }
          .art-card-img.tall { height: 320px; }
        }

        @media (max-width: 768px) {
          .art-container { padding: 0 20px; }
          .art-section { padding: 56px 0 0; }

          .art-top {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .art-grid { grid-template-columns: 1fr; }
          .art-card {
            border-left: none;
            border-right: none !important;
            border-top: 1px solid rgba(0,0,0,0.1);
          }
          .art-card:first-child { border-top: none; }
          .art-card-img,
          .art-card-img.tall { height: auto; aspect-ratio: 16 / 10; }
        }

        @media (prefers-reduced-motion: reduce) {
          .art-top,
          .art-card {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .art-card-img img,
          .art-card-img video { transition: none !important; }
        }
      `}</style>

      <section
        className="art-section"
        ref={sectionRef}
        aria-labelledby="art-heading"
      >
        <div className="art-container">
          <div className={`art-top${visible ? " in" : ""}`}>
            <div>
              <div className="art-badge">
                <div className="art-badge-dot" aria-hidden="true" />
                <span className="art-badge-count">{items.length}</span>
                <span className="art-badge-label">
                  {items.length === 1 ? "Post" : "Posts"}
                </span>
              </div>
              <h2 className="art-headline" id="art-heading">
                Latest From<br />Our Studio.
              </h2>
            </div>

            <div className="art-top-right">
              <p className="art-desc">
                Ideas, strategies, and innovative creative explorations shaping
                the future of design, emerging technology, and digital
                experiences.
              </p>
            </div>
          </div>
        </div>

        <div className="art-grid">
          {items.map((item, i) => (
            <StudioCard
              key={item.id}
              item={item}
              tall={i % 4 === 1}
              visible={visible}
            />
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function StudioCard({
  item,
  tall,
  visible,
}: {
  item: StudioItem;
  tall: boolean;
  visible: boolean;
}) {
  const isVideo = item.mediaType === "video" && Boolean(item.video);
  const { videoRef, playing, handlers, toggle } = useHoverVideo(isVideo, {
    touch: item.link ? "in-view" : "tap",
  });
  const external = item.link ? !isInternal(item.link) : false;

  const content = (
    <>
      <div className="art-card-date-row">
        <span className="art-card-kind">
          <span className="art-card-date-icon" aria-hidden="true" />
          <span className="art-card-date">{isVideo ? "Video" : "Photo"}</span>
        </span>
        {item.link ? (
          <span className="art-card-arrow" aria-hidden="true">
            ↗
          </span>
        ) : null}
      </div>

      <div
        className={`art-card-img${tall ? " tall" : ""}`}
        data-playing={playing}
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={item.video}
              poster={item.image || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            {item.image ? (
              <Image
                className="art-card-poster"
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : null}
            <span className="art-card-play" aria-hidden="true">
              ▶ Play
            </span>
          </>
        ) : item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : null}
      </div>

      <p className="art-card-title">{item.title}</p>
      {item.description ? (
        <p className="art-card-desc">{item.description}</p>
      ) : null}
    </>
  );

  const className = `art-card${visible ? " in" : ""}`;
  const label = external ? `${item.title} (opens in a new tab)` : item.title;

  if (item.link && !external) {
    return (
      <div className={className}>
        <Link href={item.link} className="art-card-link" aria-label={label} {...handlers}>
          {content}
        </Link>
      </div>
    );
  }

  if (item.link) {
    return (
      <div className={className}>
        <a
          href={item.link}
          className="art-card-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          {...handlers}
        >
          {content}
        </a>
      </div>
    );
  }

  // No destination: a video still plays on hover, or on tap/Enter.
  return (
    <div className={className}>
      <div
        className="art-card-link"
        {...(isVideo
          ? {
              ...handlers,
              role: "button",
              tabIndex: 0,
              "aria-label": `Play ${item.title}`,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              },
            }
          : {})}
      >
        {content}
      </div>
    </div>
  );
}
