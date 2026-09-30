"use client";

import "./service-detail.css";

import Link from "next/link";

import Chan from "@/components/site/Chan";
import ClosingCta from "@/components/site/ClosingCta";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import Print from "@/components/site/Print";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import type { ResolvedTopWork, Service } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A single service's page: /services/<slug>.
 *
 * Everything on it comes from the database: the copy, the deliverables, the
 * reasons to choose it, and the Top Work, which is filtered to this service
 * only via the Service → Top Work relationship.
 */
export default function ServiceDetail({
  service,
  topWork,
  portfolioUrl,
  otherServices,
}: {
  service: Service;
  topWork: ResolvedTopWork[];
  /** Empty when the admin has not set one — the band then stays hidden. */
  portfolioUrl: string;
  otherServices: Pick<Service, "id" | "slug" | "name">[];
}) {
  const overview =
    service.fullDescription && service.fullDescription !== service.shortDescription
      ? service.fullDescription
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
  let section = 0;
  const next = () => pad(++section);

  return (
    <SitePage>
      <Masthead
        station="Services"
        label="Service"
        back={{ href: "/services", label: "All services" }}
        titleId="sd-title"
        loud={service.name}
        size="m"
        backdrop={service.image || undefined}
        lede={service.shortDescription ? <p>{service.shortDescription}</p> : undefined}
      >
        <div className="sd-mast-extra">
          <div className="btn-row">
            <Link className="btn-signal" href="/contact">
              Start a project <Arrow />
            </Link>
            {topWork.length ? (
              <a className="btn-line" href="#top-work">
                See our top work <Arrow />
              </a>
            ) : null}
          </div>
          {service.tags.length ? (
            <ul className="chips" aria-label="Tags">
              {service.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </Masthead>

      {overview.length || service.features.length ? (
        <div className="ground ground-bone" data-ground="bone">
          {overview.length ? (
            <LiveSection className="sd-overview" aria-label="Overview">
              <div className="wrap sd-overview-grid">
                <Chan num={next()}>Overview</Chan>
                <Reveal className="sd-overview-text">
                  {overview.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </Reveal>
              </div>
            </LiveSection>
          ) : null}

          {service.features.length ? (
            <LiveSection
              className="sd-offer"
              aria-labelledby="sd-offer-title"
              style={overview.length ? undefined : { paddingTop: "var(--section-y)" }}
            >
              <div className="wrap">
                <div className="sec-head">
                  <Chan num={next()}>What we offer</Chan>
                  <h2 className="sec-title" id="sd-offer-title">
                    <span className="q">Everything included in</span> {service.name}
                  </h2>
                </div>
                <ul className="sd-offer-grid">
                  {service.features.map((feature, i) => (
                    <Reveal as="li" className="sd-offer-item" key={feature} delay={i % 4}>
                      <span className="sd-offer-num">{pad(i + 1)}</span>
                      <span className="sd-offer-name">{feature}</span>
                    </Reveal>
                  ))}
                </ul>
              </div>
            </LiveSection>
          ) : null}
        </div>
      ) : null}

      {service.benefits.length ? (
        <LiveSection className="sd-why ground ground-carbon" data-ground="carbon" aria-labelledby="sd-why-title">
          <div className="wrap sd-why-grid">
            <div className="sd-why-head">
              <Chan num={next()}>Why choose us</Chan>
              <h2 className="sec-title" id="sd-why-title">
                <span className="q">Why Mark UI for</span> {service.name}
              </h2>
            </div>
            <ul className="sd-why-list">
              {service.benefits.map((benefit, i) => (
                <Reveal as="li" className="sd-why-item" key={benefit} delay={i % 4}>
                  <span className="sd-why-num">{pad(i + 1)}</span>
                  <span className="sd-why-text">{benefit}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </LiveSection>
      ) : null}

      {topWork.length ? (
        <LiveSection
          className="sd-work ground ground-paper"
          data-ground="paper"
          id="top-work"
          aria-labelledby="sd-work-title"
        >
          <div className="wrap">
            <div className="sec-head">
              <Chan num={next()}>Selected work</Chan>
              <h2 className="sec-title" id="sd-work-title">
                <span className="q">Our</span> top work
              </h2>
              <p className="sec-lede">
                {topWork.length} highlighted {topWork.length === 1 ? "piece" : "pieces"} from our{" "}
                {service.name.toLowerCase()} work.
              </p>
            </div>
            <div className="sd-work-grid">
              {topWork.map((work, i) => (
                <TopWorkCard key={work.id} work={work} delay={i % 3} />
              ))}
            </div>
          </div>
        </LiveSection>
      ) : null}

      {portfolioUrl ? (
        <LiveSection
          className="sd-portfolio ground ground-signal"
          data-ground="signal"
          aria-labelledby="sd-portfolio-title"
        >
          <div className="wrap sd-portfolio-grid">
            <Chan>Portfolio</Chan>
            <h2 className="sd-portfolio-title" id="sd-portfolio-title">
              <span className="q">See the full</span> portfolio.
            </h2>
            <div className="sd-portfolio-side">
              <p>
                The complete archive of our work lives on our portfolio site: more projects, more detail, in every
                discipline.
              </p>
              <a className="btn-signal btn-ink" href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                Check our portfolio <Arrow />
              </a>
            </div>
          </div>
        </LiveSection>
      ) : null}

      <ClosingCta
        quiet="Ready to start your"
        loud={`${service.name} project`}
        text="Tell us what you're trying to achieve and we'll come back with a plan, a timeline and a price."
        secondary={{ href: "/projects", label: "Browse all projects" }}
      />

      {otherServices.length ? (
        <LiveSection className="sd-others ground ground-carbon" data-ground="carbon" aria-labelledby="sd-others-title">
          <div className="wrap">
            <Chan>
              <span id="sd-others-title">Other channels</span>
            </Chan>
            <ul className="ch-rows">
              {otherServices.map((other, i) => (
                <li key={other.id}>
                  <Link className="ch-row" href={`/services/${other.slug}`}>
                    <span className="ch-row-num">CH {pad(i + 1)}</span>
                    <span className="ch-row-name">{other.name}</span>
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </LiveSection>
      ) : null}
    </SitePage>
  );
}

// ─── Top Work card ───────────────────────────────────────────────────────────

function TopWorkCard({ work, delay }: { work: ResolvedTopWork; delay: number }) {
  const video = work.mediaType === "video" && work.video ? work.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), { touch: "in-view" });

  const inner = (
    <>
      <Print
        image={work.image}
        video={video}
        sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
        videoRef={videoRef}
        playing={playing}
        develop
      >
        {!work.image && !video ? (
          <span className="sd-card-placeholder" aria-hidden="true">
            {work.title.slice(0, 2)}
          </span>
        ) : null}
        {work.category ? <span className="sd-card-badge">{work.category}</span> : null}
      </Print>
      <h3 className="sd-card-title">{work.title}</h3>
      {work.description ? <p className="sd-card-desc">{work.description}</p> : null}
      {work.link ? (
        <span className="sd-card-go">
          View work <Arrow />
        </span>
      ) : null}
    </>
  );

  if (work.link) {
    return (
      <Reveal delay={delay}>
        <a
          className="sd-card"
          href={work.link}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="View"
          aria-label={`${work.title}. Opens in a new tab`}
          {...(video ? handlers : {})}
        >
          {inner}
        </a>
      </Reveal>
    );
  }

  return (
    <Reveal as="article" className="sd-card" delay={delay} {...(video ? handlers : {})}>
      {inner}
    </Reveal>
  );
}
