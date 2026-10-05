"use client";

import "./projects.css";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

import ClosingCta from "@/components/site/ClosingCta";
import Chan from "@/components/site/Chan";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import Print from "@/components/site/Print";
import { LiveSection } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { projectCover, projectYear } from "@/lib/projects";
import { DEFAULT_CONTENT, type PageCopy } from "@/lib/site-content";
import { PROJECT_CATEGORIES, type Project, type ProjectCategory } from "@/lib/types";

const FILTERS: ProjectCategory[] = [...PROJECT_CATEGORIES];

/** A project that has something to show. */
interface Entry {
  project: Project;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The public /projects page: the homepage's gallery wall for the whole
 * portfolio. There is no "All" view — the wall always shows one channel,
 * featured work first. Tuning works in place and is mirrored in
 * `?category=` so a channel can be shared.
 */
export default function ProjectsPortfolio({
  projects,
  initialFilter,
  copy = DEFAULT_CONTENT.pages.projects,
}: {
  projects: Project[];
  initialFilter: ProjectCategory;
  /** The page's header and closing text, managed in the dashboard (Page Text). */
  copy?: PageCopy;
}) {
  const [filter, setFilter] = useState<ProjectCategory>(initialFilter);

  const entries: Entry[] = projects
    .filter((project) => projectCover(project))
    .map((project) => ({ project }));

  const count = (category: ProjectCategory) =>
    entries.filter((e) => e.project.category === category).length;

  // This channel's work, featured pieces first.
  const inFilter = [
    ...entries.filter((e) => e.project.category === filter && e.project.featured),
    ...entries.filter((e) => e.project.category === filter && !e.project.featured),
  ];

  // The next channel with work on it, for the foot of the wall.
  const at = FILTERS.indexOf(filter);
  const nextFilter = [...FILTERS.slice(at + 1), ...FILTERS.slice(0, at)].find((c) => count(c) > 0);

  const choose = (next: ProjectCategory, scroll = false) => {
    setFilter(next);
    const url = new URL(window.location.href);
    url.searchParams.set("category", next.toLowerCase());
    window.history.replaceState(null, "", url);
    if (scroll) document.getElementById("wall")?.scrollIntoView({ block: "start" });
  };

  const featured = entries.filter((e) => e.project.featured).length;

  return (
    <SitePage>
      <Masthead
        station="Projects"
        label={copy.header.label}
        titleId="projects-title"
        quiet={copy.header.quiet || undefined}
        loud={copy.header.loud}
        lede={<p>{copy.header.lede}</p>}
        readouts={[
          { label: "Projects", value: pad(entries.length) },
          { label: "Channels", value: pad(FILTERS.length) },
          ...(featured ? [{ label: "Featured", value: pad(featured) }] : []),
        ]}
      />

      <LiveSection className="wall ground ground-paper" id="wall" data-ground="paper" aria-labelledby="wall-title">
        <div className="wrap">
          <Chan num={pad(at + 1)}>
            <span id="wall-title">{filter} projects</span>
          </Chan>

          <div className="tuner">
            <p className="tuner-label" id="tuner-label">
              Tune in
            </p>
            <div className="tuner-scroll">
              <div className="tuner-options" role="group" aria-labelledby="tuner-label">
                {FILTERS.map((option) => (
                  <button
                    key={option}
                    className="tuner-btn"
                    type="button"
                    aria-pressed={filter === option}
                    onClick={() => choose(option)}
                  >
                    <span className="tuner-name" data-label={option}>
                      {option}
                    </span>
                    <span className="tuner-count">{pad(count(option))}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="tuner-status" role="status" aria-live="polite">
              {inFilter.length
                ? `${filter}: ${inFilter.length} ${inFilter.length === 1 ? "project" : "projects"} on the wall.`
                : `Nothing on ${filter} yet.`}
            </p>
          </div>

          {/* Re-keyed on tuning, so the wall is re-hung and every print develops again. */}
          <ol className="wall-grid" key={filter}>
            {inFilter.length === 0 ? (
              <li className="wall-empty">
                {entries.length === 0 ? "Our latest projects are on their way." : "No projects on this channel yet."}
              </li>
            ) : (
              inFilter.map((entry, i) => (
                <li className="wall-item" key={entry.project.id} style={{ "--slot": i } as CSSProperties}>
                  {/* Numbered by place on this wall, so every channel counts 01, 02, 03… */}
                  <ProjectCard entry={entry} number={i + 1} eager={i < 2} />
                </li>
              ))
            )}
            {inFilter.length ? (
              <li className="wall-foot">
                <p className="wall-foot-note">
                  {inFilter.length === 1 ? "One project" : `${inFilter.length} projects`} on {filter}.{" "}
                  {nextFilter && nextFilter !== filter ? "There's more on the next channel." : "Yours could be next."}
                </p>
                {nextFilter && nextFilter !== filter ? (
                  <button className="btn-line" type="button" onClick={() => choose(nextFilter, true)}>
                    Tune to {nextFilter} <Arrow />
                  </button>
                ) : (
                  <Link className="btn-signal" href="/contact">
                    Start a project <Arrow />
                  </Link>
                )}
              </li>
            ) : null}
          </ol>
        </div>
      </LiveSection>

      <ClosingCta quiet={copy.cta.quiet} loud={copy.cta.loud} text={copy.cta.text} />
    </SitePage>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ProjectCard({ entry, number, eager }: { entry: Entry; number: number; eager: boolean }) {
  const { project } = entry;
  const cover = projectCover(project);
  const video = cover?.type === "video" ? cover.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), { touch: "tap-preview" });

  if (!cover) return null;
  const year = projectYear(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="wall-card"
      data-cursor="View"
      aria-label={`${project.title}, ${project.category}${project.client ? `, for ${project.client}` : ""}. View project`}
      {...(video ? handlers : {})}
    >
      <Print
        image={cover.image}
        video={video}
        sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 60vw"
        eager={eager}
        videoRef={videoRef}
        playing={playing}
        develop
      >
        {project.featured ? <span className="wall-flag">Featured</span> : null}
        <span className="print-view" aria-hidden="true">
          View project <Arrow />
        </span>
      </Print>

      <div className="wall-caption">
        <span className="wall-index" aria-hidden="true">
          {pad(number)}
        </span>
        <h3 className="wall-name">{project.title}</h3>
        <p className="wall-meta">
          {project.industry ? <span>{project.industry}</span> : null}
          <span>{project.category}</span>
          {year ? <span>{year}</span> : null}
          {project.tag ? <span className="tag">{project.tag}</span> : null}
        </p>
        {project.description ? <p className="wall-desc">{project.description}</p> : null}
      </div>
    </Link>
  );
}
