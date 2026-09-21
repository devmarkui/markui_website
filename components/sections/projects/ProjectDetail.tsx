"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { LISTING_CSS } from "@/components/sections/shared/listing-styles";
import type { ProjectCover } from "@/lib/projects";
import { projectYear } from "@/lib/projects";
import type { GalleryItem, Project } from "@/lib/types";

interface NextProject {
  slug: string;
  title: string;
  category: string;
  image: string;
}

/**
 * /projects/<slug> — one piece of client work: title and facts, the cover at
 * full content width, the story, a gallery (images open in a lightbox, videos
 * play with controls), the outcome, and the way on to the next project.
 */
export default function ProjectDetail({
  project,
  cover,
  gallery,
  services,
  next,
}: {
  project: Project;
  cover: ProjectCover | null;
  gallery: GalleryItem[];
  services: { name: string; slug: string }[];
  next: NextProject | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const images = gallery.filter((item) => item.type === "image");
  const year = projectYear(project);
  const about = (project.fullDescription || project.description)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const deliverables = project.deliverables ?? [];

  const facts = [
    project.client ? { label: "Client", value: project.client } : null,
    { label: "Category", value: project.category },
    project.industry ? { label: "Industry", value: project.industry } : null,
    year ? { label: "Year", value: year } : null,
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <section className="sl pd" aria-labelledby="pd-title">
      <div className="sl-wrap">
        <Link href="/projects" className="pd-back">
          <span aria-hidden="true">←</span> All projects
        </Link>

        <header className="pd-head">
          <div>
            <span className="sl-eyebrow">{project.category}</span>
            <h1 className="pd-title" id="pd-title">
              {project.title}
            </h1>
          </div>
          {project.description ? (
            <p className="sl-subtext">{project.description}</p>
          ) : null}
        </header>

        <dl className="pd-facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {cover ? <Hero cover={cover} title={project.title} /> : null}

        <div className="pd-body">
          <div>
            <p className="sl-label">About the project</p>
            {about.map((paragraph, i) => (
              <p className="pd-about" key={i}>
                {paragraph}
              </p>
            ))}
          </div>

          <aside className="pd-side">
            {deliverables.length ? (
              <div>
                <p className="sl-label">What we did</p>
                <ul className="sl-features pd-list">
                  {deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {services.length ? (
              <div>
                <p className="sl-label">Services</p>
                <ul className="pd-services">
                  {services.map((service) => (
                    <li key={service.slug}>
                      <Link href={`/services/${service.slug}`}>
                        {service.name}
                        <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {project.link || project.portfolioUrl ? (
              <div className="pd-actions">
                {project.link ? (
                  <a
                    href={project.link}
                    className="sl-btn sl-btn--solid"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit website <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                {project.portfolioUrl ? (
                  <a
                    href={project.portfolioUrl}
                    className="sl-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View in portfolio <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>

        {gallery.length ? (
          <div className="pd-gallery">
            <div className="pj-block-head">
              <p className="sl-label">Project gallery</p>
              <span className="sl-work-count">
                {String(gallery.length).padStart(2, "0")}
              </span>
            </div>
            <div className="pd-gallery-grid">
              {gallery.map((item, i) => (
                <figure
                  className="pd-figure"
                  key={item.id}
                  data-wide={gallery.length % 2 === 1 && i === 0}
                >
                  {item.type === "video" ? (
                    <div className="pd-frame">
                      <video
                        // Without a poster, nudge past 0s so a first frame paints.
                        src={
                          item.image || item.video?.includes("#")
                            ? item.video
                            : `${item.video}#t=0.1`
                        }
                        poster={item.image || undefined}
                        muted
                        loop
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="pd-frame pd-zoom"
                      aria-label={`Open ${item.title || "image"} larger`}
                      onClick={() => setOpen(images.indexOf(item))}
                    >
                      <Image
                        src={item.image}
                        alt={item.title || `${project.title} — image ${i + 1}`}
                        fill
                        sizes="(max-width: 760px) 100vw, 50vw"
                      />
                    </button>
                  )}
                  {item.title ? <figcaption>{item.title}</figcaption> : null}
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        {project.outcome ? (
          <div className="pd-outcome">
            <p className="sl-label">Outcome</p>
            <p className="pd-outcome-text">{project.outcome}</p>
          </div>
        ) : null}

        {next ? (
          <Link href={`/projects/${next.slug}`} className="pd-next">
            <span className="sl-label">Next project</span>
            <span className="pd-next-row">
              <span className="pd-next-title">{next.title}</span>
              <span className="pd-next-arrow" aria-hidden="true">→</span>
            </span>
            <span className="pj-cat">{next.category}</span>
          </Link>
        ) : null}
      </div>

      {open !== null && images[open] ? (
        <Lightbox
          images={images}
          index={open}
          title={project.title}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      ) : null}

      <style>{LISTING_CSS}</style>
      <style>{DETAIL_CSS}</style>
    </section>
  );
}

// ─── Hero media ──────────────────────────────────────────────────────────────

/** The cover at full content width. A video cover plays muted unless the visitor prefers reduced motion. */
function Hero({ cover, title }: { cover: ProjectCover; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div className="pd-hero">
      {cover.type === "video" && cover.video ? (
        <video
          ref={videoRef}
          src={cover.video}
          poster={cover.image || undefined}
          muted
          loop
          playsInline
          controls
          preload="metadata"
          aria-label={`${title} — video`}
        />
      ) : (
        <Image src={cover.image} alt={title} fill sizes="100vw" priority />
      )}
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  index,
  title,
  onIndex,
  onClose,
}: {
  images: GalleryItem[];
  index: number;
  title: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const item = images[index];

  const step = useCallback(
    (delta: number) => onIndex((index + delta + count) % count),
    [index, count, onIndex],
  );

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      returnTo?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  return (
    <div
      className="pd-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} gallery`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pd-lb-bar">
        <span>
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          {item.title ? ` — ${item.title}` : ""}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close">
          Close ×
        </button>
      </div>

      <div className="pd-lb-stage" onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
        <Image
          key={item.id}
          src={item.image}
          alt={item.title || `${title} — image ${index + 1}`}
          fill
          sizes="100vw"
          style={{ objectFit: "contain" }}
        />
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="pd-lb-nav"
            data-dir="prev"
            aria-label="Previous image"
            onClick={() => step(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className="pd-lb-nav"
            data-dir="next"
            aria-label="Next image"
            onClick={() => step(1)}
          >
            →
          </button>
        </>
      ) : null}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const DETAIL_CSS = `
  .pd-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 36px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--sl-txt-3);
    transition: color 0.2s ease;
  }
  .pd-back:hover, .pd-back:focus-visible { color: var(--sl-accent); outline: none; }

  .pd-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 40px;
    flex-wrap: wrap;
    margin-bottom: 40px;
  }
  .pd-title {
    font-family: var(--font-display);
    font-size: clamp(48px, 8vw, 116px);
    font-weight: 800;
    line-height: 0.92;
    letter-spacing: -0.035em;
    text-transform: uppercase;
    margin: 0;
    overflow-wrap: anywhere;
  }

  .pd-facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
    margin: 0 0 40px;
    padding: 22px 0;
    border-top: 1px solid var(--sl-border);
    border-bottom: 1px solid var(--sl-border);
  }
  .pd-facts dt {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sl-txt-3);
    margin-bottom: 6px;
  }
  .pd-facts dd { margin: 0; font-size: 15px; font-weight: 600; }

  .pd-hero {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 2px;
    background: var(--sl-soft);
  }
  .pd-hero img, .pd-hero video {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .pd-body {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 80px;
    padding: 80px 0;
  }
  .pd-about {
    font-size: 17px;
    line-height: 1.75;
    color: var(--sl-txt);
    margin: 0 0 18px;
    max-width: 680px;
  }
  .pd-side { display: flex; flex-direction: column; gap: 36px; }
  .pd-list { grid-template-columns: minmax(0, 1fr); margin-bottom: 0; }

  .pd-services { list-style: none; margin: 0; padding: 0; }
  .pd-services a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 0;
    border-bottom: 1px solid var(--sl-line);
    font-size: 14px;
    color: var(--sl-txt);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .pd-services a span { color: var(--sl-accent); transition: transform 0.2s ease; }
  .pd-services a:hover { color: var(--sl-accent); }
  .pd-services a:hover span { transform: translateX(3px); }

  .pd-actions { display: flex; flex-wrap: wrap; gap: 12px; }
  .pd-actions .sl-btn { margin-top: 0; }

  /* ── Gallery ── */
  .pd-gallery { padding-top: 64px; border-top: 1px solid var(--sl-border); }
  .pj-block-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 24px;
  }
  .pj-block-head .sl-label { margin: 0; }
  .pd-gallery-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 16px;
  }
  .pd-figure { margin: 0; min-width: 0; }
  .pd-figure[data-wide="true"] { grid-column: 1 / -1; }
  .pd-frame {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 2px;
    background: var(--sl-soft);
    padding: 0;
    border: 0;
  }
  .pd-figure[data-wide="true"] .pd-frame { aspect-ratio: 16 / 9; }
  .pd-frame img, .pd-frame video {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .pd-frame video { background: #000; }
  .pd-zoom { cursor: zoom-in; }
  .pd-zoom img { transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); }
  .pd-zoom:hover img { transform: scale(1.03); }
  .pd-zoom:focus-visible { outline: 2px solid var(--sl-accent); outline-offset: 3px; }
  .pd-figure figcaption {
    margin-top: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--sl-txt);
  }

  /* ── Outcome ── */
  .pd-outcome {
    margin-top: 80px;
    padding-top: 48px;
    border-top: 1px solid var(--sl-border);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
    gap: 40px;
  }
  .pd-outcome-text {
    margin: 0;
    font-size: clamp(22px, 2.4vw, 32px);
    line-height: 1.35;
    font-weight: 600;
    letter-spacing: -0.01em;
    max-width: 900px;
  }

  /* ── Next project ── */
  .pd-next {
    display: block;
    margin-top: 96px;
    padding: 40px 0 8px;
    border-top: 1px solid var(--sl-border);
    text-decoration: none;
    color: inherit;
  }
  .pd-next .sl-label { display: block; }
  .pd-next-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 8px;
  }
  .pd-next-title {
    font-family: var(--font-display);
    font-size: clamp(40px, 6.5vw, 88px);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
    transition: color 0.25s ease;
  }
  .pd-next-arrow {
    font-size: clamp(28px, 4vw, 56px);
    color: var(--sl-accent);
    transition: transform 0.3s ease;
  }
  .pd-next:hover .pd-next-title,
  .pd-next:focus-visible .pd-next-title { color: var(--sl-accent); }
  .pd-next:hover .pd-next-arrow { transform: translateX(8px); }
  .pd-next:focus-visible { outline: none; }
  .pj-cat {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sl-txt-3);
  }

  /* ── Lightbox ── */
  .pd-lightbox {
    position: fixed;
    inset: 0;
    z-index: 400;
    background: rgba(10,10,10,0.94);
    display: flex;
    flex-direction: column;
    color: #fff;
    font-family: var(--font-sans);
  }
  .pd-lb-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
  }
  .pd-lb-bar button {
    background: none;
    border: 0;
    color: #fff;
    font: inherit;
    cursor: pointer;
    padding: 6px 0;
  }
  .pd-lb-bar button:hover, .pd-lb-bar button:focus-visible { color: var(--sl-accent); outline: none; }
  .pd-lb-stage { position: relative; flex: 1; margin: 0 72px 48px; }
  .pd-lb-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px; height: 48px;
    background: none;
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 2px;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  .pd-lb-nav[data-dir="prev"] { left: 12px; }
  .pd-lb-nav[data-dir="next"] { right: 12px; }
  .pd-lb-nav:hover, .pd-lb-nav:focus-visible {
    border-color: var(--sl-accent);
    color: var(--sl-accent);
    outline: none;
  }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .pd-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pd-body { grid-template-columns: minmax(0, 1fr); gap: 48px; padding: 56px 0; }
    .pd-outcome { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  }

  @media (max-width: 640px) {
    .pd-head { margin-bottom: 28px; }
    .pd-gallery { padding-top: 48px; }
    .pd-gallery-grid { grid-template-columns: minmax(0, 1fr); gap: 28px; }
    .pd-figure[data-wide="true"] .pd-frame { aspect-ratio: 4 / 3; }
    .pd-hero { aspect-ratio: 4 / 3; }
    .pd-actions .sl-btn { flex: 1 1 100%; justify-content: center; }
    .pd-lb-stage { margin: 0 12px 88px; }
    .pd-lb-nav { top: auto; bottom: 20px; transform: none; }
    .pd-lb-nav[data-dir="prev"] { left: calc(50% - 56px); }
    .pd-lb-nav[data-dir="next"] { right: calc(50% - 56px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .pd-zoom img, .pd-next-arrow, .pd-services a span { transition: none; }
  }
`;
