"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useCallback } from "react";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const bgTextRef = useRef<HTMLDivElement>(null);

  const posRef = useRef({ x: 0.5, y: 0.5 });
  const currentPos = useRef({ x: 0.5, y: 0.5 });
  const opacityRef = useRef(0);
  const targetOpacity = useRef(0);
  const rafRef = useRef<number>(0);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    const reveal = revealRef.current;
    if (!reveal) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    currentPos.current.x = lerp(currentPos.current.x, posRef.current.x, 0.09);
    currentPos.current.y = lerp(currentPos.current.y, posRef.current.y, 0.09);
    opacityRef.current   = lerp(opacityRef.current, targetOpacity.current, 0.06);

    const { x, y } = currentPos.current;
    const op = opacityRef.current;

    const rx = x * 100;
    const ry = y * 100;

    // Soft feathered radial mask — only the area under cursor reveals mech
    reveal.style.maskImage = `radial-gradient(
      circle at ${rx}% ${ry}%,
      black            0%,
      black            14%,
      rgba(0,0,0,0.85) 18%,
      rgba(0,0,0,0.5)  22%,
      rgba(0,0,0,0.15) 27%,
      transparent      32%
    )`;
    reveal.style.webkitMaskImage = reveal.style.maskImage;
    reveal.style.opacity = String(op);

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      posRef.current = {
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height)),
      };
      // subtle parallax on watermark
      const bg = bgTextRef.current;
      if (bg) {
        const dx = (posRef.current.x - 0.5) * 22;
        const dy = (posRef.current.y - 0.5) * 11;
        bg.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    const handleMouseEnter = () => { targetOpacity.current = 1; };
    const handleMouseLeave = () => { targetOpacity.current = 0; };

    hero.addEventListener("mousemove",  handleMouseMove);
    hero.addEventListener("mouseenter", handleMouseEnter);
    hero.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      hero.removeEventListener("mousemove",  handleMouseMove);
      hero.removeEventListener("mouseenter", handleMouseEnter);
      hero.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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

        /* ── WATERMARK ── */
        .h-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          will-change: transform;
          transition: transform 0.9s cubic-bezier(0.23,1,0.32,1);
          z-index: 2;
        }
        .h-watermark span {
          font-size: clamp(80px,18vw,290px);
          font-weight: 900;
          letter-spacing: -0.04em;
          color: rgba(255,255,255,0.10);
          white-space: nowrap;
          text-transform: uppercase;
          font-family: var(--font-display);
        }

        /* ── STARS ── */
        .h-star {
          position: absolute;
          pointer-events: none;
          z-index: 15;
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

        /* ═══════════════════════════════════════════════
           IMAGE STACK
           Both images are 1639 × 960 px — rendered
           identically so they sit pixel-for-pixel on top
           of each other. We use a fixed aspect-ratio
           wrapper + absolute-fill slots to guarantee
           zero drift between layers.
        ═══════════════════════════════════════════════ */

        /* outer positioner */
        .h-img-positioner {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: clamp(620px, 74vw, 1300px);
          aspect-ratio: 1639 / 960;
        }

        /* both image slots fill the positioner 100% */
        .h-img-slot {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        /* Next/Image fill container */
        .h-img-slot > span,
        .h-img-slot img {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          object-position: bottom center !important;
        }

        /* layer order */
        .h-img-base   { z-index: 1; }
        .h-img-reveal {
          z-index: 2;
          /* mask starts fully transparent — JS drives it */
          mask-image: radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%);
          will-change: mask-image, -webkit-mask-image, opacity;
          opacity: 0;
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
           DESKTOP CONTENT
        ══════════════════════════════ */
        @media (min-width: 768px) {
          .h-section { height: 100svh; min-height: 620px; }

          .h-bottom {
            position: absolute;
            bottom: 60px; left: 0; right: 0;
            max-width: 1440px;
            margin: 0 auto;
            z-index: 20;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding: 0 48px;
            pointer-events: none;
          }
          .h-bottom > * { pointer-events: auto; }

          /* LEFT */
        .h-left {
          max-width: 380px;
          animation: h-fade-up 0.8s ease backwards;
          animation-delay: 0.1s;
        }

          .h-eyebrow {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.30em;
            text-transform: uppercase;
            color: var(--white-80);
            margin-bottom: 18px;
          font-family: var(--font-mono);
          }
          .h-eyebrow-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: var(--white);
            flex-shrink: 0;
            animation: dotBlink 2.2s ease-in-out infinite;
          }
          @keyframes dotBlink {
            0%,100% { opacity:1;   }
            50%      { opacity:0.2; }
          }

          .h-headline {
            font-size: clamp(34px,4.2vw,62px);
            font-weight: 200;
            line-height: 0.93;
            letter-spacing: -0.03em;
            color: var(--white);
            margin-bottom: 20px;
          font-family: var(--font-display);
          }
          .h-headline strong { 
            font-weight: 800; 
            display: block; 
            color: var(--background); 
          }

          .h-body {
            font-size: 13px;
            line-height: 1.75;
            color: var(--white-80);
            margin-bottom: 34px;
            max-width: 290px;
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
          .h-cta-icon {
            width: 26px; height: 26px;
            background: var(--black); color: var(--white);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; flex-shrink: 0;
          }

          /* RIGHT */
        .h-right {
          text-align: right;
          animation: h-fade-up 0.8s ease backwards;
          animation-delay: 0.3s;
        }
          .h-right-link {
            display: inline-block;
            font-size: 20px;
            color: var(--white);
            margin-bottom: 10px;
            text-decoration: none;
            transition: transform 0.2s ease;
          }
          .h-right-link:hover { transform: translate(4px,-4px); }
          .h-count {
            font-size: 28px; font-weight: 800;
            color: var(--white); line-height: 1;
          }
          .h-count-label {
            margin-top: 5px;
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.26em; text-transform: uppercase;
            color: var(--white-80);
          }

          /* hide mobile els */
          .h-mob-text,.h-mob-cta,.h-mob-spacer { display:none; }
        }

        /* ══════════════════════════════
           MOBILE
        ══════════════════════════════ */
        @media (max-width: 960px) {
          .h-bottom {
            padding: 0 28px;
          }
        }

        @media (max-width: 767px) {
          .h-section {
            height: auto;
            min-height: 100svh;
            display: flex;
            flex-direction: column;
          }
          .h-watermark,.h-star,.h-bottom,.h-lines { display:none; }

          .h-img-positioner {
            position: relative;
            left: unset;
            transform: none;
            width: 100%;
              aspect-ratio: 1639 / 960;
            z-index: 5;
          }

          .h-mob-text {
            display: block;
            padding: 24px 28px 20px;
            position: relative; z-index: 10;
          animation: h-fade-up 0.8s ease backwards;
          animation-delay: 0.1s;
          }
          .h-mob-headline {
            font-size: 22px; font-weight: 200;
            letter-spacing: -0.02em;
            color: var(--white);
            margin-bottom: 12px; line-height: 1.05;
          font-family: var(--font-display);
          }
          .h-mob-headline strong { 
            font-weight: 800; 
            color: var(--background); 
          }
          .h-mob-body {
            font-size: 13.5px; line-height: 1.7;
            color: var(--white-80);
          }
          .h-mob-cta {
            display: flex; align-items: center;
            position: relative; z-index: 20;
            margin: 0 28px;
            background: var(--white); border-radius: 100px;
            padding: 20px 26px;
            justify-content: space-between;
            text-decoration: none;
          animation: h-fade-up 0.8s ease backwards;
          animation-delay: 0.2s;
          }
          .h-mob-cta span {
            font-size: 13px; font-weight: 800;
            letter-spacing: 0.15em; text-transform: uppercase;
            color: var(--black);
          }
          .h-mob-arrow {
            width: 42px; height: 42px;
            background: var(--black); color: var(--white);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
          }
          .h-mob-spacer { display:block; height:40px; background:var(--primary); }
        }

        @media (prefers-reduced-motion: reduce) {
          .h-star { animation: none; }
          .h-watermark { transition: none; }
          .h-img-reveal { will-change: auto; }
        }
      `}</style>

      <section className="h-section" ref={heroRef} aria-label="Hero">

        <div className="h-bg"    aria-hidden="true" />
        <div className="h-grain" aria-hidden="true" />

        {/* WATERMARK */}
        <div className="h-watermark" ref={bgTextRef} aria-hidden="true">
          <span>MARKUI</span>
        </div>

        {/* STARS */}
        <svg className="h-star" style={{ top:"20%", left:"7%", width:18, height:18 }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z"/>
        </svg>
        <svg className="h-star" style={{ top:"16%", right:"10%", width:12, height:12, animationDelay:"1.1s" }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z"/>
        </svg>
        <svg className="h-star" style={{ bottom:"38%", right:"7%", width:9, height:9, animationDelay:"0.5s" }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z"/>
        </svg>

        {/* ═══════════════════════════════════════════════
            IMAGE STACK
            Both images: 1639 × 960 px, identical crops.
            Wrapper uses exact 1639 / 960 aspect-ratio so
            both layers scale identically with object-fit cover.
        ═══════════════════════════════════════════════ */}
        <div
          className="h-img-positioner"
          aria-label="Interactive character — move cursor to reveal robotic details"
        >
          {/* LAYER 1 — silhouette, always visible */}
          <div className="h-img-slot h-img-base" aria-hidden="true">
            <Image
              src="/hero/markuihero_trans2.png"
              alt=""
              fill
              sizes="(max-width:767px) 100vw, 54vw"
              style={{ objectFit:"cover", objectPosition:"bottom center" }}
              priority
            />
          </div>

          {/* LAYER 2 — mech, revealed only under cursor */}
          <div
            className="h-img-slot h-img-reveal"
            ref={revealRef}
            aria-hidden="true"
          >
            <Image
              src="/hero/markuihero_trans1.png"
              alt="Mark UI robotic character"
              fill
              sizes="(max-width:767px) 100vw, 54vw"
              style={{ objectFit:"cover", objectPosition:"bottom center" }}
              priority
            />
          </div>
        </div>

        {/* DESKTOP CONTENT */}
        <div className="h-bottom">
          <div className="h-left">
            <h1 className="h-headline">
              Less Noise<br />
              <strong>More Impact</strong>
            </h1>
            <p className="h-body">
              We help ambitious companies launch memorable brands,
              build high-impact websites, and design digital products
              people love to use.
            </p>
            <Link href="/proposal" className="h-cta">
              Book a Call
              <span className="h-cta-icon" aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="h-right">
            <Link href="/work" className="h-right-link" aria-label="View all projects">↗</Link>
            <p className="h-count">
              12<sup style={{ fontSize:"0.5em", verticalAlign:"super" }}>★</sup>
            </p>
            <p className="h-count-label">All Projects</p>
          </div>
        </div>

        {/* BOTTOM STRIPE LINES */}
        <div className="h-lines" aria-hidden="true">
          <div className="h-line" style={{ opacity:0.9 }} />
          <div className="h-line" style={{ opacity:0.55 }} />
          <div className="h-line" style={{ opacity:0.28 }} />
        </div>

        {/* MOBILE */}
        <div className="h-mob-text">
          <p className="h-mob-headline">Less Noise<br /><strong>More Impact</strong></p>
          <p className="h-mob-body">
            We help ambitious companies launch memorable brands,
            build high-impact websites, and design digital products people love to use.
          </p>
        </div>
        <Link href="/proposal" className="h-mob-cta">
          <span>Book a Call</span>
          <span className="h-mob-arrow" aria-hidden="true">↗</span>
        </Link>
        <span className="h-mob-spacer" aria-hidden="true" />

      </section>
    </>
  );
}