"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LISTING_CSS } from "@/components/sections/shared/listing-styles";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { projectCover, projectYear } from "@/lib/projects";
import {
  PROJECT_CATEGORIES,
  type Project,
  type ProjectFilter,
} from "@/lib/types";

const FILTERS: ProjectFilter[] = ["All", ...PROJECT_CATEGORIES];

/** A project that has something to show, with its stable position number. */
interface Entry {
  project: Project;
  number: number;
}

/**
 * The public /projects page: a visual portfolio rather than the horizontal
 * bands used by Services and Products. Every project uses the same card on the
 * same aligned two-column grid — one image ratio, one set of gaps — with
 * featured work first. The category filter works in place (mirrored in
 * `?category=` so links can be shared).
 */
export default function ProjectsPortfolio({
  projects,
  initialFilter,
}: {
  projects: Project[];
  initialFilter: ProjectFilter;
}) {
  const [filter, setFilter] = useState<ProjectFilter>(initialFilter);

  // Numbers follow the admin's order and stay put while filtering.
  const entries: Entry[] = projects
    .filter((project) => projectCover(project))
    .map((project, index) => ({ project, number: index + 1 }));

  const inFilter =
    filter === "All"
      ? entries
      : entries.filter((e) => e.project.category === filter);
  const featured = inFilter.filter((e) => e.project.featured);
  const rest = featured.length
    ? inFilter.filter((e) => !e.project.featured)
    : inFilter;

  const choose = (next: ProjectFilter) => {
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", next.toLowerCase());
    window.history.replaceState(null, "", url);
  };

  return (
    <section className="sl pj" aria-labelledby="pj-heading">
      <div className="sl-wrap">
        <Reveal className="sl-header pj-header">
          <div>
            <span className="sl-eyebrow">Selected work</span>
            <h1 className="sl-heading" id="pj-heading">
              Our<br />
              <em>Projects</em>
            </h1>
          </div>
          <p className="sl-subtext">
            A selection of projects we&apos;ve designed, built and delivered
            for our clients — from brand identities and campaigns to websites
            and film.
          </p>
        </Reveal>

        <nav className="pj-filter" aria-label="Filter projects by category">
          <ul>
            {FILTERS.map((option) => {
              const count =
                option === "All"
                  ? entries.length
                  : entries.filter((e) => e.project.category === option).length;
              return (
                <li key={option}>
                  <button
                    type="button"
                    aria-pressed={filter === option}
                    onClick={() => choose(option)}
                  >
                    {option}
                    <sup>{count}</sup>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Re-keyed on filter change so the results fade in afresh. */}
        <div className="pj-results" key={filter} aria-live="polite">
          {inFilter.length === 0 ? (
            <p className="pj-empty">
              {entries.length === 0
                ? "Our latest projects are on their way."
                : "No projects in this category yet."}
            </p>
          ) : (
            <>
              {featured.length ? (
                <div className="pj-block">
                  <div className="pj-block-head">
                    <p className="sl-label">Featured work</p>
                    <span className="sl-work-count">
                      {String(featured.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="pj-grid">
                    {featured.map((entry, i) => (
                      <ProjectCard
                        key={entry.project.id}
                        entry={entry}
                        priority={i < 2}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {rest.length ? (
                <div className="pj-block">
                  <div className="pj-block-head">
                    <p className="sl-label">
                      {featured.length ? "More projects" : "All projects"}
                    </p>
                    <span className="sl-work-count">
                      {String(rest.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="pj-grid">
                    {rest.map((entry, i) => (
                      <ProjectCard
                        key={entry.project.id}
                        entry={entry}
                        priority={!featured.length && i < 2}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <Reveal className="sl-cta">
          <div>
            <span className="sl-eyebrow">Start a project</span>
            <h2 className="sl-cta-heading">
              Have a project<br />
              <em>in mind?</em>
            </h2>
          </div>
          <div className="sl-cta-side">
            <p className="sl-cta-text">
              Tell us about it — what you&apos;re making, who it&apos;s for and
              when you need it — and we&apos;ll come back with ideas and a clear
              plan.
            </p>
            <Link href="/contact" className="sl-btn sl-btn--solid">
              Let&apos;s work together
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </div>

      <style>{LISTING_CSS}</style>
      <style>{PORTFOLIO_CSS}</style>
    </section>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ProjectCard({ entry, priority }: { entry: Entry; priority: boolean }) {
  const { project, number } = entry;
  const cover = projectCover(project);
  const video = cover?.type === "video" ? cover.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), {
    touch: "tap-preview",
  });

  if (!cover) return null;

  const sizes = "(max-width: 700px) 100vw, 50vw";
  const year = projectYear(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="pj-card"
      aria-label={`${project.title} — ${project.category}${project.client ? `, for ${project.client}` : ""}. View project`}
      {...(video ? handlers : {})}
    >
      <div className="pj-media sl-thumb" data-playing={playing}>
        {video ? (
          <>
            <video
              ref={videoRef}
              // Without a poster, nudge past 0s so Safari paints a first frame.
              src={(cover.image || video.includes("#")) ? video : `${video}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
            />
            {cover.image ? (
              <Image
                className="sl-poster"
                src={cover.image}
                alt=""
                fill
                sizes={sizes}
                priority={priority}
              />
            ) : null}
            <span className="sl-thumb-kind">Video</span>
          </>
        ) : (
          <Image src={cover.image} alt="" fill sizes={sizes} priority={priority} />
        )}
        <span className="pj-tag" aria-hidden="true">
          View project <span>→</span>
        </span>
      </div>

      <div className="pj-info">
        <h3 className="pj-title">
          <span className="pj-num">{String(number).padStart(2, "0")}</span>
          {project.title}
        </h3>
        <p className="pj-cat">
          {project.category}
          {year ? <span> · {year}</span> : null}
        </p>
        {project.description ? (
          <p className="pj-desc">{project.description}</p>
        ) : null}
        <span className="pj-view" aria-hidden="true">
          View project <span>→</span>
        </span>
      </div>
    </Link>
  );
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────

/** Fades an element up into place the first time it scrolls into view. */
function Reveal({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`sl-reveal ${className}`} data-in={inView}>
      {children}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PORTFOLIO_CSS = `
  /* A touch smaller than the Services/Products heading — the work leads here. */
  .pj .sl-heading { font-size: clamp(40px, 5.2vw, 72px); }
  .pj-header { margin-bottom: 40px; }

  /* ── Filter ── */
  .pj-filter {
    border-top: 1px solid var(--sl-border);
    border-bottom: 1px solid var(--sl-border);
    margin-bottom: 48px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pj-filter::-webkit-scrollbar { display: none; }
  .pj-filter ul {
    list-style: none;
    display: flex;
    gap: clamp(20px, 3.4vw, 48px);
    margin: 0;
    padding: 0;
    width: max-content;
  }
  .pj-filter button {
    position: relative;
    display: inline-flex;
    align-items: flex-start;
    gap: 4px;
    padding: 20px 0 18px;
    background: none;
    border: 0;
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--sl-txt-2);
    cursor: pointer;
    transition: color 0.2s ease;
  }
  .pj-filter sup {
    font-family: var(--font-mono);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--sl-txt-3);
    top: -0.2em;
  }
  .pj-filter button::after {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: -1px;
    height: 2px;
    background: var(--sl-accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s cubic-bezier(0.25,1,0.5,1);
  }
  .pj-filter button:hover { color: var(--sl-txt); }
  .pj-filter button[aria-pressed="true"],
  .pj-filter button[aria-pressed="true"] sup { color: var(--sl-accent); }
  .pj-filter button[aria-pressed="true"]::after { transform: scaleX(1); }
  .pj-filter button:focus-visible {
    outline: 2px solid var(--sl-accent);
    outline-offset: 4px;
  }

  /* ── Results ── */
  .pj-results { animation: pj-in 0.45s cubic-bezier(0.25,1,0.5,1); }
  @keyframes pj-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: none; }
  }

  .pj-block + .pj-block {
    margin-top: 72px;
    padding-top: 40px;
    border-top: 1px solid var(--sl-border);
  }
  .pj-block-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 28px;
  }
  .pj-block-head .sl-label { margin: 0; }

  .pj-empty {
    margin: 0;
    padding: 80px 0;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--sl-txt-3);
    border-bottom: 1px solid var(--sl-border);
  }

  /* ── Grid: one ratio, one set of gaps, every row aligned ── */
  .pj-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 64px 32px;
    align-items: start;
  }

  /* ── Card ── */
  .pj-card {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
    text-decoration: none;
    color: inherit;
  }

  .pj-media { aspect-ratio: 4 / 3; }
  .pj-media img,
  .pj-media video {
    transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94) !important;
  }
  .pj-card:hover .pj-media img,
  .pj-card:hover .pj-media video { transform: scale(1.03); }
  .pj-card:focus-visible { outline: none; }
  .pj-card:focus-visible .pj-media {
    outline: 2px solid var(--sl-accent);
    outline-offset: 3px;
  }

  /* Small label that eases in over the image on hover. */
  .pj-tag {
    position: absolute;
    right: 16px; bottom: 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: 2px;
    background: #fff;
    color: var(--sl-txt);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }
  .pj-tag span { color: var(--sl-accent); }
  .pj-card:hover .pj-tag,
  .pj-card:focus-visible .pj-tag { opacity: 1; transform: none; }

  .pj-info { min-width: 0; }
  .pj-title {
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin: 0 0 6px;
    font-family: var(--font-display);
    font-size: clamp(22px, 2vw, 28px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
    transition: color 0.25s ease;
  }
  .pj-num {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--sl-accent);
    transform: translateY(-0.2em);
  }
  .pj-card:hover .pj-title { color: var(--sl-accent); }
  .pj-cat {
    margin: 0 0 12px 32px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sl-txt-3);
  }
  .pj-desc {
    margin: 0 0 0 32px;
    max-width: 520px;
    font-size: 14.5px;
    line-height: 1.65;
    color: var(--sl-txt-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Touch screens get the link as text — there is no hover to reveal it. */
  .pj-view {
    display: none;
    margin: 14px 0 0 32px;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sl-accent);
  }
  @media (hover: none) {
    .pj-tag { display: none; }
    .pj-view { display: inline-flex; }
  }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .pj-grid { gap: 48px 20px; }
  }

  @media (max-width: 700px) {
    .pj-filter { margin-bottom: 36px; }
    .pj-grid { grid-template-columns: minmax(0, 1fr); gap: 48px; }
    .pj-block + .pj-block { margin-top: 56px; padding-top: 32px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pj-results { animation: none; }
    .pj-card:hover .pj-media img,
    .pj-card:hover .pj-media video { transform: none; }
    .pj-tag { transition: none; }
  }
`;
