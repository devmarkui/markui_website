"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hover-to-play for muted preview videos (Services Top Work, Product Preview).
 *
 * With a mouse, the video plays (muted, looping) while the pointer is over the
 * item and rewinds when it leaves; keyboard focus does the same. Touch screens
 * have no hover, so they get one of:
 *
 * - `"in-view"` — plays while mostly on screen. For items that are links, so a
 *   tap still follows the link.
 * - `"tap"` — the poster shows until a tap toggles playback. For items that
 *   are not links. Keyboard Enter/Space toggles the same way.
 * - `"tap-preview"` — for items that are links: the first tap plays the video
 *   instead of following the link, and a tap while it plays follows it.
 *
 * Reduced-motion users on touch devices never get autoplay.
 */
export function useHoverVideo(
  enabled: boolean,
  { touch }: { touch: "in-view" | "tap" | "tap-preview" },
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPointer = useRef<string>("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;

    const onPlaying = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);

    let observer: IntersectionObserver | undefined;
    const touchOnly = window.matchMedia("(hover: none)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (touch === "in-view" && touchOnly && !reduced) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0.6 },
      );
      observer.observe(video);
    }

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      observer?.disconnect();
    };
  }, [enabled, touch]);

  const start = () => {
    // play() rejects if a quick mouse-out pauses it first — that is fine.
    videoRef.current?.play().catch(() => {});
  };
  const stop = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };
  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) start();
    else video.pause();
  };

  return {
    videoRef,
    playing,
    /** Only a toggle helper for `"tap"` items; hover and focus are in `handlers`. */
    toggle,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        lastPointer.current = e.pointerType;
      },
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") start();
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") stop();
      },
      onFocus: start,
      onBlur: stop,
      // Mouse users already play on hover; clicks only toggle for touch/keys.
      onClick:
        touch === "tap"
          ? () => {
              if (lastPointer.current !== "mouse") toggle();
              lastPointer.current = "";
            }
          : touch === "tap-preview"
            ? (e: React.MouseEvent) => {
                const touched =
                  lastPointer.current === "touch" ||
                  lastPointer.current === "pen";
                lastPointer.current = "";
                if (touched && videoRef.current?.paused) {
                  e.preventDefault();
                  start();
                }
              }
            : undefined,
    },
  };
}
