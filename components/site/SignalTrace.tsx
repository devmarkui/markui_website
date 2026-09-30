"use client";

import { useEffect, useRef } from "react";

/**
 * The homepage's signal, on every page: a dotted line down the page margin
 * from the masthead's LED to the footer, lit solid behind a dot that sits
 * a little past the middle of the screen as you read. On the orange ground
 * the lit line and the dot turn ink (base.css .trace).
 *
 * It measures the page once and on resize; scrolling only moves the dot.
 */
export default function SignalTrace() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trace = ref.current;
    const page = trace?.parentElement;
    if (!trace || !page) return;

    let raf = 0;
    let top = 0;
    let height = 0;
    let start = 0;
    let grounds: { top: number; bottom: number; kind: string }[] = [];

    const update = () => {
      raf = 0;
      const head = Math.min(height, Math.max(start, window.scrollY + window.innerHeight * 0.62 - top));
      trace.style.setProperty("--head", `${head.toFixed(1)}px`);
      const on = grounds.find((g) => head >= g.top && head < g.bottom)?.kind ?? "";
      if (trace.dataset.on !== on) trace.dataset.on = on;
    };

    const measure = () => {
      const scrollY = window.scrollY;
      top = page.getBoundingClientRect().top + scrollY;
      height = page.offsetHeight;
      const led = page.querySelector<HTMLElement>(".mast .chan-led");
      start = led ? led.getBoundingClientRect().top + scrollY - top + led.offsetHeight / 2 : 0;
      grounds = [...page.querySelectorAll<HTMLElement>("[data-ground]")].map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + scrollY - top, bottom: r.bottom + scrollY - top, kind: el.dataset.ground ?? "" };
      });

      // Signal orange everywhere, ink across the orange grounds.
      const stops: string[] = [];
      let at = 0;
      for (const g of grounds) {
        if (g.kind !== "signal") continue;
        const from = Math.max(0, g.top - start);
        const to = Math.max(0, g.bottom - start);
        stops.push(`#ff6b00 ${at}px ${from}px`, `#15110e ${from}px ${to}px`);
        at = to;
      }
      stops.push(`#ff6b00 ${at}px`);
      trace.style.setProperty("--start", `${start.toFixed(1)}px`);
      trace.style.setProperty("--trace-grad", `linear-gradient(to bottom, ${stops.join(", ")})`);
      update();
      trace.classList.add("is-ready");
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const resized = new ResizeObserver(measure);
    resized.observe(page);
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();

    return () => {
      resized.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="trace" ref={ref} aria-hidden="true">
      <span className="trace-ghost" />
      <span className="trace-lit" />
      <span className="trace-dot" />
    </div>
  );
}
