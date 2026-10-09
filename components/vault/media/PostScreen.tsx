"use client";

import { useState } from "react";

import LazyFrame from "./LazyFrame";

/**
 * A social post's frame. It starts at the platform's usual size (vault.css)
 * and, for posts that report their height, settles to exactly that.
 */
export default function PostScreen({ src, title, className = "vt-post-screen" }: { src: string; title: string; className?: string }) {
  const [height, setHeight] = useState<number | null>(null);
  return (
    <div className={className} style={height ? { height, aspectRatio: "auto" } : undefined} data-sized={height ? "" : undefined}>
      <LazyFrame src={src} title={title} onHeight={setHeight} />
    </div>
  );
}
