"use client";

import "./project-detail.css";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import Chan from "@/components/site/Chan";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import Print from "@/components/site/Print";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import type { ProjectCover } from "@/lib/projects";
import { projectYear } from "@/lib/projects";
import type { GalleryItem, Project } from "@/lib/types";

interface NextProject {
  slug: string;
  title: string;
  category: string;
  image: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * /projects/<slug> — one piece of client work: the masthead with its facts,
 * the cover at full width, the story beside what we did, a gallery (images
 * open in a lightbox, videos play with controls), the outcome on the orange
 * ground, and the way on to the next project.
 */
export default function ProjectDetail({
  project,
  cover,
  gallery,
  services,
  vaultPage,
  next,
}: {
  project: Project;
  cover: ProjectCover | null;
  gallery: GalleryItem[];
  services: { name: string; slug: string }[];
  /** The project's page in the Creative Vault, when it has a live one. */
  vaultPage?: string;
  next: NextProject | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const images = gallery.filter((item) => item.type === "image");
  const year = projectYear(project);
  // The short description already leads the masthead; the story is the long one.
  const about = (project.fullDescription ?? "")
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

  // The Vault page, when there is one, is the way to everything we made for the
  // project; otherwise any other portfolio link set for it.
  const portfolio = vaultPage ?? project.portfolioUrl;
  const hasSide = deliverables.length > 0 || services.length > 0 || Boolean(project.link || portfolio);

  return (
    <SitePage>
      <Masthead
        station="Projects"
        label={`Project · ${project.category}`}
        back={{ href: "/projects", label: "All projects" }}
        titleId="pd-title"
        loud={project.title}
        size="m"
        lede={project.description ? <p>{project.description}</p> : undefined}
        facts={facts}
      >
        {vaultPage ? (
          <div className="btn-row pd-mast-cta">
            <a className="btn-signal" href={vaultPage} target="_blank" rel="noopener noreferrer">
              Explore the full project <Arrow />
            </a>
          </div>
        ) : null}
      </Masthead>

      {cover ? (
        <section className="pd-cover ground ground-carbon" data-ground="carbon" aria-label="Cover">
          <div className="wrap">
            <Cover cover={cover} title={project.title} />
          </div>
        </section>
      ) : null}

      {about.length || hasSide ? (
        <LiveSection className="pd-story ground ground-paper" data-ground="paper" aria-labelledby="pd-story-title">
          <div className="wrap pd-story-grid">
            <Chan num="01">
              <span id="pd-story-title">About the project</span>
            </Chan>

            {about.length ? (
              <Reveal className="pd-about">
                {about.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </Reveal>
            ) : null}

            {hasSide ? (
              <Reveal as="aside" className="pd-side" delay={2}>
                {deliverables.length ? (
                  <div>
                    <p className="label">What we did</p>
                    <ul className="ticks" data-cols="1" data-lit="">
                      {deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {services.length ? (
                  <div>
                    <p className="label">Services</p>
                    <ul className="pd-links">
                      {services.map((service) => (
                        <li key={service.slug}>
                          <Link href={`/services/${service.slug}`}>
                            {service.name} <Arrow />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {project.link || portfolio ? (
                  <div className="pd-actions">
                    {vaultPage ? (
                      <a className="btn-signal" href={vaultPage} target="_blank" rel="noopener noreferrer">
                        Explore the full project <Arrow />
                      </a>
                    ) : null}
                    {project.link ? (
                      <a
                        className={vaultPage ? "btn-line" : "btn-signal"}
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit website <Arrow />
                      </a>
                    ) : null}
                    {portfolio && !vaultPage ? (
                      <a className="btn-line" href={portfolio} target="_blank" rel="noopener noreferrer">
                        View in portfolio <Arrow />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </Reveal>
            ) : null}
          </div>
        </LiveSection>
      ) : null}

      {gallery.length ? (
        <LiveSection className="pd-gallery ground ground-paper" data-ground="paper" aria-labelledby="pd-gallery-title">
          <div className="wrap">
            <div className="pd-gallery-head">
              <Chan num="02">
                <span id="pd-gallery-title">Project gallery</span>
              </Chan>
              <span className="mono" style={{ color: "var(--ink-soft)" }}>
                {pad(gallery.length)} {gallery.length === 1 ? "piece" : "pieces"}
              </span>
            </div>
            <div className="pd-gallery-grid">
              {gallery.map((item, i) => (
                <Reveal
                  as="figure"
                  className="pd-figure"
                  key={item.id}
                  data-wide={gallery.length % 2 === 1 && i === 0}
                  delay={i % 2}
                >
                  {item.type === "video" ? (
                    <div className="print">
                      <video
                        // Without a poster, nudge past 0s so a first frame paints.
                        src={item.image || item.video?.includes("#") ? item.video : `${item.video}#t=0.1`}
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
                      className="pd-zoom"
                      data-cursor="Zoom"
                      aria-label={`Open ${item.title || `image ${i + 1}`} larger`}
                      onClick={() => setOpen(images.indexOf(item))}
                    >
                      <Print
                        image={item.image}
                        alt={item.title || `${project.title}, image ${i + 1}`}
                        sizes="(max-width: 767px) 100vw, 50vw"
                        develop
                      />
                    </button>
                  )}
                  {item.title ? (
                    <figcaption>
                      <b>{pad(i + 1)}</b>
                      {item.title}
                    </figcaption>
                  ) : null}
                </Reveal>
              ))}
            </div>
          </div>
        </LiveSection>
      ) : null}

      {project.outcome ? (
        <LiveSection className="pd-outcome ground ground-signal" data-ground="signal" aria-labelledby="pd-outcome-title">
          <div className="wrap pd-outcome-grid">
            <Chan num="03">
              <span id="pd-outcome-title">Outcome</span>
            </Chan>
            <Reveal as="p" className="pd-outcome-text" data-long={project.outcome.length > 160 ? "" : undefined}>
              {project.outcome}
            </Reveal>
          </div>
        </LiveSection>
      ) : null}

      {next ? (
        <section className="pd-next ground ground-carbon" data-ground="carbon" aria-label="Next project">
          <div className="wrap">
            <Link className="pd-next-link" href={`/projects/${next.slug}`} data-cursor="Next">
              <span className="pd-next-text">
                <Chan>Next project · {next.category}</Chan>
                <span className="pd-next-title">
                  {next.title} <Arrow />
                </span>
              </span>
              {next.image ? <Print image={next.image} sizes="(max-width: 767px) 100vw, 30vw" /> : null}
            </Link>
          </div>
        </section>
      ) : null}

      {open !== null && images[open] ? (
        <Lightbox images={images} index={open} title={project.title} onIndex={setOpen} onClose={() => setOpen(null)} />
      ) : null}
    </SitePage>
  );
}

// ─── Cover ───────────────────────────────────────────────────────────────────

/** The cover at full content width. A video cover plays muted unless the visitor prefers reduced motion. */
function Cover({ cover, title }: { cover: ProjectCover; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().catch(() => {});
    }
  }, []);

  if (cover.type === "video" && cover.video) {
    return (
      <div className="print">
        <video
          ref={videoRef}
          src={cover.video}
          poster={cover.image || undefined}
          muted
          loop
          playsInline
          controls
          preload="metadata"
          aria-label={`${title}, video`}
        />
      </div>
    );
  }

  return (
    <div className="print">
      <Image src={cover.image} alt={title} fill sizes="100vw" preload />
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

  const step = useCallback((delta: number) => onIndex((index + delta + count) % count), [index, count, onIndex]);

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
          <b>
            {pad(index + 1)} / {pad(count)}
          </b>
          {item.title ? ` · ${item.title}` : ""}
        </span>
        <button ref={closeRef} type="button" className="pd-lb-close" onClick={onClose} aria-label="Close gallery">
          Close <span aria-hidden="true">×</span>
        </button>
      </div>

      <div
        className="pd-lb-stage"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <Image
          key={item.id}
          src={item.image}
          alt={item.title || `${title}, image ${index + 1}`}
          fill
          sizes="100vw"
          style={{ objectFit: "contain" }}
        />
      </div>

      {count > 1 ? (
        <>
          <button type="button" className="pd-lb-nav" data-dir="prev" aria-label="Previous image" onClick={() => step(-1)}>
            <Arrow />
          </button>
          <button type="button" className="pd-lb-nav" data-dir="next" aria-label="Next image" onClick={() => step(1)}>
            <Arrow />
          </button>
        </>
      ) : null}
    </div>
  );
}
