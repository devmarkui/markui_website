"use client";

import { useEffect, useRef } from "react";

// The homepage's input scope (public/landing/scripts/contact-scope.js): a
// full-width line above the form. At rest it is one flat hairline ("the
// line is open"). Every keystroke pushes energy into it and the line jumps,
// then settles back to flat. When the form is ready it turns orange; once
// sent it holds one clean sine: the signal, received. It animates only while
// there is energy to show, and never under reduced motion.

const STATES = {
  idle: "Line open. Type and we're listening.",
  live: "Receiving.",
  ready: "Signal ready. Send when you are.",
  sent: "Signal received.",
} as const;

type State = keyof typeof STATES;

interface Engine {
  kick: (amount: number) => void;
  set: (ready: boolean, sent: boolean) => void;
}

export default function Scope({ pulse, ready, sent }: { pulse: number; ready: boolean; sent: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const engine = useRef<Engine | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const label = labelRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !label || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let energy = 0;
    let phase = 0;
    let raf = 0;
    let isReady = false;
    let isSent = false;

    const setState = (key: State) => {
      root.dataset.state = key;
      if (label.textContent !== STATES[key]) label.textContent = STATES[key];
    };

    const paint = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const mid = Math.round(h / 2);
      const lit = isSent || isReady;
      ctx.lineWidth = lit ? 2 : 1;
      ctx.strokeStyle = lit ? "#ff6b00" : "rgba(216, 208, 200, 0.7)";
      ctx.beginPath();
      if (!isSent && energy <= 0.002) {
        // At rest: one straight, pixel-aligned line.
        const y = lit ? mid : mid + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        return;
      }
      for (let x = 0; x <= w; x += 3) {
        const u = x / w;
        const taper = Math.sin(Math.PI * u) ** 0.6;
        let y = 0;
        if (isSent) {
          y = Math.sin(u * Math.PI * 2 * Math.max(6, w / 150)) * h * 0.32 * taper;
        } else {
          const a = h * 0.44 * energy * taper;
          y = a * (0.55 * Math.sin(x * 0.021 + phase) + 0.3 * Math.sin(x * 0.067 - phase * 1.7) + 0.25 * (Math.random() * 2 - 1));
        }
        if (x === 0) ctx.moveTo(x, mid + y);
        else ctx.lineTo(x, mid + y);
      }
      ctx.stroke();
    };

    const loop = () => {
      energy *= 0.94;
      phase += 0.22;
      if (energy <= 0.002) {
        energy = 0;
        raf = 0;
        paint();
        if (!isSent) setState(isReady ? "ready" : "idle");
        return;
      }
      paint();
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      paint();
    };

    engine.current = {
      kick(amount) {
        if (isSent) return;
        setState(isReady ? "ready" : "live");
        if (reduce) {
          paint();
          return;
        }
        energy = Math.min(1, energy + amount);
        if (!raf) raf = requestAnimationFrame(loop);
      },
      set(nextReady, nextSent) {
        isReady = nextReady;
        if (nextSent !== isSent) {
          isSent = nextSent;
          energy = 0;
        }
        if (!raf || isSent) {
          cancelAnimationFrame(raf);
          raf = 0;
          paint();
          setState(isSent ? "sent" : isReady ? "ready" : "idle");
        }
      },
    };

    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);
    resize();
    setState("idle");

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (pulse) engine.current?.kick(0.3);
  }, [pulse]);

  useEffect(() => {
    engine.current?.set(ready, sent);
  }, [ready, sent]);

  return (
    <div className="ct-scope" ref={rootRef} aria-hidden="true">
      <canvas ref={canvasRef} />
      <p className="ct-scope-meta">
        <span className="ct-scope-led" />
        <span>Input</span>
        <span className="ct-scope-state" ref={labelRef} />
      </p>
    </div>
  );
}
