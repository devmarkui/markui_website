"use client";

import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { cx, useLive, useSeen } from "./hooks";

type Tag = "div" | "section" | "article" | "header" | "li" | "figure" | "p" | "ul" | "ol" | "aside";

type Props = {
  as?: Tag;
  className?: string;
  /** Stagger step: each one waits another 80ms. */
  delay?: number;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

/** Rises into place the first time it scrolls into view (base.css [data-rv]). */
export function Reveal({ as = "div", className, delay, style, children, ...rest }: Props) {
  const [ref, seen] = useSeen<HTMLElement>();
  return createElement(
    as,
    {
      ...rest,
      ref,
      className: cx(className, seen && "is-in"),
      "data-rv": "",
      style: delay ? ({ ...style, "--d": delay } as CSSProperties) : style,
    },
    children,
  );
}

/**
 * A section whose channel LED lights while it holds the middle of the screen
 * (.is-live, base.css) — the homepage's "fed channels".
 */
export function LiveSection({
  as = "section",
  className,
  children,
  ...rest
}: {
  as?: Tag;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  const [ref, live] = useLive<HTMLElement>();
  return createElement(
    as,
    { ...rest, ref, className: cx(className, live && "is-live") },
    children,
  );
}
