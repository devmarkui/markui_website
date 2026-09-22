"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useHoverVideo } from "@/hooks/useHoverVideo";
import { projectCover, projectYear } from "@/lib/projects";
import {
  PROJECT_CATEGORIES,
  type Project,
  type ProjectCategory,
} from "@/lib/types";

/**
 * The public "Our Projects" grid.
 *
 * Projects come from the database (managed in the admin dashboard), so adding,
 * editing or deleting one there changes what renders here — no code edits.
 * Filtering happens entirely on the client, so switching category never
 * reloads the page.
 *
 * With `autoCycle`, the categories advance on a timer while the section is on
 * screen. Only time drives it — scrolling never changes the category — and a
 * click on any category hands control to the visitor for the rest of the visit.
 */

const FILTERS: ProjectCategory[] = [...PROJECT_CATEGORIES];

/** How long each category stays up while auto-cycling. */
const AUTO_CYCLE_MS = 4000;


export default function ProjectsShowcase({
  projects,
  limit,
  heading = "Our",
  headingAccent = "Projects",
  description = "Discover how our creative vision transforms ideas into powerful, conversion-driven brand experiences that truly stand out.",
  showAllLink = true,
  standalone = false,
  autoCycle = false,
}: {
  projects: Project[];
  /** Cap the number of cards shown, e.g. 6 (two rows of three) on the home page. */
  limit?: number;
  heading?: string;
  headingAccent?: string;
  description?: string;
  showAllLink?: boolean;
  /** Set on a dedicated page so the heading clears the fixed navbar. */
  standalone?: boolean;
  /** Step through the categories on a timer while the section is visible. */
  autoCycle?: boolean;
}) {
  // No "All" view: open on the first category that has work to show.
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>(
    () =>
      FILTERS.find((c) => projects.some((p) => p.category === c)) ?? FILTERS[0],
  );
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  /** Whether the section is on screen right now (drives the timer only). */
  const [onScreen, setOnScreen] = useState(false);
  /** Set once the visitor clicks a category; auto-cycling never resumes. */
  const [manual, setManual] = useState(false);
  /** Keyboard focus inside the section — hold the category under the cursor. */
  const [held, setHeld] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  // Visibility only starts and stops the timer — it never picks a category.
  useEffect(() => {
    if (!autoCycle || manual) return;
    const obs = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.25 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [autoCycle, manual]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /** The auto cycle skips categories with nothing to show; a click still can. */
  const cycle = useMemo(() => {
    const present = new Set(projects.map((p) => p.category));
    return FILTERS.filter((f) => present.has(f));
  }, [projects]);

  const running =
    autoCycle && !manual && onScreen && !held && !reducedMotion && cycle.length > 1;

  // One interval at a time: it is torn down whenever `running` flips off, the
  // section leaves the screen, or the component unmounts.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActiveFilter((current) => {
        const index = cycle.indexOf(current);
        return cycle[(index + 1) % cycle.length];
      });
    }, AUTO_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [running, cycle]);

  const selectFilter = (cat: ProjectCategory) => {
    setManual(true);
    setActiveFilter(cat);
  };

  // Every category is always offered; one with no projects yet shows the
  // empty state, and a project added to it in the dashboard appears here.
  const filter = activeFilter;

  const filtered = useMemo(
    () => projects.filter((p) => p.category === filter),
    [filter, projects],
  );

  const visible = limit ? filtered.slice(0, limit) : filtered;

  // Keep the grid at least as tall as the tallest category shown so far, so a
  // shorter category never shrinks the section and shifts the page below it.
  const minGridHeight = useRef(0);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.style.minHeight = "";
    minGridHeight.current = Math.max(minGridHeight.current, grid.offsetHeight);
    grid.style.minHeight = `${minGridHeight.current}px`;
  }, [filter, visible.length]);

  useEffect(() => {
    // A new width means new card heights; measure again from scratch.
    const reset = () => {
      minGridHeight.current = 0;
      if (gridRef.current) gridRef.current.style.minHeight = "";
    };
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);

  return (
    <section
      className="fp"
      aria-labelledby="fp-heading"
      ref={sectionRef}
      data-in={inView}
      data-standalone={standalone}
    >
      <div
        className="fp-container"
        onFocus={() => setHeld(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setHeld(false);
          }
        }}
      >
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
          {FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={filter === cat}
              className={`fp-filter-btn${
                filter === cat ? " fp-filter-btn--active" : ""
              }`}
              onClick={() => selectFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <div className="fp__grid-wrap" ref={gridRef}>
        {visible.length > 0 ? (
          <div className="fp__grid" role="list">
            {visible.map((project, i) => {
              return (
                <div
                  // Re-keying on the filter replays the entrance animation
                  // whenever the visible set changes.
                  key={`${filter}-${project.id}`}
                  role="listitem"
                  className="fp__grid-item"
                >
                  <ProjectCard
                    project={project}
                    number={projects.indexOf(project) + 1}
                    priority={i < 3}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="fp__empty">
            <p>No projects in this category yet.</p>
          </div>
        )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="fp__footer">
          <p className="fp__desc">{description}</p>
          {showAllLink ? (
            <Link
              href={`/projects?category=${filter.toLowerCase()}`}
              className="fp__btn-primary"
            >
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
              {` in ${filter}`}
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
          text-transform: uppercase;
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
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ═══ GRID ══════════════════════════════════════════════════════════ */
        /* Three standing cards per row, echoing the hero's service panels. */
        .fp__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 56px 24px;
        }

        .fp__grid-item {
          min-width: 0;
          animation: fpFadeIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) backwards;
        }

        .fp__grid-item:nth-child(1) { animation-delay: 0.00s; }
        .fp__grid-item:nth-child(2) { animation-delay: 0.06s; }
        .fp__grid-item:nth-child(3) { animation-delay: 0.12s; }
        .fp__grid-item:nth-child(4) { animation-delay: 0.18s; }
        .fp__grid-item:nth-child(5) { animation-delay: 0.24s; }
        .fp__grid-item:nth-child(n+6) { animation-delay: 0.30s; }

        /* ═══ CARD ══════════════════════════════════════════════════════════ */
        .fp-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
          color: inherit;
          text-decoration: none;
        }
        .fp-card:focus-visible { outline: none; }
        .fp-card:focus-visible .fp-card__media {
          outline: 2px solid var(--primary, #ff6b00);
          outline-offset: 3px;
        }

        /* Standing frame for the cover */
        .fp-card__media {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border-radius: 4px;
          background: var(--surface);
        }
        .fp-card__media img,
        .fp-card__media video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94) !important;
        }
        .fp-card:hover .fp-card__media img,
        .fp-card:hover .fp-card__media video { transform: scale(1.03); }

        /* Poster sits over the video and fades once it plays */
        .fp-card__media .fp-card__poster { transition: opacity 0.35s ease, transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94) !important; }
        .fp-card__media[data-playing="true"] .fp-card__poster { opacity: 0; }
        .fp-card__kind {
          position: absolute;
          left: 12px; top: 12px;
          padding: 5px 8px;
          border-radius: 2px;
          background: rgba(0,0,0,0.55);
          color: #fff;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .fp-card__media[data-playing="true"] .fp-card__kind { opacity: 0; }

        /* Placeholder shown until an image is uploaded in the dashboard */
        .fp-card__placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(120% 90% at 30% 10%, #f4f4f4 0%, #e9e9e9 60%, #e2e2e2 100%);
        }
        .fp-card__placeholder span {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 800;
          letter-spacing: 0.04em;
          color: rgba(0, 0, 0, 0.13);
          text-transform: uppercase;
        }

        /* White label that eases in over the image on hover */
        .fp-card__tag {
          position: absolute;
          right: 16px; bottom: 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 2px;
          background: #fff;
          color: var(--txt);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.3s ease, transform 0.3s ease;
          pointer-events: none;
        }
        .fp-card__tag span { color: var(--primary, #ff6b00); }
        .fp-card:hover .fp-card__tag,
        .fp-card:focus-visible .fp-card__tag { opacity: 1; transform: none; }

        /* Text under the image */
        .fp-card__info { min-width: 0; }
        .fp-card__title {
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
        .fp-card:hover .fp-card__title { color: var(--primary, #ff6b00); }
        .fp-card__num {
          flex-shrink: 0;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--primary, #ff6b00);
          transform: translateY(-0.2em);
        }
        .fp-card__cat {
          margin: 0 0 12px 32px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--txt-3);
        }
        .fp-card__desc {
          margin: 0 0 0 32px;
          font-size: 14.5px;
          line-height: 1.65;
          color: var(--txt-2);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Touch screens get the link as text — there is no hover to reveal it */
        .fp-card__view {
          display: none;
          margin: 14px 0 0 32px;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--primary, #ff6b00);
        }
        @media (hover: none) {
          .fp-card__tag { display: none; }
          .fp-card__view { display: inline-flex; }
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
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
            grid-template-columns: minmax(0, 1fr);
            gap: 44px;
          }

          .fp-card__media { aspect-ratio: 4 / 5; }
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
          .fp-card__media img,
          .fp-card__media video,
          .fp-card__tag,
          .fp__btn-primary,
          .fp-filter-btn {
            transition: none !important;
          }
          .fp-card:hover .fp-card__media img,
          .fp-card:hover .fp-card__media video { transform: none; }
        }
      `}</style>
    </section>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
// Same anatomy as the cards on the Projects page — image, then number, title,
// category · year and a short description — in a standing 3:4 frame.

function ProjectCard({
  project,
  number,
  priority,
}: {
  project: Project;
  /** Position in the full list, so it stays the same under every filter. */
  number: number;
  priority: boolean;
}) {
  const cover = projectCover(project);
  const video = cover?.type === "video" ? cover.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), {
    touch: "tap-preview",
  });

  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
  const year = projectYear(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="fp-card"
      aria-label={`${project.title} — ${project.category}. View project`}
      {...(video ? handlers : {})}
    >
      <div className="fp-card__media" data-playing={playing}>
        {video ? (
          <>
            <video
              ref={videoRef}
              // Without a poster, nudge past 0s so Safari paints a first frame.
              src={cover?.image || video.includes("#") ? video : `${video}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
            />
            {cover?.image ? (
              <Image
                className="fp-card__poster"
                src={cover.image}
                alt=""
                fill
                sizes={sizes}
                priority={priority}
              />
            ) : null}
            <span className="fp-card__kind">Video</span>
          </>
        ) : cover ? (
          <Image src={cover.image} alt="" fill sizes={sizes} priority={priority} />
        ) : (
          <div className="fp-card__placeholder" aria-hidden="true">
            <span>{project.title.slice(0, 2)}</span>
          </div>
        )}
        <span className="fp-card__tag" aria-hidden="true">
          View project <span>→</span>
        </span>
      </div>

      <div className="fp-card__info">
        <h3 className="fp-card__title">
          <span className="fp-card__num">{String(number).padStart(2, "0")}</span>
          {project.title}
        </h3>
        <p className="fp-card__cat">
          {project.category}
          {year ? <span> · {year}</span> : null}
        </p>
        {project.description ? (
          <p className="fp-card__desc">{project.description}</p>
        ) : null}
        <span className="fp-card__view" aria-hidden="true">
          View project <span>→</span>
        </span>
      </div>
    </Link>
  );
}
