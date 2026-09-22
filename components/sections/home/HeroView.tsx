"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import HeroArt from "@/components/sections/home/HeroIllustrations";
import RichText from "@/components/ui/RichText";
import type { HeroService, HomeContent } from "@/lib/types";

/** How long each service stays on a card. */
const ROTATE_MS = 3500;

/** Site paths navigate in-app; a full URL opens in a new tab. */
function SmartLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

export default function HeroView({
  content,
  itServices,
  marketingServices,
}: {
  content: HomeContent;
  itServices: HeroService[];
  marketingServices: HeroService[];
}) {
  const heroRef = useRef<HTMLElement>(null);
  /** The cards only rotate while the hero is on screen. */
  const [heroVisible, setHeroVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const panels = [
    {
      key: "it",
      tone: "dark",
      label: content.itTitle,
      description: content.itDescription,
      link: content.itLink,
      fallbackArt: "code",
      services: itServices,
      offset: 0,
    },
    {
      key: "marketing",
      tone: "light",
      label: content.marketingTitle,
      description: content.marketingDescription,
      link: content.marketingLink,
      fallbackArt: "growth",
      services: marketingServices,
      // Half a beat later, so the two cards never change at the same moment.
      offset: ROTATE_MS / 2,
    },
  ] as const;

  return (
    <>
      <style>{`
        :root {
          --primary:    #ff6b00;
          --white:      #ffffff;
          --white-80:   rgba(255,255,255,0.80);
          --white-55:   rgba(255,255,255,0.55);
          --white-20:   rgba(255,255,255,0.20);
          --black:      #0a0a0a;
        }

        *,*::before,*::after { box-sizing: border-box; margin:0; padding:0; }

        /* ── SECTION ── */
        .h-section {
          position: relative;
          width: 100%;
          min-height: 100svh;
          background: var(--primary);
          overflow: hidden;
          font-family: var(--font-sans);
          display: flex;
          flex-direction: column;
          /* Centred in the space under the navbar rather than pinned low. */
          justify-content: center;
        }

        /* ── BG GRADIENT ── */
        .h-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse 80% 55% at 50% 105%, rgba(180,45,0,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 55% 35% at 50% 50%,  rgba(255,150,0,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── NOISE GRAIN ── */
        .h-grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E");
          background-size: 180px 180px;
          mix-blend-mode: overlay;
          opacity: 0.65;
        }

        /* ── STARS ── */
        .h-star {
          position: absolute;
          pointer-events: none;
          z-index: 3;
          color: rgba(255,255,255,0.50);
          animation: starPulse 3s ease-in-out infinite;
        }
        @keyframes starPulse {
          0%,100% { opacity:0.30; transform:scale(1)   rotate(0deg);  }
          50%      { opacity:0.80; transform:scale(1.5) rotate(20deg); }
        }

        @keyframes h-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── BOTTOM LINES ── */
        .h-lines {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          z-index: 30;
          pointer-events: none;
        }
        .h-line {
          height: 3px;
          background: var(--white);
          margin-bottom: 4px;
        }

        /* ══════════════════════════════
           LAYOUT
        ══════════════════════════════ */
        .h-inner {
          position: relative;
          z-index: 20;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 104px 48px 64px;
          display: grid;
          /* Text and cards sit together as one centred group. */
          grid-template-columns: minmax(0, 560px) auto;
          justify-content: center;
          align-items: center;
          gap: clamp(48px, 6vw, 112px);
        }

        /* ── TEXT ── */
        .h-left {
          min-width: 0;
          max-width: 560px;
          animation: h-fade-up 0.8s ease backwards;
          animation-delay: 0.1s;
        }

        .h-headline {
          font-size: clamp(34px,4.2vw,62px);
          font-weight: 200;
          line-height: 0.93;
          letter-spacing: -0.03em;
          color: var(--white);
          margin-bottom: 20px;
          font-family: var(--font-display);
          overflow-wrap: anywhere;
        }

        .h-body {
          font-size: 13.5px;
          line-height: 1.75;
          color: var(--white-80);
          margin-bottom: 34px;
          max-width: 440px;
          overflow-wrap: anywhere;
        }

        .h-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: var(--white);
          color: var(--black);
          padding: 15px 28px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        }
        .h-cta:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 40px rgba(0,0,0,0.30);
        }
        .h-cta:focus-visible {
          outline: 2px solid var(--white);
          outline-offset: 3px;
        }
        .h-cta-icon {
          width: 26px; height: 26px;
          background: var(--black); color: var(--white);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }

        /* ══════════════════════════════
           SERVICE PANELS
        ══════════════════════════════ */
        .h-panels {
          display: grid;
          grid-template-columns: repeat(2, clamp(210px, 17vw, 270px));
          gap: 16px;
        }

        .h-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          height: clamp(400px, 60svh, 560px);
          padding: 22px 22px 26px;
          border-radius: 6px;
          text-decoration: none;
          overflow: hidden;
          animation: h-fade-up 0.9s cubic-bezier(0.23,1,0.32,1) backwards;
          transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease;
          box-shadow: 0 18px 50px rgba(90,30,0,0.18);
        }
        .h-panel:nth-child(1) { animation-delay: 0.25s; }
        .h-panel:nth-child(2) { animation-delay: 0.4s; }

        .h-panel--dark  { background: var(--black); color: var(--white); }
        .h-panel--light { background: var(--white); color: var(--black); }

        a.h-panel:hover { transform: translateY(-6px); box-shadow: 0 26px 60px rgba(90,30,0,0.26); }
        a.h-panel:focus-visible { outline: 2px solid var(--white); outline-offset: 4px; }

        .h-panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }
        .h-panel-index { display: inline-flex; align-items: center; gap: 8px; }
        .h-panel-index::before {
          content: "";
          width: 6px; height: 6px;
          background: var(--primary);
        }
        .h-panel--dark  .h-panel-index { color: var(--white-55); }
        .h-panel--light .h-panel-index { color: rgba(10,10,10,0.5); }

        .h-panel-arrow {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          border: 1px solid currentColor;
          opacity: 0.4;
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }
        a.h-panel:hover .h-panel-arrow {
          opacity: 1;
          background: var(--primary);
          border-color: var(--primary);
          color: var(--white);
          transform: rotate(45deg);
        }

        .h-panel-total { margin-left: 6px; opacity: 0.55; }

        /* ── Rotating services: all stacked in one cell, cross-faded ── */
        .h-slides {
          flex: 1;
          min-height: 0;
          display: grid;
        }
        .h-slide {
          grid-area: 1 / 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          opacity: 0;
          visibility: hidden;
          /* Outgoing fades quickly, so the two never read on top of each other. */
          transition: opacity 0.25s ease, visibility 0s linear 0.25s;
        }
        .h-slide[data-active="true"] {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.5s ease 0.22s, visibility 0s;
        }

        .h-fade { display: inline-block; animation: h-fade-in 0.6s ease both; }
        @keyframes h-fade-in { from { opacity: 0; } }

        .h-panel-art {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
          padding: 18px 0;
        }
        .h-panel-art svg { width: 100%; max-width: 190px; height: auto; max-height: 100%; }
        .h-panel-art-img {
          position: relative;
          display: block;
          width: 100%;
          max-width: 190px;
          height: 100%;
          min-height: 90px;
        }
        .h-panel-art-img img { object-fit: contain; }

        .h-panel-kicker {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 10px;
        }

        .h-panel-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 1.6vw, 26px);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          margin-bottom: 12px;
          overflow-wrap: break-word;
        }
        .h-panel-desc {
          font-size: 13px;
          line-height: 1.6;
        }
        .h-panel--dark  .h-panel-desc { color: rgba(255,255,255,0.62); }
        .h-panel--light .h-panel-desc { color: rgba(10,10,10,0.62); }

        /* ── Illustration motion: replays each time a service comes up ── */
        .h-code-line, .h-bar, .h-pop { transform-box: fill-box; }
        .h-code-line { transform-origin: left center; }
        .h-bar { transform-origin: bottom center; }
        .h-pop { transform-origin: center; }
        .h-trend { stroke-dasharray: 260; }

        .h-slide[data-active="true"] .h-caret { animation: h-caret 1.1s steps(1) infinite; }
        .h-slide[data-active="true"] .h-code-line { animation: h-grow-x 0.9s cubic-bezier(0.23,1,0.32,1) backwards; }
        .h-slide[data-active="true"] .h-bar { animation: h-grow-y 0.9s cubic-bezier(0.23,1,0.32,1) backwards; }
        .h-slide[data-active="true"] .h-pop { animation: h-pop 0.7s cubic-bezier(0.23,1,0.32,1) backwards; }
        .h-slide[data-active="true"] .h-trend { animation: h-draw 1.2s ease 0.4s backwards; }

        @keyframes h-caret { 50% { opacity: 0; } }
        @keyframes h-grow-x { from { transform: scaleX(0); } }
        @keyframes h-grow-y { from { transform: scaleY(0); } }
        @keyframes h-pop { from { opacity: 0; transform: scale(0.85); } }
        @keyframes h-draw { from { stroke-dashoffset: 260; } to { stroke-dashoffset: 0; } }

        /* ══════════════════════════════
           TABLET — text above, panels below
        ══════════════════════════════ */
        @media (max-width: 1023px) {
          .h-inner {
            grid-template-columns: 1fr;
            justify-content: stretch;
            align-items: start;
            padding: 116px 28px 64px;
            gap: 40px;
          }
          .h-left { max-width: 520px; }
          .h-body { max-width: 440px; }
          .h-panels { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .h-panel { height: clamp(340px, 46svh, 440px); }
        }

        /* ══════════════════════════════
           MOBILE
        ══════════════════════════════ */
        @media (max-width: 767px) {
          .h-star { display: none; }
          .h-inner { padding: 104px 20px 56px; gap: 32px; }
          .h-headline { font-size: clamp(34px, 10vw, 46px); }
          .h-body { margin-bottom: 26px; }
          .h-cta { padding: 16px 24px; }
          .h-panel { height: 340px; padding: 18px 18px 22px; }
          .h-panel-title { font-size: 22px; }
        }

        @media (max-width: 519px) {
          .h-panels { grid-template-columns: 1fr; gap: 12px; }
          .h-panel { height: auto; min-height: 0; }
          .h-panel-top { margin-bottom: 18px; }
          .h-slide {
            display: grid;
            grid-template-columns: 1fr 96px;
            grid-template-areas: "copy art";
            column-gap: 16px;
            align-items: end;
          }
          .h-panel-art  { grid-area: art; padding: 0; align-self: center; }
          .h-panel-copy { grid-area: copy; }
        }

        @media (prefers-reduced-motion: reduce) {
          .h-star, .h-left, .h-panel, .h-fade,
          .h-slide[data-active="true"] :is(.h-caret, .h-code-line, .h-bar, .h-pop, .h-trend) { animation: none; }
          .h-slide, .h-slide[data-active="true"] { transition: none; }
          a.h-panel:hover { transform: none; }
        }
      `}</style>

      <section className="h-section" ref={heroRef} aria-label="Hero">
        <div className="h-bg" aria-hidden="true" />
        <div className="h-grain" aria-hidden="true" />

        {/* STARS */}
        <svg className="h-star" style={{ top: "20%", left: "7%", width: 18, height: 18 }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z" />
        </svg>
        <svg className="h-star" style={{ top: "16%", right: "10%", width: 12, height: 12, animationDelay: "1.1s" }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z" />
        </svg>
        <svg className="h-star" style={{ top: "44%", left: "46%", width: 9, height: 9, animationDelay: "0.5s" }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z" />
        </svg>

        <div className="h-inner">
          {/* TEXT */}
          <div className="h-left">
            <h1 className="h-headline">
              <RichText doc={content.heading} />
            </h1>
            <p className="h-body">
              <RichText doc={content.description} />
            </p>
            <SmartLink
              href={content.ctaLink}
              className="h-cta"
              style={{
                ...(content.ctaSize ? { fontSize: `${content.ctaSize}px` } : {}),
                ...(content.ctaWeight ? { fontWeight: content.ctaWeight } : {}),
                ...(content.ctaColor ? { color: content.ctaColor } : {}),
              }}
            >
              {content.ctaText}
              <span className="h-cta-icon" aria-hidden="true">↗</span>
            </SmartLink>
          </div>

          {/* SERVICE PANELS */}
          <div className="h-panels">
            {panels.map((panel) => (
              <ServicePanel
                key={panel.key}
                tone={panel.tone}
                label={panel.label}
                fallbackDescription={panel.description}
                fallbackLink={panel.link}
                fallbackArt={panel.fallbackArt}
                services={panel.services}
                offset={panel.offset}
                rotate={heroVisible && !reducedMotion}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM STRIPE LINES */}
        <div className="h-lines" aria-hidden="true">
          <div className="h-line" style={{ opacity: 0.9 }} />
          <div className="h-line" style={{ opacity: 0.55 }} />
          <div className="h-line" style={{ opacity: 0.28 }} />
        </div>
      </section>
    </>
  );
}

// ─── Service card ────────────────────────────────────────────────────────────

/**
 * One hero card. It steps through its services on its own timer while the hero
 * is visible, holds still under the mouse or keyboard focus (so a visitor
 * never clicks a service that changed under them), and stops for good once
 * clicked. Every service is rendered in the same grid cell and cross-faded, so
 * the card never changes size between services.
 */
function ServicePanel({
  tone,
  label,
  fallbackDescription,
  fallbackLink,
  fallbackArt,
  services,
  offset,
  rotate,
}: {
  tone: "dark" | "light";
  label: string;
  fallbackDescription: string;
  fallbackLink: string;
  fallbackArt: HeroService["illustration"];
  services: readonly HeroService[];
  offset: number;
  rotate: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);

  const count = services.length;
  const running = rotate && !held && !stopped && count > 1;

  // One timer per card, torn down whenever it should not be running.
  useEffect(() => {
    if (!running) return;
    let interval: number | undefined;
    const tick = () => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    };
    const start = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, ROTATE_MS);
    }, ROTATE_MS + offset);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [running, count, offset]);

  // With nothing managed in the dashboard, the card shows its own copy.
  const slides =
    count > 0
      ? services
      : [
          {
            id: "fallback",
            title: label,
            description: fallbackDescription,
            illustration: fallbackArt,
            image: undefined,
            link: fallbackLink,
          },
        ];
  const active = index % slides.length;
  const current = slides[active];
  const link = current.link || fallbackLink;

  const inner = (
    <>
      <div className="h-panel-top">
        <span className="h-panel-index">
          <span key={active} className="h-fade">
            {String(active + 1).padStart(2, "0")}
          </span>
          {slides.length > 1 ? (
            <span className="h-panel-total">
              / {String(slides.length).padStart(2, "0")}
            </span>
          ) : null}
        </span>
        {link ? (
          <span className="h-panel-arrow" aria-hidden="true">↗</span>
        ) : null}
      </div>

      <div className="h-slides">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="h-slide"
            data-active={i === active}
            aria-hidden={i !== active}
          >
            <div className="h-panel-art" aria-hidden="true">
              {slide.image ? (
                <span className="h-panel-art-img">
                  <Image src={slide.image} alt="" fill sizes="190px" />
                </span>
              ) : (
                <HeroArt name={slide.illustration} />
              )}
            </div>
            <div className="h-panel-copy">
              {count > 0 ? <p className="h-panel-kicker">{label}</p> : null}
              <h2 className="h-panel-title">{slide.title}</h2>
              {slide.description ? (
                <p className="h-panel-desc">{slide.description}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const className = `h-panel h-panel--${tone}`;
  const hold = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setHeld(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setHeld(false);
    },
    onFocus: () => setHeld(true),
    onBlur: () => setHeld(false),
  };

  if (!link) {
    return (
      <div className={className} {...hold}>
        {inner}
      </div>
    );
  }

  return (
    <SmartLink
      href={link}
      className={className}
      aria-label={count > 0 ? `${current.title} — ${label}` : label}
      onClick={() => setStopped(true)}
      {...hold}
    >
      {inner}
    </SmartLink>
  );
}
