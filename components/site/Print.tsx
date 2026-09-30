"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode, Ref } from "react";

import { cx, useSeen } from "./hooks";

/**
 * One image or video hung on a ground (base.css .print). A video shows its
 * poster until it plays; the caller owns playback (useHoverVideo) and hands
 * over the ref and the playing state. `develop` lets it come up out of the
 * dark the first time it scrolls in, like the homepage's gallery wall.
 */
export default function Print({
  image,
  video,
  alt = "",
  sizes,
  eager,
  videoRef,
  playing,
  develop,
  edge,
  className,
  style,
  children,
}: {
  image?: string;
  video?: string;
  alt?: string;
  sizes: string;
  /** Above the fold: load it straight away. */
  eager?: boolean;
  videoRef?: Ref<HTMLVideoElement>;
  playing?: boolean;
  develop?: boolean;
  /** A hairline edge, for light screenshots on a light ground. */
  edge?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const loading = eager ? "eager" : undefined;

  return (
    <div
      ref={ref}
      className={cx("print", className, develop && seen && "is-in")}
      data-develop={develop ? "" : undefined}
      data-edge={edge ? "" : undefined}
      data-playing={playing ? "true" : undefined}
      style={style}
    >
      {video ? (
        <>
          <video
            ref={videoRef}
            // Without a poster, nudge past 0s so Safari paints a first frame.
            src={image || video.includes("#") ? video : `${video}#t=0.1`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
          {image ? (
            <Image className="print-poster" src={image} alt="" fill sizes={sizes} loading={loading} />
          ) : null}
          <span className="print-kind">Video</span>
        </>
      ) : image ? (
        <Image src={image} alt={alt} fill sizes={sizes} loading={loading} />
      ) : null}
      {children}
    </div>
  );
}
