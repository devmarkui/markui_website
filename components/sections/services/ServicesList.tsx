"use client";

import "./services.css";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import ClosingCta from "@/components/site/ClosingCta";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import Print from "@/components/site/Print";
import { Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { isExternalUrl } from "@/lib/products";
import type { ResolvedTopWork, Service } from "@/lib/types";

/** Thumbnails shown per service; the rest stay on the service's own page. */
const MAX_TOP_WORK = 6;

export interface ServiceWithTopWork {
  service: Service;
  topWork: ResolvedTopWork[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const anchor = (service: Service) => `service-${service.slug}`;

/** Items with nothing to show are left out rather than drawn as blank tiles. */
function hasMedia(work: ResolvedTopWork) {
  return Boolean(work.image || (work.mediaType === "video" && work.video));
}

/**
 * The public /services page: one channel band per service, the details on
 * the left and that service's Top Work on the right. Everything comes from
 * the database; the admin controls which services appear, their order and
 * copy, and the work inside each one.
 */
export default function ServicesList({
  services,
  portfolioUrl,
}: {
  services: ServiceWithTopWork[];
  portfolioUrl: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // The band holding the middle of the screen is the one turned up.
  useEffect(() => {
    const bands = listRef.current?.querySelectorAll<HTMLElement>("[data-band]");
    if (!bands?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.band ?? null);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    bands.forEach((band) => observer.observe(band));
    return () => observer.disconnect();
  }, []);

  // Keep the live channel in sight on a bar that scrolls sideways.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const link = active ? scroller?.querySelector<HTMLElement>(`[data-for="${active}"]`) : null;
    if (!scroller || !link) return;
    const left = link.offsetLeft;
    const right = left + link.offsetWidth;
    if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: Math.max(0, left - 24), behavior: "smooth" });
    }
  }, [active]);

  const shownTotal = services.reduce((sum, { topWork }) => sum + Math.min(MAX_TOP_WORK, topWork.filter(hasMedia).length), 0);

  return (
    <SitePage>
      <Masthead
        station="Services"
        label="What we do"
        titleId="services-title"
        quiet="Every discipline,"
        loud="one team"
        lede={
          <p>
            From strategy and design to production and development, our team handles every part of your
            brand&apos;s digital presence. Each channel below lists what it includes, beside a selection of recent
            work.
          </p>
        }
        readouts={[
          { label: "Services", value: pad(services.length) },
          ...(shownTotal ? [{ label: "Pieces of work", value: pad(shownTotal) }] : []),
        ]}
      />

      {services.length === 0 ? (
        <section className="ground ground-carbon" data-ground="carbon">
          <p className="wrap sv-none">No services are listed right now. Please check back soon.</p>
        </section>
      ) : (
        <section className="sv-list ground ground-carbon" data-ground="carbon" aria-label="Our services">
          <nav className="sv-bar" aria-label="Jump to a service">
            <div className="wrap sv-bar-inner">
              <p className="sv-bar-label">Channels</p>
              <div className="sv-bar-scroll" ref={scrollerRef}>
                <ul className="sv-bar-list">
                  {services.map(({ service }, i) => (
                    <li key={service.id}>
                      <a
                        className="sv-bar-link"
                        href={`#${anchor(service)}`}
                        data-for={anchor(service)}
                        aria-current={active === anchor(service) ? "true" : undefined}
                      >
                        <b>{pad(i + 1)}</b>
                        {service.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>

          <div ref={listRef}>
            {services.map(({ service, topWork }, index) => (
              <ServiceBand
                key={service.id}
                service={service}
                topWork={topWork}
                index={index}
                live={active === anchor(service)}
                portfolioUrl={portfolioUrl}
              />
            ))}
          </div>
        </section>
      )}

      <ClosingCta
        quiet="Let's work"
        loud="together"
        text="Tell us what you're planning and we'll come back with ideas, timelines and a clear proposal."
      />
    </SitePage>
  );
}

// ─── One service ─────────────────────────────────────────────────────────────

function ServiceBand({
  service,
  topWork,
  index,
  live,
  portfolioUrl,
}: {
  service: Service;
  topWork: ResolvedTopWork[];
  index: number;
  live: boolean;
  portfolioUrl: string;
}) {
  const headingId = `${anchor(service)}-title`;
  const shown = topWork.filter(hasMedia).slice(0, MAX_TOP_WORK);
  const leadWide = shown.length % 2 === 1;
  // A link set in the dashboard wins; otherwise the detail page.
  const href = service.ctaLink || `/services/${service.slug}`;
  const external = Boolean(service.ctaLink && isExternalUrl(service.ctaLink));

  return (
    <article
      className={live ? "sv-band is-live" : "sv-band"}
      id={anchor(service)}
      data-band={anchor(service)}
      aria-labelledby={headingId}
    >
      <div className="wrap sv-band-grid">
        <div className="sv-band-head">
          <p className="chan">
            <span className="chan-led" aria-hidden="true" />
            <span className="chan-num">CH {pad(index + 1)}</span>
            {service.tags.length ? (
              <>
                <span className="chan-sep" aria-hidden="true" />
                <span>{service.tags.join(" / ")}</span>
              </>
            ) : null}
          </p>

          <h2 className="sv-name" id={headingId}>
            {service.name}
          </h2>

          {service.shortDescription ? <p className="sv-short">{service.shortDescription}</p> : null}
          {service.fullDescription && service.fullDescription !== service.shortDescription ? (
            <p className="sv-full">{service.fullDescription}</p>
          ) : null}

          {service.features.length ? (
            <div className="sv-offer">
              <p className="label">What we offer</p>
              <ul className="ticks">
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="btn-row">
            <Link
              className="btn-signal"
              href={href}
              aria-label={`Explore ${service.name}${external ? " (opens in a new tab)" : ""}`}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              Explore service <Arrow />
            </Link>
          </div>
        </div>

        <Reveal className="sv-work">
          <div className="sv-work-head">
            <p className="label">Our top work</p>
            {shown.length ? <span className="mono sv-work-count">{pad(shown.length)}</span> : null}
          </div>

          {shown.length ? (
            <div className="sv-work-grid">
              {shown.map((work, i) => (
                <WorkItem
                  key={work.id}
                  work={work}
                  feature={leadWide && i === 0}
                  // Only the first service's first row is likely above the fold.
                  eager={index === 0 && i < 2}
                  fallbackUrl={portfolioUrl}
                />
              ))}
            </div>
          ) : (
            <p className="sv-empty">No work added yet.</p>
          )}
        </Reveal>
      </div>
    </article>
  );
}

// ─── One Top Work item ───────────────────────────────────────────────────────

function WorkItem({
  work,
  feature,
  eager,
  fallbackUrl,
}: {
  work: ResolvedTopWork;
  feature: boolean;
  eager: boolean;
  fallbackUrl: string;
}) {
  // The item's own portfolio URL wins; otherwise the site-wide portfolio.
  const href = work.link || fallbackUrl;
  const video = work.mediaType === "video" ? work.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), { touch: "in-view" });
  const sizes = feature ? "(max-width: 1099px) 100vw, 45vw" : "(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 22vw";

  const inner = (
    <>
      <Print
        image={work.image}
        video={video}
        sizes={sizes}
        eager={eager}
        videoRef={videoRef}
        playing={playing}
        develop
      />
      <p className="sv-item-title">
        <span>{work.title}</span>
        {href ? <Arrow /> : null}
      </p>
      {work.category ? <p className="sv-item-cat">{work.category}</p> : null}
    </>
  );

  const itemHandlers = video ? handlers : undefined;

  if (!href) {
    return (
      <div className="sv-item" data-feature={feature} {...itemHandlers}>
        {inner}
      </div>
    );
  }

  return (
    <a
      className="sv-item"
      data-feature={feature}
      data-cursor="View"
      {...itemHandlers}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${work.title}${work.category ? `, ${work.category}` : ""}. Opens in our portfolio (new tab)`}
    >
      {inner}
    </a>
  );
}
