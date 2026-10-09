"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cx, useSeen } from "@/components/site/hooks";

/**
 * The site's print (base.css .print) for the Vault: a photo or a muted video
 * loop that develops out of the dark as it scrolls in. Plain <img> with a
 * srcset, as Vault media is already sized (lib/vault/media-urls.ts).
 */
export default function VPrint({
  src,
  srcSet,
  sizes,
  video,
  poster,
  alt = "",
  eager,
  develop = true,
  playOnHover,
  autoPlay,
  className,
  style,
  children,
}: {
  src?: string;
  srcSet?: string;
  sizes?: string;
  video?: string;
  poster?: string;
  alt?: string;
  eager?: boolean;
  develop?: boolean;
  /** Plays the video loop while the pointer is over the print's link. */
  playOnHover?: boolean;
  /** Plays the loop whenever it is on screen. */
  autoPlay?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    const node = ref.current;
    if (!el || !node) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return;

    const play = () => el.play().then(() => setPlaying(true), () => undefined);
    const pause = () => {
      el.pause();
      setPlaying(false);
    };

    if (autoPlay) {
      const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()), {
        threshold: 0.25,
      });
      observer.observe(node);
      return () => observer.disconnect();
    }
    if (playOnHover) {
      const host = node.closest("a, [data-hover-host]") ?? node;
      host.addEventListener("pointerenter", play);
      host.addEventListener("pointerleave", pause);
      return () => {
        host.removeEventListener("pointerenter", play);
        host.removeEventListener("pointerleave", pause);
      };
    }
  }, [autoPlay, playOnHover, ref]);

  const still = poster ?? src;

  return (
    <div
      ref={ref}
      className={cx("print", className, develop && seen && "is-in")}
      data-develop={develop ? "" : undefined}
      data-playing={playing ? "true" : undefined}
      style={style}
    >
      {video ? (
        <>
          <video
            ref={videoRef}
            src={still ? video : `${video}#t=0.1`}
            muted
            loop
            playsInline
            preload={autoPlay ? "auto" : "metadata"}
            aria-hidden="true"
            tabIndex={-1}
          />
          {still ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="print-poster" src={still} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />
          ) : null}
        </>
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
        />
      ) : null}
      {children}
    </div>
  );
}
