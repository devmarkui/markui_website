"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LISTING_CSS } from "@/components/sections/shared/listing-styles";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { isExternalUrl } from "@/lib/products";
import type { ResolvedTopWork, Service } from "@/lib/types";

/** Thumbnails shown per service; the rest stay on the service's own page. */
const MAX_TOP_WORK = 6;

export interface ServiceWithTopWork {
  service: Service;
  topWork: ResolvedTopWork[];
}

/**
 * The public /services page. Each service is a full-width band — its rules run
 * edge to edge and its content sits on the site's 1440px grid — with the
 * service details on the left and that service's Top Work on the right.
 *
 * Everything here comes from the database — the admin controls which services
 * appear, their order and copy, and which work sits inside each one.
 */
export default function ServicesList({
  services,
  portfolioUrl,
}: {
  services: ServiceWithTopWork[];
  portfolioUrl: string;
}) {
  return (
    <section className="sl" aria-labelledby="sl-heading">
      <div className="sl-band">
        <div className="sl-wrap">
          <Reveal className="sl-header">
            <div>
              <span className="sl-eyebrow">What we do</span>
              <h1 className="sl-heading" id="sl-heading">
                Our<br />
                <em>Services</em>
              </h1>
            </div>
            <p className="sl-subtext">
              From strategy and design to production and development, our team
              handles every part of your brand&apos;s digital presence. Each
              service below lists what it includes, alongside a selection of
              recent work.
            </p>
          </Reveal>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="sl-wrap">
          <Reveal className="sl-empty">
            <p>No services are listed right now — please check back soon.</p>
          </Reveal>
        </div>
      ) : (
        <div className="sl-list">
          {services.map(({ service, topWork }, index) => (
            <ServiceRow
              key={service.id}
              service={service}
              topWork={topWork}
              index={index}
              portfolioUrl={portfolioUrl}
            />
          ))}
        </div>
      )}

      <div className="sl-wrap">
        <Reveal className="sl-cta">
          <div>
            <span className="sl-eyebrow">Start a project</span>
            <h2 className="sl-cta-heading">
              Let&apos;s work<br />
              <em>together</em>
            </h2>
          </div>
          <div className="sl-cta-side">
            <p className="sl-cta-text">
              Tell us what you&apos;re planning and we&apos;ll get back to you
              with ideas, timelines and a clear proposal.
            </p>
            <Link href="/contact" className="sl-btn sl-btn--solid">
              Contact us
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </div>

      <style>{LISTING_CSS}</style>
    </section>
  );
}

// ─── One service ─────────────────────────────────────────────────────────────

/** Items with nothing to show are left out rather than drawn as blank tiles. */
function hasMedia(work: ResolvedTopWork) {
  return Boolean(work.image || (work.mediaType === "video" && work.video));
}

function ServiceRow({
  service,
  topWork,
  index,
  portfolioUrl,
}: {
  service: Service;
  topWork: ResolvedTopWork[];
  index: number;
  portfolioUrl: string;
}) {
  const headingId = `sl-service-${service.id}`;
  const shown = topWork.filter(hasMedia).slice(0, MAX_TOP_WORK);
  const leadWide = shown.length % 2 === 1;

  return (
    <Reveal as="article" className="sl-row" aria-labelledby={headingId}>
      <div className="sl-row-inner">
        <div className="sl-info">
          <div className="sl-info-top">
            <span className="sl-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            {service.tags.length ? (
              <p className="sl-tags">{service.tags.join("  /  ")}</p>
            ) : null}
          </div>

          <h2 className="sl-name" id={headingId}>
            {service.name}
          </h2>

          {service.shortDescription ? (
            <p className="sl-short">{service.shortDescription}</p>
          ) : null}
          {service.fullDescription &&
          service.fullDescription !== service.shortDescription ? (
            <p className="sl-full">{service.fullDescription}</p>
          ) : null}

          {service.features.length ? (
            <>
              <p className="sl-label">What we offer</p>
              <ul className="sl-features">
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </>
          ) : null}

          {/* A link set in the dashboard wins; otherwise the detail page. */}
          <Link
            href={service.ctaLink || `/services/${service.slug}`}
            className="sl-btn"
            aria-label={`Explore ${service.name}`}
            {...(service.ctaLink && isExternalUrl(service.ctaLink)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            Explore service
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="sl-work">
          <div className="sl-work-head">
            <p className="sl-label">Our top work</p>
            {shown.length ? (
              <span className="sl-work-count">
                {String(shown.length).padStart(2, "0")}
              </span>
            ) : null}
          </div>

          {shown.length ? (
            <div className="sl-work-grid">
              {shown.map((work, i) => (
                <WorkItem
                  key={work.id}
                  work={work}
                  feature={leadWide && i === 0}
                  // Only the first service's first row is likely above the fold.
                  priority={index === 0 && i < 2}
                  fallbackUrl={portfolioUrl}
                />
              ))}
            </div>
          ) : (
            <p className="sl-work-empty">No work added yet.</p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// ─── One Top Work item ───────────────────────────────────────────────────────

function WorkItem({
  work,
  feature,
  priority,
  fallbackUrl,
}: {
  work: ResolvedTopWork;
  feature: boolean;
  priority: boolean;
  fallbackUrl: string;
}) {
  // The item's own portfolio URL wins; otherwise the site-wide portfolio.
  const href = work.link || fallbackUrl;
  const video = work.mediaType === "video" ? work.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), {
    touch: "in-view",
  });
  const sizes = feature
    ? "(max-width: 960px) 100vw, 45vw"
    : "(max-width: 960px) 50vw, 22vw";

  const inner = (
    <>
      <div className="sl-thumb" data-playing={playing}>
        {video ? (
          <>
            <video
              ref={videoRef}
              // Without a poster, nudge past 0s so Safari paints a first frame.
              src={(work.image || video.includes("#")) ? video : `${video}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
            />
            {work.image ? (
              <Image
                className="sl-poster"
                src={work.image}
                alt=""
                fill
                sizes={sizes}
                priority={priority}
              />
            ) : null}
            <span className="sl-thumb-kind">Video</span>
          </>
        ) : (
          <Image
            src={work.image}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
          />
        )}
      </div>
      <div>
        <h3 className="sl-item-title">
          <span className="sl-item-title-text">{work.title}</span>
          {href ? (
            <span className="sl-item-go" aria-hidden="true">
              ↗
            </span>
          ) : null}
        </h3>
        {work.category ? (
          <span className="sl-item-label">{work.category}</span>
        ) : null}
      </div>
    </>
  );

  const itemHandlers = video ? handlers : undefined;

  if (!href) {
    return (
      <div className="sl-item" data-feature={feature} {...itemHandlers}>
        {inner}
      </div>
    );
  }

  return (
    <a
      className="sl-item"
      data-feature={feature}
      {...itemHandlers}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${work.title}${work.category ? `, ${work.category}` : ""} — opens in our portfolio (new tab)`}
    >
      {inner}
    </a>
  );
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────

/** Fades an element up into place the first time it scrolls into view. */
function Reveal({
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: {
  as?: "div" | "article";
  className?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
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
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`sl-reveal ${className}`}
      data-in={inView}
      {...rest}
    >
      {children}
    </Tag>
  );
}
