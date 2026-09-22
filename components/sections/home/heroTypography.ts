import type { CSSProperties } from "react";

/**
 * The hero's default type — what unstyled rich text looks like. Shared by the
 * public hero, the admin editor and its live preview so all three agree.
 * Sizes here are the desktop sizes; the hero scales them on smaller screens.
 */
export const HERO_HEADING_BASE: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "62px",
  fontWeight: 200,
  lineHeight: 0.93,
  letterSpacing: "-0.03em",
  color: "#ffffff",
};

export const HERO_BODY_BASE: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "13.5px",
  lineHeight: 1.75,
  color: "rgba(255,255,255,0.8)",
};

/** Button text defaults, used when the admin leaves a style unset. */
export const HERO_CTA_DEFAULTS = { size: 11, weight: 700, color: "#0a0a0a" } as const;

export const HEADING_SIZE_PRESETS = [24, 32, 40, 48, 56, 62, 72, 84, 96, 110];
export const BODY_SIZE_PRESETS = [12, 13, 14, 15, 16, 18, 20, 24];
