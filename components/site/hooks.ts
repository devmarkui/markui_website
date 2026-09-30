"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True from the moment the element first enters the viewport — it never
 * turns false again. Drives the one-shot reveals and the prints developing.
 */
export function useSeen<T extends Element>(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setSeen(true);
        observer.disconnect();
      },
      { rootMargin, threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, rootMargin]);

  return [ref, seen] as const;
}

/**
 * True while the element holds the middle of the viewport. A section that is
 * "live" lights its channel LED and turns its content up, like the homepage.
 */
export function useLive<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, live] as const;
}

/** Joins class names, skipping the empty ones. */
export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(" ");
}
