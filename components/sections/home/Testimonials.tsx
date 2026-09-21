"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";

/* ─── DATA ───────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    id: 1,
    name: "Arshaq Aroos",
    rating: 5,
    role: "Google Review",
    text: "Highly recommended for anyone looking to grow their business and build a strong brand presence. Keep up the great work! 👏🔥",
    initials: "AA",
    color: "#ff6b00",
    rotate: -3,
    left: "2%",
    top: 20,
  },
  {
    id: 2,
    name: "Timothy Nilesh",
    rating: 5,
    role: "Google Review",
    text: "Worst place to work as an intern. You won't feel to leave 🥺 Place and people which feels like home. Literally. They are the business partners who are super friendly but still, without lacking even a peck of professionalism 🤝",
    initials: "TN",
    color: "#111",
    rotate: 2,
    left: "26%",
    top: 40,
  },
  {
    id: 3,
    name: "Umar Sheriff Hassanali",
    rating: 5,
    role: "Google Review",
    text: "Highly recommend places for advertising and marketing your new start up and they are well known for their professionalism and quality of their work.",
    initials: "UH",
    color: "#1a1a2e",
    rotate: -2,
    left: "52%",
    top: 25,
  },
  {
    id: 4,
    name: "Husni Habeeb",
    rating: 5,
    role: "Google Review",
    text: "Satisfied with the work they do!",
    initials: "HH",
    color: "#0d3b2e",
    rotate: 3,
    left: "76%",
    top: 35,
  },
  {
    id: 5,
    name: "Nadira Shafeeq",
    rating: 5,
    role: "Google Review",
    text: "Very friendly superb 👌",
    initials: "NS",
    color: "#2d1b69",
    rotate: 4,
    left: "8%",
    top: 140,
  },
  {
    id: 6,
    name: "Mohamed Faveed",
    rating: 5,
    role: "Google Review",
    text: "Better than I expected.",
    initials: "MF",
    color: "#7c2d12",
    rotate: -3,
    left: "32%",
    top: 160,
  },
  {
    id: 7,
    name: "Asma Aniff",
    rating: 5,
    role: "Google Review",
    text: "I highly recommend.",
    initials: "AA",
    color: "#005b96",
    rotate: 2,
    left: "58%",
    top: 130,
  },
  {
    id: 8,
    name: "Hassan Jicker",
    rating: 5,
    role: "Google Review",
    text: "Highly recommend... Specially Umer... All the best...",
    initials: "HJ",
    color: "#c1502e",
    rotate: -1,
    left: "82%",
    top: 150,
  },
  {
    id: 9,
    name: "Muhammadh Ayoob",
    rating: 5,
    role: "Google Review",
    text: "Having worked with several marketing partners over the years but out of all I found Mark UI standing out for their data driven approach and commitment towards the task.",
    initials: "MA",
    color: "#ff6b00",
    rotate: -4,
    left: "12%",
    top: 260,
  },
  {
    id: 10,
    name: "Fathima Shazna Aslam",
    rating: 5,
    role: "Google Review",
    text: "★★★★★",
    initials: "FA",
    color: "#111",
    rotate: 2,
    left: "38%",
    top: 250,
  },
  {
    id: 11,
    name: "Ayush Ag",
    rating: 5,
    role: "Google Review",
    text: "★★★★★",
    initials: "AA",
    color: "#1a1a2e",
    rotate: -2,
    left: "62%",
    top: 230,
  },
  {
    id: 12,
    name: "Thilina Fernando",
    rating: 5,
    role: "Google Review",
    text: "★★★★★",
    initials: "TF",
    color: "#0d3b2e",
    rotate: 4,
    left: "85%",
    top: 240,
  },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="tst-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? "tst-star tst-star-on" : "tst-star"}>
          ★
        </span>
      ))}
    </div>
  );
}

function Avatar({ image, alt, initials }: { image?: string; alt: string; initials?: string }) {
  if (image) {
    return (
      <div className="tst-avatar">
        <Image src={image} alt={alt} fill style={{ objectFit: "cover" }} sizes="44px" />
      </div>
    );
  }
  
  return (
    <div className="tst-avatar">
      <div className="tst-avatar-initials">{initials}</div>
    </div>
  )
}

/* ─── DRAGGABLE CARD ─────────────────────────────────────────── */
function Card({
  t,
  zIndex,
  onDragStart,
}: {
  t: (typeof TESTIMONIALS)[0];
  zIndex: number;
  onDragStart: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; lastX: number; lastY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tiltTimeout = useRef<NodeJS.Timeout | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (tiltTimeout.current) clearTimeout(tiltTimeout.current);
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: posRef.current.x,
        originY: posRef.current.y,
        lastX: e.clientX,
        lastY: e.clientY,
      };
      setDragging(true);
      onDragStart();
    },
    [onDragStart]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { startX, startY, originX, originY, lastX, lastY } = dragRef.current;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    // Compute dynamic 3D tilt based on pointer speed
    const maxTilt = 35;
    const tiltX = Math.max(-maxTilt, Math.min(maxTilt, -deltaY * 2.5));
    const tiltY = Math.max(-maxTilt, Math.min(maxTilt, deltaX * 2.5));

    posRef.current = { x: originX + dx, y: originY + dy };
    setPos({ x: originX + dx, y: originY + dy });
    setTilt({ x: tiltX, y: tiltY });

    // Level out the card if the cursor stops moving
    if (tiltTimeout.current) clearTimeout(tiltTimeout.current);
    tiltTimeout.current = setTimeout(() => {
      setTilt({ x: 0, y: 0 });
    }, 150);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    
    if (tiltTimeout.current) clearTimeout(tiltTimeout.current);
    setTilt({ x: 0, y: 0 });

    // Smooth snap-back boundaries on drop
    const el = e.currentTarget as HTMLDivElement;
    const parent = el.parentElement;
    if (parent) {
      const minX = -el.offsetLeft;
      const maxX = Math.max(minX, parent.clientWidth - el.offsetWidth - el.offsetLeft);
      const minY = -el.offsetTop;
      const maxY = Math.max(minY, parent.clientHeight - el.offsetHeight - el.offsetTop);

      setPos((prev) => {
        const finalX = Math.max(minX, Math.min(maxX, prev.x));
        const finalY = Math.max(minY, Math.min(maxY, prev.y));
        posRef.current = { x: finalX, y: finalY };
        return { x: finalX, y: finalY };
      });
    }

    dragRef.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    return () => { if (tiltTimeout.current) clearTimeout(tiltTimeout.current); };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tst-card${dragging ? " tst-card-dragging" : ""}`}
      style={{
        left: t.left,
        top: `${t.top}px`,
        "--drag-x": `${pos.x}px`,
        "--drag-y": `${pos.y}px`,
        "--rot": `${t.rotate}deg`,
        "--tilt-x": `${tilt.x}deg`,
        "--tilt-y": `${tilt.y}deg`,
        "--scale": dragging ? 1.08 : 1,
        zIndex,
        "--card-accent": t.color,
      } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`Testimonial from ${t.name}`}
      role="article"
    >
      <div className="tst-card-accent-bar" />
      <Stars count={t.rating} />
      <blockquote className="tst-card-quote">"{t.text}"</blockquote>
      <div className="tst-card-footer">
        <Avatar image={(t as any).image} alt={t.name} initials={t.initials} />
        <div className="tst-card-meta">
          <p className="tst-card-name">{t.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <GoogleLogo />
            <p className="tst-card-role">{t.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function Testimonials() {
  const [zOrders, setZOrders] = useState<number[]>(TESTIMONIALS.map((_, i) => i + 1));
  const topZ = useRef(TESTIMONIALS.length);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const avatarsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const bringToFront = useCallback((idx: number) => {
    topZ.current += 1;
    setZOrders((prev) => {
      const next = [...prev];
      next[idx] = topZ.current;
      return next;
    });
  }, []);

  // Mobile: no drag — show card stack / scroll
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Center the active avatar in the scrollable row
  useEffect(() => {
    if (!isMobile || !avatarsRef.current) return;
    const container = avatarsRef.current;
    const activeBtn = container.querySelector('.tst-mobile-avatar-btn.active') as HTMLElement;
    if (activeBtn) {
      const scrollLeft = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeIndex, isMobile]);

  // Auto-cycle on mobile
  useEffect(() => {
    if (!isMobile || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isMobile, isPaused]);

  // Swipe handlers for mobile card
  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
      }
    }
    touchStartX.current = null;
  };

  return (
    <>
      <style>{`
        /* ════════════════════════════════════════════
           SECTION
        ════════════════════════════════════════════ */
        .tst-section {
          background: #0a0a0a;
          padding: 60px 0 80px;
          position: relative;
          overflow: hidden;
          font-family: var(--font-sans);
        }

        /* ── HEADER ────────────────────────────────── */
        .tst-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 48px;
          margin-bottom: 64px;
          gap: 32px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .tst-section[data-in="true"] .tst-header {
          opacity: 1;
          transform: translateY(0);
        }

        .tst-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
        }
        .tst-eyebrow-dot {
          width: 8px; height: 8px;
          background: var(--primary, #ff6b00);
          border-radius: 50%;
        }
        .tst-eyebrow-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .tst-heading {
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--white);
          margin: 0;
        }
        .tst-heading em {
          font-style: normal;
          color: var(--primary);
        }

        /* ── CANVAS HINT ───────────────────────────── */
        .tst-hint {
          max-width: 1440px;
          margin: 0 auto;
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
        }

        .tst-section[data-in="true"] .tst-hint {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── CANVAS — DESKTOP ──────────────────────── */
        .tst-canvas {
          position: relative;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          height: 450px;
          user-select: none;
          cursor: default;
        }

        /* subtle dot grid */
        .tst-canvas::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* ── CARD ──────────────────────────────────── */
        .tst-card {
          position: absolute;
          width: 300px;
          background: #171717;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          cursor: grab;
          will-change: transform, opacity;
          transition: box-shadow 0.25s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
          touch-action: none;
          overflow: hidden;
          transform: perspective(1000px) translate(var(--drag-x, 0px), var(--drag-y, 0px)) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) rotateZ(var(--rot, 0deg)) scale(var(--scale, 1)) translateY(var(--entrance-y, 24px));
          opacity: var(--entrance-opacity, 0);
        }
        .tst-card:hover {
          --scale: 1.02 !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,107,0,0.12);
        }
        .tst-card-dragging {
          --rot: 0deg !important;
          z-index: 999 !important;
          cursor: grabbing;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,0,0.3);
          transition: box-shadow 0.15s ease, transform 0.1s ease-out;
        }

        .tst-section[data-in="true"] .tst-card {
          --entrance-y: 0px;
          --entrance-opacity: 1;
        }

        /* ── BACKGROUND GLOW EFFECT ── */
        .tst-card::before,
        .tst-mobile-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, var(--card-accent, rgba(255,255,255,0.15)) 0%, transparent 65%);
          opacity: 0;
          transform: scale(0.8) translateY(-30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          pointer-events: none;
          z-index: 0;
        }

        .tst-card:hover::before,
        .tst-mobile-card:hover::before {
          opacity: 0.15;
          transform: scale(1) translateY(0);
        }

        /* colored top bar */
        .tst-card-accent-bar {
          width: 32px; height: 3px;
          background: var(--card-accent, #ff6b00);
          border-radius: 2px;
          margin-bottom: 16px;
        }

        /* Keep card content cleanly above the glow layer */
        .tst-card > *,
        .tst-mobile-card > * {
          position: relative;
          z-index: 1;
        }

        /* stars */
        .tst-stars { display: flex; gap: 2px; margin-bottom: 14px; }
        .tst-star {
          font-size: 13px;
          color: var(--border);
          line-height: 1;
        }
        .tst-star-on { color: #f59e0b; }

        /* quote */
        .tst-card-quote {
          font-size: 13px;
          line-height: 1.7;
          color: #a3a3a3;
          margin: 0 0 20px;
          font-style: normal;
        }

        /* footer */
        .tst-card-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .tst-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          background: #222;
        }

        .tst-avatar-initials {
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: var(--card-accent, #333);
          text-transform: uppercase;
        }

        .tst-card-footer .tst-avatar {
          width: 36px; height: 36px;
        }

        .tst-card-meta { flex: 1; min-width: 0; }
        .tst-card-name {
          font-size: 12px; font-weight: 700;
          color: var(--white);
          margin: 0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .tst-card-role {
          font-size: 10px;
          color: var(--text-muted);
          margin: 2px 0 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── MOBILE — single fade stack ──────────────────── */
        .tst-mobile-view {
          display: none;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 24px 28px 0;
          width: 100%;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
        }

        .tst-section[data-in="true"] .tst-mobile-view {
          opacity: 1;
          transform: translateY(0);
        }

        .tst-mobile-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 350px;
          background: radial-gradient(ellipse at bottom, rgba(255, 107, 0, 0.25) 0%, transparent 65%);
          filter: blur(30px);
          z-index: 0;
          pointer-events: none;
        }

        .tst-mobile-stack {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 380px;
          z-index: 1;
        }

        .tst-mobile-card {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(180deg, #1c1c1c 0%, #171717 100%);
          border-radius: 32px;
          padding: 40px 32px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          opacity: 0;
          transform: translateY(24px) scale(0.92);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s ease;
          pointer-events: none;
        }

        .tst-mobile-card.active {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          z-index: 2;
          box-shadow: 0 32px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03);
        }

        .tst-mobile-card::after {
          content: '"';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 180px;
          font-family: Georgia, serif;
          line-height: 1;
          color: rgba(255, 255, 255, 0.03);
          z-index: 0;
          pointer-events: none;
        }

        .tst-mobile-card-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .tst-mobile-card .tst-stars {
          margin-bottom: 24px;
          justify-content: center;
        }

        .tst-mobile-card .tst-star:not(.tst-star-on) {
          color: rgba(255,255,255,0.1);
        }

        .tst-mobile-quote {
          font-size: 16px;
          line-height: 1.6;
          color: var(--white);
          margin: 0 0 24px;
          font-weight: 500;
          font-style: italic;
        }

        .tst-mobile-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .tst-mobile-name {
          font-size: 14px;
          font-weight: 800;
          color: var(--white);
          margin: 0;
        }

        .tst-mobile-role {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }

        .tst-mobile-avatars {
          display: flex;
          gap: 16px;
          width: 100%;
          max-width: 100vw;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 32px 0;
          scroll-behavior: smooth;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .tst-mobile-avatars::-webkit-scrollbar { display: none; }
        
        .tst-mobile-avatars::before,
        .tst-mobile-avatars::after {
          content: '';
          min-width: calc(50vw - 42px);
          display: block;
        }

        .tst-mobile-avatar-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          border-radius: 50%;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, box-shadow 0.4s ease;
          opacity: 0.4;
          transform: scale(0.85);
          flex-shrink: 0;
          position: relative;
        }

        .tst-mobile-avatar-btn.active {
          opacity: 1;
          transform: scale(1.15);
          box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 4px var(--primary);
        }

        .tst-mobile-avatar-btn .tst-avatar {
          width: 44px;
          height: 44px;
          font-size: 14px;
        }

        /* ── RESPONSIVE ────────────────────────────── */
        @media (max-width: 767px) {
          .tst-section { padding: 60px 0; }

          .tst-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 0 24px;
            margin-bottom: 40px;
            gap: 20px;
          }

          /* hide desktop canvas */
          .tst-canvas  { display: none; }
          .tst-hint    { display: none; }

          /* show mobile scroll */
          .tst-mobile-view { display: flex; }
        }

        @media (min-width: 768px) {
          .tst-mobile-view { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tst-header, .tst-hint, .tst-mobile-view {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .tst-card {
            transition: box-shadow 0.2s ease !important;
            opacity: 1 !important;
            transform: perspective(1000px) translate(var(--drag-x, 0px), var(--drag-y, 0px)) rotateX(0deg) rotateY(0deg) rotateZ(var(--rot, 0deg)) scale(var(--scale, 1)) translateY(0px) !important;
          }
          .tst-mobile-card, .tst-mobile-avatar-btn {
            transition: opacity 0.2s ease !important;
            transform: none !important;
          }
          .tst-mobile-card:not(.active) {
            opacity: 0 !important;
          }
        }
      `}</style>

      <section className="tst-section" aria-labelledby="tst-heading" ref={sectionRef} data-in={inView}>

        {/* ── Header ── */}
        <div className="tst-header">
          <div>
            <h2 className="tst-heading" id="tst-heading">
              Real Clients<br />
              <em>Real</em> Results
            </h2>
          </div>
        </div>

        {/* ── Desktop: drag hint ── */}
        <p className="tst-hint" aria-hidden="true">
          ↖ Drag any card around the canvas ↗
        </p>

        {/* ── Desktop: draggable canvas ── */}
        <div className="tst-canvas" aria-label="Draggable testimonial cards">
          {TESTIMONIALS.map((t, i) => (
            <Card
              key={t.id}
              t={t}
              zIndex={zOrders[i]}
              onDragStart={() => bringToFront(i)}
            />
          ))}
        </div>

        {/* ── Mobile: Fade Stack ── */}
        <div
          className="tst-mobile-view"
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="tst-mobile-glow" aria-hidden="true" />
          
          <div className="tst-mobile-stack">
            {TESTIMONIALS.map((t, i) => (
              <div 
                className={`tst-mobile-card${activeIndex === i ? " active" : ""}`}
                key={t.id} 
                role="article"
                aria-hidden={activeIndex !== i}
              >
                <div className="tst-mobile-card-inner">
                  <Stars count={t.rating} />
                  <blockquote className="tst-mobile-quote">"{t.text}"</blockquote>
                  <div className="tst-mobile-meta">
                    <p className="tst-mobile-name">{t.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <GoogleLogo />
                      <p className="tst-mobile-role">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="tst-mobile-avatars" ref={avatarsRef} role="tablist">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeIndex === i}
                className={`tst-mobile-avatar-btn${activeIndex === i ? " active" : ""}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`View testimonial from ${t.name}`}
              >
                <Avatar image={(t as any).image} alt={t.name} initials={t.initials} />
              </button>
            ))}
          </div>
        </div>

      </section>
    </>
  );
}