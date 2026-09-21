"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { ResolvedTopWork, Service } from "@/lib/types";

/**
 * A single service's page: /services/<slug>.
 *
 * Everything on it comes from the database — the copy, the deliverables, the
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
  /** Empty when the admin has not set one — the button then stays hidden. */
  portfolioUrl: string;
  otherServices: Pick<Service, "id" | "slug" | "name">[];
}) {
  return (
    <div className="sd">
      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section className="sd-hero" aria-labelledby="sd-title">
        {service.image ? (
          <div className="sd-hero-media" aria-hidden="true">
            <Image
              src={service.image}
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
              priority
            />
            <div className="sd-hero-scrim" />
          </div>
        ) : null}

        <div className="sd-wrap sd-hero-inner">
          <nav className="sd-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/services">Services</Link>
            <span aria-hidden="true">/</span>
            <span className="sd-crumbs-current">{service.name}</span>
          </nav>

          <div className="sd-hero-head">
            {!service.image ? (
              <span className="sd-hero-icon" aria-hidden="true">
                {service.icon}
              </span>
            ) : null}

            {/* 2. Service title */}
            <h1 className="sd-title" id="sd-title">
              {service.name}
            </h1>
          </div>

          {/* 3. Service description */}
          <p className="sd-lede">{service.shortDescription}</p>

          {service.tags.length ? (
            <div className="sd-tags">
              {service.tags.map((tag) => (
                <span className="sd-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="sd-hero-actions">
            <Link href="/contact" className="sd-btn sd-btn--primary">
              Start a project
              <span aria-hidden="true">→</span>
            </Link>
            {topWork.length ? (
              <a href="#top-work" className="sd-btn">
                See our top work
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {service.fullDescription &&
      service.fullDescription !== service.shortDescription ? (
        <Reveal as="section" className="sd-section sd-overview">
          <div className="sd-wrap sd-overview-grid">
            <div className="sd-section-label">
              <span className="sd-label-dot" aria-hidden="true" />
              Overview
            </div>
            <p className="sd-overview-text">{service.fullDescription}</p>
          </div>
        </Reveal>
      ) : null}

      {/* ── 4 + 5. What we offer / key services ──────────────────────────── */}
      {service.features.length ? (
        <Reveal as="section" className="sd-section sd-offer">
          <div className="sd-wrap">
            <div className="sd-section-head">
              <div className="sd-section-label">
                <span className="sd-label-dot" aria-hidden="true" />
                What we offer
              </div>
              <h2 className="sd-section-title">
                Everything included in
                <br />
                <em>{service.name}</em>
              </h2>
            </div>

            <ul className="sd-offer-grid">
              {service.features.map((feature, i) => (
                <li
                  className="sd-offer-item"
                  key={feature}
                  style={{ "--i": Math.min(i, 11) } as React.CSSProperties}
                >
                  <span className="sd-offer-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="sd-offer-name">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ) : null}

      {/* ── 6. Why choose this service ───────────────────────────────────── */}
      {service.benefits.length ? (
        <Reveal as="section" className="sd-section sd-why">
          <div className="sd-wrap sd-why-grid">
            <div className="sd-why-head">
              <div className="sd-section-label">
                <span className="sd-label-dot" aria-hidden="true" />
                Why choose us
              </div>
              <h2 className="sd-section-title">
                Why Mark UI for
                <br />
                <em>{service.name}</em>
              </h2>
            </div>

            <ul className="sd-why-list">
              {service.benefits.map((benefit, i) => (
                <li
                  className="sd-why-item"
                  key={benefit}
                  style={{ "--i": Math.min(i, 11) } as React.CSSProperties}
                >
                  <span className="sd-why-mark" aria-hidden="true">
                    ✦
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ) : null}

      {/* ── 7. Our Top Work ──────────────────────────────────────────────── */}
      {topWork.length ? (
        <Reveal as="section" className="sd-section sd-work" id="top-work">
          <div className="sd-wrap">
            <div className="sd-section-head">
              <div className="sd-section-label">
                <span className="sd-label-dot" aria-hidden="true" />
                Selected work
              </div>
              <h2 className="sd-section-title">
                Our <em>Top Work</em>
              </h2>
              <p className="sd-section-sub">
                {topWork.length} highlighted{" "}
                {topWork.length === 1 ? "piece" : "pieces"} from our{" "}
                {service.name.toLowerCase()} work.
              </p>
            </div>

            <div className="sd-work-grid">
              {topWork.map((work, i) => (
                <TopWorkCard key={work.id} work={work} index={i} />
              ))}
            </div>
          </div>
        </Reveal>
      ) : null}

      {/* ── 6. Check our portfolio ───────────────────────────────────────── */}
      {portfolioUrl ? (
        <Reveal as="section" className="sd-section sd-portfolio">
          <div className="sd-wrap sd-portfolio-inner">
            <div>
              <h2 className="sd-portfolio-title">
                See the full <em>portfolio</em>
              </h2>
              <p className="sd-portfolio-text">
                The complete archive of our work lives on our portfolio site —
                more projects, more detail, in every discipline.
              </p>
            </div>
            <a
              className="sd-portfolio-btn"
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Check our portfolio
              <span className="sd-portfolio-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </Reveal>
      ) : null}

      {/* ── 8. Closing CTA ───────────────────────────────────────────────── */}
      <Reveal as="section" className="sd-section sd-cta">
        <div className="sd-wrap sd-cta-inner">
          <h2 className="sd-cta-title">
            Ready to start your
            <br />
            <em>{service.name}</em> project?
          </h2>
          <p className="sd-cta-text">
            Tell us what you are trying to achieve and we will come back with a
            plan, a timeline and a price.
          </p>
          <div className="sd-cta-actions">
            <Link href="/contact" className="sd-btn sd-btn--primary">
              Get in touch
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/projects" className="sd-btn">
              Browse all projects
            </Link>
          </div>

          {otherServices.length ? (
            <div className="sd-other">
              <span className="sd-other-label">Other services</span>
              <div className="sd-other-links">
                {otherServices.map((other) => (
                  <Link key={other.id} href={`/services/${other.slug}`}>
                    {other.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Reveal>

      <style>{`
        /* ════════════════════════════════════════════
           SERVICE DETAIL
        ════════════════════════════════════════════ */
        .sd {
          --sd-bg:      #0a0a0a;
          --sd-bg-2:    #0f0f0f;
          --sd-card:    #141414;
          --sd-border:  rgba(255,255,255,0.09);
          --sd-txt:     #ffffff;
          --sd-txt-2:   #a8a8a8;
          --sd-txt-3:   #6f6f6f;
          --sd-accent:  var(--primary, #ff6b00);

          background: var(--sd-bg);
          color: var(--sd-txt);
          font-family: var(--font-sans);
        }

        .sd-wrap {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
        }

        .sd-section { padding: 96px 0; }

        /* ── Hero ── */
        .sd-hero {
          position: relative;
          padding: 168px 0 84px;
          overflow: hidden;
          border-bottom: 1px solid var(--sd-border);
        }

        .sd-hero::before {
          content: "";
          position: absolute;
          top: -40%; left: 12%;
          width: 760px; height: 700px;
          background: radial-gradient(
            circle,
            rgba(255,107,0,0.16) 0%,
            transparent 62%
          );
          pointer-events: none;
        }

        .sd-hero-media { position: absolute; inset: 0; }
        .sd-hero-media img { opacity: 0.30; }

        .sd-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10,10,10,0.72) 0%,
            rgba(10,10,10,0.88) 55%,
            var(--sd-bg) 100%
          );
        }

        .sd-hero-inner { position: relative; z-index: 1; }

        .sd-crumbs {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sd-txt-3);
          margin-bottom: 28px;
        }
        .sd-crumbs a { color: var(--sd-txt-3); transition: color 0.18s ease; }
        .sd-crumbs a:hover { color: var(--sd-accent); }
        .sd-crumbs-current { color: var(--sd-txt-2); }

        .sd-hero-head {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .sd-hero-icon {
          font-size: clamp(38px, 5vw, 56px);
          line-height: 1;
          color: var(--sd-accent);
        }

        .sd-title {
          font-family: var(--font-display);
          font-size: clamp(40px, 6.4vw, 88px);
          font-weight: 800;
          line-height: 0.96;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0;
        }

        .sd-lede {
          font-size: clamp(15px, 1.5vw, 18px);
          line-height: 1.7;
          color: var(--sd-txt-2);
          max-width: 62ch;
          margin: 24px 0 0;
        }

        .sd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 24px;
        }

        .sd-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sd-accent);
          border: 1px solid rgba(255,107,0,0.32);
          background: rgba(255,107,0,0.10);
          border-radius: 999px;
          padding: 5px 12px;
        }

        .sd-hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 36px;
        }

        /* ── Buttons ── */
        .sd-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 15px 30px;
          border-radius: 999px;
          border: 1px solid var(--sd-border);
          color: var(--sd-txt-2);
          transition: color 0.2s ease, border-color 0.2s ease,
                      background 0.2s ease, gap 0.2s ease;
        }
        .sd-btn:hover {
          color: var(--sd-txt);
          border-color: rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.05);
        }

        .sd-btn--primary {
          background: var(--sd-accent);
          border-color: var(--sd-accent);
          color: #fff;
        }
        .sd-btn--primary:hover {
          background: var(--primary-hover, #e55c00);
          border-color: var(--primary-hover, #e55c00);
          color: #fff;
          gap: 14px;
        }
        .sd-btn:focus-visible,
        .sd-portfolio-btn:focus-visible,
        .sd-work-card:focus-visible {
          outline: 2px solid var(--sd-accent);
          outline-offset: 3px;
        }

        /* ── Section furniture ── */
        .sd-section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sd-txt-3);
          margin-bottom: 18px;
        }

        .sd-label-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--sd-accent);
        }

        .sd-section-head { margin-bottom: 44px; }

        .sd-section-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 4.2vw, 54px);
          font-weight: 800;
          line-height: 1.02;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0;
        }
        .sd-section-title em { font-style: normal; color: var(--sd-accent); }

        .sd-section-sub {
          font-size: 14px;
          line-height: 1.7;
          color: var(--sd-txt-2);
          margin: 16px 0 0;
          max-width: 52ch;
        }

        /* ── Overview ── */
        .sd-overview { background: var(--sd-bg-2); border-block: 1px solid var(--sd-border); }

        .sd-overview-grid {
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          gap: 40px;
          align-items: start;
        }

        .sd-overview-text {
          font-size: clamp(15px, 1.5vw, 18px);
          line-height: 1.85;
          color: var(--sd-txt-2);
          margin: 0;
          max-width: 70ch;
        }

        /* ── What we offer ── */
        .sd-offer-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1px;
          background: var(--sd-border);
          border: 1px solid var(--sd-border);
          border-radius: 18px;
          overflow: hidden;
        }

        .sd-offer-item {
          display: flex;
          align-items: baseline;
          gap: 14px;
          padding: 26px 24px;
          background: var(--sd-bg);
          transition: background 0.25s ease;
        }
        .sd-offer-item:hover { background: var(--sd-card); }

        .sd-offer-num {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--sd-accent);
          flex-shrink: 0;
        }

        .sd-offer-name {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.005em;
        }

        /* ── Why choose ── */
        .sd-why { background: var(--sd-bg-2); border-block: 1px solid var(--sd-border); }

        .sd-why-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: 48px;
          align-items: start;
        }

        .sd-why-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sd-why-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 0;
          border-bottom: 1px solid var(--sd-border);
          font-size: 15.5px;
          line-height: 1.6;
          color: var(--sd-txt-2);
        }
        .sd-why-item:first-child { padding-top: 0; }
        .sd-why-item:last-child { border-bottom: none; }

        .sd-why-mark {
          color: var(--sd-accent);
          font-size: 12px;
          line-height: 1.6;
          flex-shrink: 0;
        }

        /* ── Top Work ── */
        .sd-work-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        @keyframes sdRise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sd-work-card {
          display: flex;
          flex-direction: column;
          background: var(--sd-card);
          border: 1px solid var(--sd-border);
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          animation: sdRise 0.5s cubic-bezier(0.25,1,0.5,1) backwards;
          animation-delay: calc(var(--i, 0) * 0.06s);
          transition: border-color 0.25s ease, transform 0.25s ease;
        }
        .sd-work-card:hover {
          border-color: rgba(255,107,0,0.42);
          transform: translateY(-3px);
        }

        .sd-work-visual {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background:
            radial-gradient(90% 120% at 25% 0%, #1c1c1c 0%, #101010 72%);
          border-bottom: 1px solid var(--sd-border);
        }

        .sd-work-visual img,
        .sd-work-visual video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .sd-work-card:hover .sd-work-visual img { transform: scale(1.05); }

        .sd-work-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 44px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.10);
          text-transform: uppercase;
        }

        .sd-work-badge {
          position: absolute;
          top: 12px; left: 12px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
          background: rgba(0,0,0,0.62);
          backdrop-filter: blur(6px);
          border-radius: 999px;
          padding: 5px 11px;
        }

        .sd-work-body {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding: 20px;
          flex: 1;
        }

        .sd-work-title {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          margin: 0;
        }

        .sd-work-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--sd-txt-2);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sd-work-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: auto;
          padding-top: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sd-accent);
        }

        /* ── Portfolio CTA ── */
        .sd-portfolio {
          padding: 0;
        }

        .sd-portfolio-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
          padding: 52px 48px;
          margin-inline: 48px;
          max-width: calc(1440px - 96px);
          border: 1px solid rgba(255,107,0,0.30);
          border-radius: 24px;
          background:
            linear-gradient(120deg, rgba(255,107,0,0.14) 0%, rgba(255,107,0,0.03) 55%),
            var(--sd-card);
        }

        .sd-portfolio-title {
          font-family: var(--font-display);
          font-size: clamp(26px, 3.4vw, 42px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .sd-portfolio-title em { font-style: normal; color: var(--sd-accent); }

        .sd-portfolio-text {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--sd-txt-2);
          max-width: 52ch;
          margin: 0;
        }

        /* Deliberately heavier than a card button — this is the page's exit. */
        .sd-portfolio-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          background: var(--sd-accent);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 21px 42px;
          border-radius: 999px;
          box-shadow: 0 0 0 0 rgba(255,107,0,0.45);
          transition: background 0.22s ease, box-shadow 0.35s ease,
                      transform 0.22s ease;
        }
        .sd-portfolio-btn:hover {
          background: var(--primary-hover, #e55c00);
          box-shadow: 0 0 44px 0 rgba(255,107,0,0.38);
          transform: translateY(-2px);
        }

        .sd-portfolio-arrow {
          font-size: 16px;
          transition: transform 0.22s ease;
        }
        .sd-portfolio-btn:hover .sd-portfolio-arrow {
          transform: translate(3px, -3px);
        }

        /* ── Closing CTA ── */
        .sd-cta {
          border-top: 1px solid var(--sd-border);
          text-align: center;
        }

        .sd-cta-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sd-cta-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 4.6vw, 60px);
          font-weight: 800;
          line-height: 1.02;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0 0 18px;
        }
        .sd-cta-title em { font-style: normal; color: var(--sd-accent); }

        .sd-cta-text {
          font-size: 15px;
          line-height: 1.75;
          color: var(--sd-txt-2);
          max-width: 46ch;
          margin: 0 0 32px;
        }

        .sd-cta-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .sd-other {
          margin-top: 56px;
          padding-top: 28px;
          border-top: 1px solid var(--sd-border);
          width: 100%;
        }

        .sd-other-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sd-txt-3);
          margin-bottom: 16px;
        }

        .sd-other-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .sd-other-links a {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--sd-txt-2);
          border: 1px solid var(--sd-border);
          border-radius: 999px;
          padding: 9px 18px;
          transition: color 0.18s ease, border-color 0.18s ease;
        }
        .sd-other-links a:hover {
          color: var(--sd-accent);
          border-color: rgba(255,107,0,0.4);
        }

        /* ── Reveal ── */
        .sd-reveal {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .sd-reveal[data-in="true"] { opacity: 1; transform: none; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .sd-overview-grid,
          .sd-why-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
          }
        }

        @media (max-width: 960px) {
          .sd-wrap { padding: 0 28px; }
          .sd-portfolio-inner {
            margin-inline: 28px;
            max-width: calc(1440px - 56px);
            padding: 36px 28px;
          }
        }

        @media (max-width: 640px) {
          .sd-hero { padding: 128px 0 64px; }
          .sd-section { padding: 68px 0; }
          .sd-section-head { margin-bottom: 32px; }
          .sd-title { font-size: clamp(34px, 10vw, 52px); }
          .sd-offer-grid { grid-template-columns: 1fr; }
          .sd-work-grid { grid-template-columns: 1fr; }
          .sd-hero-actions .sd-btn,
          .sd-cta-actions .sd-btn { flex: 1 1 100%; justify-content: center; }
          .sd-portfolio-inner { flex-direction: column; align-items: flex-start; }
          .sd-portfolio-btn { width: 100%; justify-content: center; padding: 19px 28px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sd-reveal, .sd-work-card, .sd-portfolio-btn,
          .sd-work-visual img, .sd-btn {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Top Work card ───────────────────────────────────────────────────────────

function TopWorkCard({
  work,
  index,
}: {
  work: ResolvedTopWork;
  index: number;
}) {
  const inner = (
    <>
      <div className="sd-work-visual">
        {work.mediaType === "video" && work.video ? (
          <video
            src={work.video}
            poster={work.image || undefined}
            muted
            loop
            playsInline
            autoPlay
          />
        ) : work.image ? (
          <Image
            src={work.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="sd-work-placeholder" aria-hidden="true">
            {work.title.slice(0, 2)}
          </div>
        )}
        {work.category ? (
          <span className="sd-work-badge">{work.category}</span>
        ) : null}
      </div>

      <div className="sd-work-body">
        <h3 className="sd-work-title">{work.title}</h3>
        {work.description ? (
          <p className="sd-work-desc">{work.description}</p>
        ) : null}
        {work.link ? (
          <span className="sd-work-link">
            View work <span aria-hidden="true">↗</span>
          </span>
        ) : null}
      </div>
    </>
  );

  const style = { "--i": Math.min(index, 11) } as React.CSSProperties;

  if (work.link) {
    return (
      <a
        className="sd-work-card"
        style={style}
        href={work.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={work.title}
      >
        {inner}
      </a>
    );
  }

  return (
    <article className="sd-work-card" style={style}>
      {inner}
    </article>
  );
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────

/** Fades a section in the first time it scrolls into view. */
function Reveal({
  as: Tag = "section",
  className = "",
  children,
  ...rest
}: {
  as?: "section" | "div";
  className?: string;
  children: React.ReactNode;
  id?: string;
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
      { threshold: 0.08 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement & HTMLDivElement>}
      className={`sd-reveal ${className}`}
      data-in={inView}
      {...rest}
    >
      {children}
    </Tag>
  );
}
