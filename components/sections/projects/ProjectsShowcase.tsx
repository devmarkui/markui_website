"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  PROJECT_CATEGORIES,
  type Project,
  type ProjectFilter,
} from "@/lib/types";

/**
 * The public "Our Projects" grid.
 *
 * Projects come from the database (managed in the admin dashboard), so adding,
 * editing or deleting one there changes what renders here — no code edits.
 * Filtering happens entirely on the client, so switching category never
 * reloads the page.
 */

const FILTERS: ProjectFilter[] = ["All", ...PROJECT_CATEGORIES];

// Column spans that tile cleanly into the 12-column grid:
// row 1 → 7 + 5, row 2 → 4 + 4 + 4.
const GRID_SPANS = [7, 5, 4, 4, 4];

export default function ProjectsShowcase({
  projects,
  limit,
  heading = "Our",
  headingAccent = "Projects",
  description = "Discover how our creative vision transforms ideas into powerful, conversion-driven brand experiences that truly stand out.",
  showAllLink = true,
  standalone = false,
}: {
  projects: Project[];
  /** Cap the number of cards shown, e.g. 5 on the home page. */
  limit?: number;
  heading?: string;
  headingAccent?: string;
  description?: string;
  showAllLink?: boolean;
  /** Set on a dedicated page so the heading clears the fixed navbar. */
  standalone?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("All");
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  /** Categories that actually have projects, so no filter leads to a dead end. */
  const available = useMemo(() => {
    const present = new Set(projects.map((p) => p.category));
    return FILTERS.filter((f) => f === "All" || present.has(f));
  }, [projects]);

  // If the admin deletes the last project in the active category, fall back to
  // All. Derived during render rather than corrected in an effect, so there is
  // never a frame showing an empty category.
  const filter = available.includes(activeFilter) ? activeFilter : "All";

  const filtered =
    filter === "All"
      ? projects
      : projects.filter((p) => p.category === filter);

  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <section
      className="fp"
      aria-labelledby="fp-heading"
      ref={sectionRef}
      data-in={inView}
      data-standalone={standalone}
    >
      <div className="fp-container">
        {/* ── Section Header ───────────────────────────────────────────── */}
        <div className="fp__header">
          <div className="fp__header-left">
            <h2 className="fp__headline" id="fp-heading">
              {heading}
              <br />
              <em>{headingAccent}</em>
            </h2>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div
          className="fp-filter-bar"
          role="tablist"
          aria-label="Filter projects by category"
        >
          {available.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={filter === cat}
              className={`fp-filter-btn${
                filter === cat ? " fp-filter-btn--active" : ""
              }`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="fp__grid" role="list">
            {visible.map((project, i) => {
              const span = GRID_SPANS[i % GRID_SPANS.length];
              return (
                <div
                  // Re-keying on the filter replays the entrance animation
                  // whenever the visible set changes.
                  key={`${filter}-${project.id}`}
                  role="listitem"
                  className="fp__grid-item"
                  data-span={span}
                  style={{ "--col-span": span } as React.CSSProperties}
                >
                  <ProjectCard project={project} priority={i < 2} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="fp__empty">
            <p>No projects in this category yet.</p>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="fp__footer">
          <p className="fp__desc">{description}</p>
          {showAllLink ? (
            <Link href="/projects" className="fp__btn-primary">
              See all projects
              <span className="fp__btn-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle
                    cx="9"
                    cy="9"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6 9h6M9 6l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ) : (
            <span className="fp__footer-count">
              {filtered.length}{" "}
              {filtered.length === 1 ? "project" : "projects"}
              {filter !== "All" ? ` in ${filter}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Scoped Styles ────────────────────────────────────────────────── */}
      <style>{`

        /* ═══ SECTION ═══════════════════════════════════════════════════════ */
        .fp {
          --bg:             #ffffff;
          --surface:        #fafafa;
          --card:           #ffffff;
          --txt:            #0a0a0a;
          --txt-2:          #4a4a4a;
          --txt-3:          #737373;
          --border:         rgba(0, 0, 0, 0.10);
          --r-sm:           12px;
          --r-md:           20px;
          --r-lg:           32px;
          --shadow-o:       0 0 30px rgba(255,107,0,0.2);
          --ease:           0.3s ease;
          --ease-fast:      0.18s ease;

          background: var(--bg);
          color: var(--txt);
          padding: 100px 0;
          font-family: var(--font-sans);
        }

        /* On its own page the section sits under the fixed 72px navbar. */
        .fp[data-standalone="true"] { padding-top: 156px; min-height: 100vh; }

        .fp-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
        }

        .fp__header, .fp-filter-bar, .fp__grid, .fp__empty, .fp__footer {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fp[data-in="true"] .fp__header { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
        .fp[data-in="true"] .fp-filter-bar { opacity: 1; transform: translateY(0); transition-delay: 0.2s; }
        .fp[data-in="true"] .fp__grid, .fp[data-in="true"] .fp__empty { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }
        .fp[data-in="true"] .fp__footer { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }

        /* ═══ HEADER ════════════════════════════════════════════════════════ */
        .fp__header {
          margin-bottom: 40px;
        }

        .fp__headline {
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--txt);
          margin: 0;
        }

        .fp__headline em {
          font-style: normal;
          color: var(--primary, #ff6b00);
        }

        .fp__desc {
          font-size: 14px;
          line-height: 1.7;
          color: var(--txt-2);
          max-width: 380px;
        }

        /* Primary button */
        .fp__btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: var(--primary, #ff6b00);
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 16px 36px;
          border-radius: 999px;
          text-decoration: none;
          transition:
            background var(--ease-fast),
            color var(--ease-fast),
            box-shadow var(--ease-fast);
          width: fit-content;
        }

        .fp__btn-primary:hover,
        .fp__btn-primary:focus-visible {
          background: var(--primary-hover, #e55c00);
          color: #ffffff;
          box-shadow: var(--shadow-o);
          outline: none;
        }

        .fp__btn-icon { display: flex; align-items: center; }

        /* ═══ FILTER BAR ════════════════════════════════════════════════════ */
        .fp-filter-bar {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          margin-bottom: 32px;
          /* horizontal scroll on very small screens */
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .fp-filter-bar::-webkit-scrollbar { display: none; }

        .fp-filter-btn {
          flex-shrink: 0;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--txt-3);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          padding: 8px 20px;
          cursor: pointer;
          transition:
            border-color var(--ease-fast),
            color var(--ease-fast),
            background var(--ease-fast);
          white-space: nowrap;
        }

        .fp-filter-btn:hover:not(.fp-filter-btn--active) {
          border-color: var(--primary, #ff6b00);
          color: var(--primary, #ff6b00);
          background-color: rgba(255, 107, 0, 0.06);
        }

        .fp-filter-btn:focus-visible {
          outline: 2px solid var(--primary, #ff6b00);
          outline-offset: 2px;
        }

        .fp-filter-btn--active {
          background-color: var(--primary, #ff6b00);
          border-color: var(--primary, #ff6b00);
          color: #ffffff;
        }

        @keyframes fpFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ═══ GRID ══════════════════════════════════════════════════════════ */
        .fp__grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1px;
          background: var(--border);
          border-radius: var(--r-md);
          overflow: hidden;
        }

        .fp__grid-item {
          background: var(--bg);
          grid-column: span var(--col-span);
          animation: fpFadeIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) backwards;
        }

        .fp__grid-item:nth-child(1) { animation-delay: 0.00s; }
        .fp__grid-item:nth-child(2) { animation-delay: 0.08s; }
        .fp__grid-item:nth-child(3) { animation-delay: 0.16s; }
        .fp__grid-item:nth-child(4) { animation-delay: 0.24s; }
        .fp__grid-item:nth-child(5) { animation-delay: 0.32s; }
        .fp__grid-item:nth-child(n+6) { animation-delay: 0.40s; }

        /* ═══ CARD ══════════════════════════════════════════════════════════ */
        .fp-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background: var(--card);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 320px;
          outline: 2px solid transparent;
          outline-offset: -2px;
          transition: outline var(--ease-fast);
          text-decoration: none;
          color: inherit;
        }

        .fp-card--hovered {
          outline: 2px solid var(--primary, #ff6b00);
        }

        /* Wider cards get more height */
        .fp__grid-item[data-span="7"] .fp-card { min-height: 400px; }

        /* Thumbnail */
        .fp-card__thumb {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: var(--surface);
        }

        .fp-card__thumb img {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }

        .fp-card:hover .fp-card__thumb img,
        .fp-card:focus-visible .fp-card__thumb img {
          transform: scale(1.04) !important;
        }

        /* Placeholder shown until an image is uploaded in the dashboard */
        .fp-card__placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(120% 90% at 30% 10%, #f4f4f4 0%, #e9e9e9 60%, #e2e2e2 100%);
        }

        .fp-card__placeholder span {
          font-family: var(--font-display);
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 800;
          letter-spacing: 0.04em;
          color: rgba(0, 0, 0, 0.13);
          text-transform: uppercase;
        }

        .fp-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 35%,
            rgba(0,0,0,0.15) 100%
          );
          pointer-events: none;
        }

        .fp-card__overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.62);
          opacity: 0;
          transition: opacity var(--ease);
        }
        .fp-card--hovered .fp-card__overlay::after {
          opacity: 1;
        }

        /* Meta strip */
        .fp-card__meta {
          display: flex;
          flex-direction: column;
          padding: 13px 18px;
          border-top: 1px solid var(--border);
          background: var(--card);
          position: relative;
          z-index: 2;
          flex-shrink: 0;
        }

        .fp-card__meta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .fp-card__meta-left {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .fp-card__dot {
          width: 8px;
          height: 8px;
          border-radius: 1px;
          background: var(--primary, #ff6b00);
          flex-shrink: 0;
          transform: rotate(45deg);
        }

        .fp-card__name {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: var(--txt);
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fp-card__tag {
          font-size: 10px;
          color: var(--txt-3);
          letter-spacing: 0.05em;
          white-space: nowrap;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .fp-card__meta-desc {
          display: none;
        }

        /* Hover reveal — sits over the darkened thumbnail, so it stays white */
        .fp-card__reveal {
          position: absolute;
          inset: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          gap: 5px;
          transform: translateY(12px);
          opacity: 0;
          transition:
            opacity var(--ease),
            transform var(--ease);
          pointer-events: none;
        }

        .fp-card--hovered .fp-card__reveal {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .fp-card__reveal-title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .fp-card__industry {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--primary, #ff6b00);
          font-weight: 700;
          text-transform: uppercase;
        }

        .fp-card__desc-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin: 0;
          max-width: 280px;
        }

        .fp-card__cta {
          margin-top: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #ffffff;
          border-bottom: 1px solid rgba(255,255,255,0.45);
          padding-bottom: 3px;
        }

        /* ═══ FOOTER ════════════════════════════════════════════════════════ */
        .fp__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 36px;
          padding-top: 22px;
          border-top: 1px solid var(--border);
          gap: 16px;
          flex-wrap: wrap;
        }

        .fp__footer-count {
          font-size: 11px;
          color: var(--txt-3);
          letter-spacing: 0.07em;
        }

        /* Empty state */
        .fp__empty {
          text-align: center;
          padding: 80px 0;
          color: var(--txt-3);
          font-size: 14px;
          border: 1px dashed var(--border);
          border-radius: var(--r-md);
        }

        /* ═══ RESPONSIVE ════════════════════════════════════════════════════ */

        @media (max-width: 960px) {
          .fp-container {
            padding: 0 28px;
          }
        }

        /* Tablet: 2-col grid */
        @media (max-width: 1024px) {

          .fp__header {
            margin-bottom: 32px;
          }

          .fp__desc { max-width: 100%; }

          .fp__grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .fp__grid-item {
            grid-column: span 1 !important;
          }

          .fp-card { min-height: 280px !important; }
        }

        /* Mobile: single column */
        @media (max-width: 640px) {
          .fp {
            padding: 60px 0;
          }

          .fp[data-standalone="true"] { padding-top: 116px; }

          .fp__headline {
            font-size: clamp(38px, 11vw, 56px);
          }

          .fp__btn-primary {
            width: fit-content;
            padding: 15px 24px;
          }

          .fp__footer {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 24px;
          }

          .fp-filter-bar {
            gap: 6px;
          }

          .fp-filter-btn {
            padding: 8px 14px;
            font-size: 10px;
          }

          .fp__grid {
            grid-template-columns: 1fr;
            /* gap is replaced by margin-bottom on items */
            background: transparent;
          }

          .fp__grid-item {
            grid-column: span 1 !important;
          }
          .fp__grid-item:not(:last-child) {
            margin-bottom: 32px;
          }

          .fp-card {
            min-height: 240px !important;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid var(--border);
            box-shadow: 0 12px 34px rgba(0, 0, 0, 0.08);
          }

          .fp-card__meta {
            border-top: 1px solid var(--border);
          }

          /* On mobile hide reveal and show inline description */
          .fp-card__reveal {
            display: none !important;
          }

          .fp-card__meta-desc {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin: 8px 0 0 0;
            font-size: 12px;
            color: var(--txt-2);
            line-height: 1.5;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .fp__header,
          .fp-filter-bar,
          .fp__grid,
          .fp__footer,
          .fp__grid-item,
          .fp__empty {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
          .fp-card__thumb img,
          .fp-card__reveal,
          .fp__btn-primary,
          .fp-filter-btn,
          .fp-card__overlay::after {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  priority,
}: {
  project: Project;
  priority: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const interaction = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  const inner = (
    <>
      {/* Thumbnail */}
      <div className="fp-card__thumb">
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.title} project thumbnail`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 58vw"
            style={{ objectFit: "cover" }}
            priority={priority}
          />
        ) : (
          <div className="fp-card__placeholder" aria-hidden="true">
            <span>{project.title.slice(0, 2)}</span>
          </div>
        )}
        <div className="fp-card__overlay" />
      </div>

      {/* Meta strip */}
      <div className="fp-card__meta">
        <div className="fp-card__meta-header">
          <div className="fp-card__meta-left">
            <span className="fp-card__dot" aria-hidden="true" />
            <span className="fp-card__name">{project.title}</span>
          </div>
          {project.tag ? (
            <span className="fp-card__tag">{project.tag}</span>
          ) : null}
        </div>
        <p className="fp-card__meta-desc">{project.description}</p>
      </div>

      {/* Hover reveal */}
      <div className="fp-card__reveal" aria-hidden={!hovered}>
        <span className="fp-card__reveal-title font-display">
          {project.title}
        </span>
        <p className="fp-card__industry">
          {project.industry || project.category}
        </p>
        <p className="fp-card__desc-text">{project.description}</p>
        {project.link ? (
          <span className="fp-card__cta">View project ↗</span>
        ) : null}
      </div>
    </>
  );

  const className = `fp-card${hovered ? " fp-card--hovered" : ""}`;
  const label = `${project.title} — ${project.industry || project.category}`;

  if (project.link) {
    return (
      <a
        className={className}
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        {...interaction}
      >
        {inner}
      </a>
    );
  }

  return (
    <article className={className} tabIndex={0} aria-label={label} {...interaction}>
      {inner}
    </article>
  );
}
