/**
 * A small, controlled rich-text format for admin-edited headings and copy.
 *
 * Content is stored as structured JSON — lines of text runs, each with an
 * allow-listed set of style properties — never as HTML. The public site turns
 * it into React elements (text is escaped, styles are set through the style
 * object), so there is no path for markup or script to reach the page.
 * `sanitizeRichDoc` is run on every save and every read.
 *
 * Deliberately free of Node and React imports: the admin editor, the server
 * actions and the public renderer all share it.
 */

export type RichAlign = "left" | "center" | "right";

/** Inline styling for one run of text. Missing means "use the base style". */
export interface RichMarks {
  /** Desktop font size in px; scaled down responsively on smaller screens. */
  size?: number;
  /** 100–900. */
  weight?: number;
  italic?: boolean;
  underline?: boolean;
  /** `#rrggbb`. */
  color?: string;
  /** In em. */
  letterSpacing?: number;
}

export interface RichRun {
  text: string;
  marks?: RichMarks;
}

/** One line of the text. */
export interface RichBlock {
  runs: RichRun[];
  align?: RichAlign;
  /** Unitless multiplier. */
  lineHeight?: number;
}

export interface RichDoc {
  blocks: RichBlock[];
}

/** Per-field safety limits. */
export interface RichLimits {
  minSize: number;
  maxSize: number;
  maxChars: number;
  maxBlocks: number;
}

export const HEADING_LIMITS: RichLimits = {
  minSize: 16,
  maxSize: 110,
  maxChars: 240,
  maxBlocks: 8,
};

export const BODY_LIMITS: RichLimits = {
  minSize: 11,
  maxSize: 28,
  maxChars: 600,
  maxBlocks: 8,
};

const HEX = /^#[0-9a-f]{6}$/i;
const ALIGNS: readonly RichAlign[] = ["left", "center", "right"];
// Control characters (including line breaks — lines are blocks) and the
// private-use characters the editor uses as selection markers.
const STRIP = /[\u0000-\u001f\u007f\ue000-\uf8ff]/g;

export const LETTER_SPACING_RANGE = { min: -0.1, max: 0.5 } as const;
export const LINE_HEIGHT_RANGE = { min: 0.8, max: 2.5 } as const;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const round = (n: number, places: number) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export function sanitizeColor(value: unknown): string | undefined {
  return typeof value === "string" && HEX.test(value)
    ? value.toLowerCase()
    : undefined;
}

export function sanitizeWeight(value: unknown): number | undefined {
  return isNum(value) ? clamp(Math.round(value / 100) * 100, 100, 900) : undefined;
}

function sanitizeMarks(input: unknown, limits: RichLimits): RichMarks | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as Record<string, unknown>;
  const marks: RichMarks = {};

  if (isNum(raw.size)) {
    marks.size = round(clamp(raw.size, limits.minSize, limits.maxSize), 1);
  }
  const weight = sanitizeWeight(raw.weight);
  if (weight) marks.weight = weight;
  if (raw.italic === true) marks.italic = true;
  if (raw.underline === true) marks.underline = true;
  const color = sanitizeColor(raw.color);
  if (color) marks.color = color;
  if (isNum(raw.letterSpacing)) {
    marks.letterSpacing = round(
      clamp(raw.letterSpacing, LETTER_SPACING_RANGE.min, LETTER_SPACING_RANGE.max),
      3,
    );
  }

  return Object.keys(marks).length ? marks : undefined;
}

export function sameMarks(a?: RichMarks, b?: RichMarks) {
  const x = a ?? {};
  const y = b ?? {};
  return (
    x.size === y.size &&
    x.weight === y.weight &&
    Boolean(x.italic) === Boolean(y.italic) &&
    Boolean(x.underline) === Boolean(y.underline) &&
    x.color === y.color &&
    x.letterSpacing === y.letterSpacing
  );
}

/** Joins neighbouring runs that look the same and drops empty ones. */
export function mergeRuns(runs: RichRun[]): RichRun[] {
  const out: RichRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const last = out[out.length - 1];
    if (last && sameMarks(last.marks, run.marks)) last.text += run.text;
    else out.push({ text: run.text, ...(run.marks ? { marks: { ...run.marks } } : {}) });
  }
  return out;
}

/**
 * Validates anything claiming to be a `RichDoc` against the allow-list and the
 * field's limits. Returns `null` when it is not a document at all.
 */
export function sanitizeRichDoc(input: unknown, limits: RichLimits): RichDoc | null {
  if (!input || typeof input !== "object") return null;
  const rawBlocks = (input as { blocks?: unknown }).blocks;
  if (!Array.isArray(rawBlocks)) return null;

  let budget = limits.maxChars;
  const blocks: RichBlock[] = [];

  for (const rawBlock of rawBlocks.slice(0, limits.maxBlocks)) {
    if (!rawBlock || typeof rawBlock !== "object") continue;
    const b = rawBlock as Record<string, unknown>;
    const runs: RichRun[] = [];

    if (Array.isArray(b.runs)) {
      for (const rawRun of b.runs.slice(0, 80)) {
        if (!rawRun || typeof rawRun !== "object") continue;
        const r = rawRun as Record<string, unknown>;
        if (typeof r.text !== "string") continue;
        const text = r.text.replace(STRIP, "").slice(0, Math.max(0, budget));
        if (!text) continue;
        budget -= text.length;
        const marks = sanitizeMarks(r.marks, limits);
        runs.push(marks ? { text, marks } : { text });
      }
    }

    const block: RichBlock = { runs: mergeRuns(runs) };
    if (typeof b.align === "string" && ALIGNS.includes(b.align as RichAlign)) {
      block.align = b.align as RichAlign;
    }
    if (isNum(b.lineHeight)) {
      block.lineHeight = round(
        clamp(b.lineHeight, LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max),
        2,
      );
    }
    blocks.push(block);
  }

  // Trailing empty lines add nothing but height.
  while (blocks.length > 1 && blocks[blocks.length - 1].runs.length === 0) {
    blocks.pop();
  }
  return { blocks: blocks.length ? blocks : [{ runs: [] }] };
}

/** The document as plain text, one line per block. */
export function richPlainText(doc: RichDoc): string {
  return doc.blocks.map((b) => b.runs.map((r) => r.text).join("")).join("\n");
}

export function isRichEmpty(doc: RichDoc): boolean {
  return richPlainText(doc).trim() === "";
}

/** Builds a document from plain lines, optionally styling each line. */
export function richFromLines(
  lines: { text: string; marks?: RichMarks }[],
): RichDoc {
  return {
    blocks: lines.map(({ text, marks }) => ({
      runs: text ? [marks ? { text, marks } : { text }] : [],
    })),
  };
}

/**
 * A desktop px size as a CSS length that shrinks with the viewport (designed
 * at 1440px wide) but never below a readable floor, and never above what the
 * admin chose.
 */
export function responsiveSize(px: number): string {
  const floor = px <= 24 ? px * 0.9 : Math.max(16, px * 0.55);
  return `clamp(${round(floor, 1)}px, ${round((px / 1440) * 100, 3)}vw, ${px}px)`;
}
