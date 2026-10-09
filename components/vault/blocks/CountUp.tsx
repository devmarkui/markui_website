"use client";

import { useEffect, useState } from "react";

import { useSeen } from "@/components/site/hooks";

/**
 * "2.4M", "+38%", "120K+": the number in it counts up from zero the first
 * time it is seen; the rest of the text stays as typed.
 */
export default function CountUp({ value }: { value: string }) {
  const [ref, seen] = useSeen<HTMLSpanElement>();
  const match = /^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!seen || !match) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, before, digits, after] = match;
    const target = Number(digits.replace(/,/g, ""));
    const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
    const commas = digits.includes(",");
    const started = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const n = target * eased;
      const text = commas
        ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : n.toFixed(decimals);
      setShown(`${before}${text}${after}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // The match is derived from `value`; re-running on it alone is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, value]);

  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
