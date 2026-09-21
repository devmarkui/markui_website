"use client";

import { useState, useEffect, useRef } from "react";

export default function Contact() {
  const [form, setForm]       = useState({ name: "", email: "", message: "" });
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]   = useState<{ name?: string; email?: string }>({});

  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const validate = () => {
    const e: { name?: string; email?: string } = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setForm({ name: "", email: "", message: "" });
    setErrors({});
  };

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════
           CONTACT
        ═══════════════════════════════════════════ */
        .c-section {
          background: #ff6b00;
          position: relative;
          overflow: hidden;
        }

        /* noise texture overlay */
        .c-section::before {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .c-wrap {
          position: relative; z-index: 1;
          max-width: 1440px; margin: 0 auto;
          padding: 60px 48px;
          display: flex; flex-direction: column;
        }

        .c-left, .c-right {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .c-section[data-in="true"] .c-left  { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
        .c-section[data-in="true"] .c-right { opacity: 1; transform: translateY(0); transition-delay: 0.2s; }

        /* ── Pill ─────────────────────────────────── */
        .c-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          padding: 5px 14px 5px 10px;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #fff; width: fit-content;
          margin-bottom: 40px;
        }
        .c-pill-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fff; flex-shrink: 0;
          animation: cBlink 2.2s ease-in-out infinite;
        }
        @keyframes cBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }

        /* ── Headline ─────────────────────────────── */
        .c-headline {
          font-family: var(--font-display);
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em; text-transform: uppercase;
          color: #fff; margin: 0 0 24px;
        }
        .c-headline-ghost { 
          display: block; 
          color: var(--background); 
          opacity: 0.85; 
        }

        .c-sub {
          font-size: clamp(14px, 3.5vw, 16px);
          line-height: 1.75; color: rgba(255,255,255,0.70);
          margin: 0; max-width: 480px;
        }

        /* ── Mobile divider ───────────────────────── */
        .c-divider {
          width: 100%; height: 1px;
          background: rgba(255,255,255,0.20);
          margin: 48px 0;
        }

        /* ── Form fields ──────────────────────────── */
        .c-form { display: flex; flex-direction: column; }

        .c-field {
          position: relative;
          padding: 18px 0 14px;
          border-bottom: 1px solid rgba(255,255,255,0.20);
          transition: border-color 0.2s ease;
        }
        .c-field:first-child { border-top: 1px solid rgba(255,255,255,0.20); }
        .c-field.is-focused { border-bottom-color: #fff; }

        /* animated underline */
        .c-field::after {
          content: ""; position: absolute;
          bottom: -1px; left: 0; height: 2px; width: 0;
          background: #fff;
          transition: width 0.3s ease;
        }
        .c-field.is-focused::after { width: 100%; }

        .c-label {
          display: block;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.40);
          margin-bottom: 6px;
          transition: color 0.2s ease;
        }
        .c-field.is-focused .c-label { color: rgba(255,255,255,0.75); }

        .c-input {
          width: 100%; background: transparent;
          border: none; outline: none;
          font-size: clamp(15px, 4vw, 17px);
          font-weight: 400; color: #fff;
          line-height: 1.4; caret-color: #fff;
          -webkit-appearance: none;
        }
        .c-input::placeholder { color: rgba(255,255,255,0.22); }

        .c-textarea {
          resize: none; min-height: 88px;
        }

        .c-error {
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.85);
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          padding: 3px 8px;
          margin-top: 6px; display: inline-block;
        }

        /* ── Submit button ────────────────────────── */
        .c-actions { margin-top: 40px; }

        .c-btn {
          display: inline-flex; align-items: center; gap: 14px;
          background: #fff; color: #ff6b00;
          border: none; border-radius: 999px;
          padding: 15px 28px;
          font-size: clamp(15px, 4vw, 18px);
          font-weight: 800;
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .c-btn:hover {
          background: rgba(255,255,255,0.88);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.18);
        }
        .c-btn:active { transform: translateY(0); box-shadow: none; }

        .c-btn-icon {
          width: 30px; height: 30px; border-radius: 50%;
          background: #ff6b00;
          display: grid; place-items: center;
          flex-shrink: 0;
        }

        /* ── Success state ────────────────────────── */
        .c-success {
          display: flex; flex-direction: column; gap: 20px; padding: 8px 0;
        }
        .c-success-check {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.22);
          display: grid; place-items: center;
        }
        .c-success-title {
          font-size: clamp(40px, 10vw, 64px);
          font-weight: 900; line-height: 0.92;
          text-transform: uppercase; color: #fff; margin: 0;
        }
        .c-success-body {
          font-size: 15px; line-height: 1.7;
          color: rgba(255,255,255,0.70);
          max-width: 380px; margin: 0;
        }
        .c-success-reset {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px; padding: 10px 20px;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: rgba(255,255,255,0.70); cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .c-success-reset:hover { border-color: rgba(255,255,255,0.45); color: #fff; }

        /* ── DESKTOP layout ───────────────────────── */
        @media (min-width: 900px) {
          .c-wrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto 1fr;
            column-gap: 80px;
            padding: 100px 48px;
          }
          /* pill spans full width */
          .c-pill { grid-column: 1 / -1; margin-bottom: 44px; }
          /* left col: headline + body */
          .c-left {
            grid-column: 1; grid-row: 2 / 4;
            display: flex; flex-direction: column;
            padding-right: 40px;
            border-right: 1px solid rgba(255,255,255,0.20);
          }
          /* right col: form */
          .c-right { grid-column: 2; grid-row: 2 / 4; }
          .c-divider { display: none; }
          .c-sub { flex: 1; margin-top: 24px; }
        }

        @media (max-width: 960px) {
          .c-wrap {
            padding: 80px 28px;
          }
        }

        @media (max-width: 899px) {
          /* unwrap left into flex flow */
          .c-left { display: contents; }
          .c-right { width: 100%; }
          .c-sub { margin-bottom: 0; }
        }

        @media (max-width: 640px) {
          .c-wrap {
            padding: 60px 28px;
          }
        }

        /* ── Focus visible ────────────────────────── */
        .c-btn:focus-visible,
        .c-success-reset:focus-visible {
          outline: 2px solid rgba(255,255,255,0.6);
          outline-offset: 3px;
        }

        /* ── Reduced motion ───────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .c-pill-dot { animation: none; }
          .c-btn, .c-left, .c-right { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <section className="c-section" aria-labelledby="c-heading" ref={sectionRef} data-in={inView}>
        <div className="c-wrap">

          {/* Left */}
          <div className="c-left">
            <h2 className="c-headline" id="c-heading">
              Ready to<br />
              Start Your<br />
              <span className="c-headline-ghost">Next</span>
              Project?
            </h2>
            <p className="c-sub">
              Let's build a brand, product, or digital experience that makes a
              lasting impact. Tell us what you need — we'll handle the rest.
            </p>
          </div>

          <div className="c-divider" aria-hidden="true" />

          {/* Right */}
          <div className="c-right">
            {submitted ? (
              <div className="c-success" role="alert">
                <div className="c-success-check" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M5 11.5L9.5 16L17 7" stroke="white" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="c-success-title">Message<br />Received.</h3>
                <p className="c-success-body">
                  We'll review your request and get back within 24 hours.
                  Expect a tailored response, not a template.
                </p>
                <button className="c-success-reset" onClick={reset}>
                  Send another message
                </button>
              </div>
            ) : (
              <div className="c-form">
                {/* Name */}
                <div className={`c-field${focused === "name" ? " is-focused" : ""}`}>
                  <label className="c-label" htmlFor="c-name">Name</label>
                  <input id="c-name" className="c-input" type="text"
                    placeholder="Jane Smith" autoComplete="name" value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
                  {errors.name && <span className="c-error" role="alert">{errors.name}</span>}
                </div>

                {/* Email */}
                <div className={`c-field${focused === "email" ? " is-focused" : ""}`}>
                  <label className="c-label" htmlFor="c-email">Email</label>
                  <input id="c-email" className="c-input" type="email"
                    placeholder="jane@company.com" autoComplete="email" inputMode="email" value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })); }}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
                  {errors.email && <span className="c-error" role="alert">{errors.email}</span>}
                </div>

                {/* Message */}
                <div className={`c-field${focused === "message" ? " is-focused" : ""}`}>
                  <label className="c-label" htmlFor="c-msg">Message</label>
                  <textarea id="c-msg" className="c-input c-textarea"
                    placeholder="Tell us about your project…" value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    onFocus={() => setFocused("message")} onBlur={() => setFocused(null)} />
                </div>

                <div className="c-actions">
                  <button className="c-btn" onClick={handleSubmit}>
                    Let's Talk
                    <span className="c-btn-icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7H11.5M8 3L12 7L8 11" stroke="white"
                          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>
    </>
  );
}