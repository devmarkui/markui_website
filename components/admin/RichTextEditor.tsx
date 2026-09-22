"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { blockStyle, marksStyle } from "@/components/ui/RichText";
import {
  LINE_HEIGHT_RANGE,
  mergeRuns,
  richPlainText,
  sanitizeRichDoc,
  type RichAlign,
  type RichBlock,
  type RichDoc,
  type RichLimits,
  type RichMarks,
  type RichRun,
} from "@/lib/rich-text";

/**
 * A small WYSIWYG editor for the controlled `RichDoc` format.
 *
 * The editable area is a plain `contentEditable` surface. After every edit its
 * DOM is read back into a `RichDoc` (only the allow-listed styles are picked up
 * — pasted markup never survives), and formatting commands are applied to that
 * model, not to the DOM: the selection is marked, the model is updated and
 * sanitised, then the surface is redrawn with the selection put back. The
 * result is posted as JSON in a hidden input named `name`.
 */

type MarkPatch = { [K in keyof RichMarks]?: RichMarks[K] | null };
type BlockPatch = { align?: RichAlign | null; lineHeight?: number | null };

// Private-use characters dropped into the text to track the selection across a
// redraw. `sanitizeRichDoc` strips them, so they can never be saved.
const START = "\ue000";
const END = "\ue001";

const WEIGHTS = [
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra bold" },
];
const LINE_HEIGHTS = [0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2];
const LETTER_SPACINGS = [-0.04, -0.02, 0, 0.02, 0.05, 0.1, 0.2];
const SWATCHES = ["#ffffff", "#0a0a0a", "#ff6b00", "#ffd9bf", "#1a1a1a"];

/** The hero background the text sits on (and the editing surface's colour). */
const SURFACE = "#ff6b00";

/** WCAG contrast ratio between two `#rrggbb` colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ─── DOM ⇄ model ─────────────────────────────────────────────────────────────

function rgbToHex(value: string): string | undefined {
  if (value.startsWith("#")) return value.length === 7 ? value.toLowerCase() : undefined;
  const m = value.match(/\d+/g);
  if (!m || m.length < 3) return undefined;
  return (
    "#" + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("")
  );
}

/** Styles an element contributes — only the properties the format supports. */
function readMarks(el: HTMLElement, inherited: RichMarks): RichMarks {
  const m: RichMarks = { ...inherited };
  const tag = el.tagName;
  if (tag === "B" || tag === "STRONG") m.weight = 700;
  if (tag === "I" || tag === "EM") m.italic = true;
  if (tag === "U") m.underline = true;

  const st = el.style;
  if (st.fontSize.endsWith("px")) m.size = parseFloat(st.fontSize);
  if (st.fontWeight) {
    m.weight =
      st.fontWeight === "bold" ? 700 : st.fontWeight === "normal" ? 400 : Number(st.fontWeight);
  }
  if (st.fontStyle) m.italic = st.fontStyle === "italic" || undefined;
  const deco = st.textDecorationLine || st.textDecoration;
  if (deco) m.underline = deco.includes("underline") || undefined;
  if (st.color) m.color = rgbToHex(st.color);
  if (st.letterSpacing.endsWith("em")) m.letterSpacing = parseFloat(st.letterSpacing);
  return m;
}

function readBlockStyle(el: HTMLElement, inherited: Omit<RichBlock, "runs">) {
  const out = { ...inherited };
  const align = el.style.textAlign;
  if (align === "left" || align === "center" || align === "right") out.align = align;
  const lh = parseFloat(el.style.lineHeight);
  if (Number.isFinite(lh)) out.lineHeight = lh;
  return out;
}

/** Reads the editable surface back into a (not yet sanitised) document. */
function parseDom(root: HTMLElement): RichDoc {
  const blocks: RichBlock[] = [];
  let current: RichBlock | null = null;
  const start = (style: Omit<RichBlock, "runs">) => {
    current = { ...style, runs: [] };
    blocks.push(current);
    return current;
  };

  const walk = (node: Node, marks: RichMarks, style: Omit<RichBlock, "runs">) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).data;
      if (text) (current ?? start(style)).runs.push({ text, marks: { ...marks } });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName;
    if (tag === "BR") {
      if (!current) start(style);
      current = null; // whatever follows starts a new line
      return;
    }
    if (tag === "DIV" || tag === "P") {
      const bs = readBlockStyle(node, style);
      start(bs);
      node.childNodes.forEach((child) => walk(child, marks, bs));
      current = null;
      return;
    }
    const next = readMarks(node, marks);
    node.childNodes.forEach((child) => walk(child, next, style));
  };

  root.childNodes.forEach((child) => walk(child, {}, {}));
  return { blocks };
}

/** Draws a document into the editable surface at its true desktop size. */
function renderDom(root: HTMLElement, doc: RichDoc) {
  root.replaceChildren(
    ...doc.blocks.map((block) => {
      const div = document.createElement("div");
      const bs = blockStyle(block);
      if (bs.textAlign) div.style.textAlign = String(bs.textAlign);
      if (bs.lineHeight) div.style.lineHeight = String(bs.lineHeight);
      if (!block.runs.length) div.appendChild(document.createElement("br"));
      for (const run of block.runs) {
        const span = document.createElement("span");
        Object.assign(span.style, marksStyle(run.marks, { responsive: false }) ?? {});
        span.textContent = run.text;
        div.appendChild(span);
      }
      return div;
    }),
  );
}

// ─── Model operations ────────────────────────────────────────────────────────

interface Pos {
  block: number;
  char: number;
}

/** Finds and removes the selection markers, returning where they were. */
function takeMarkers(doc: RichDoc): { start: Pos; end: Pos } | null {
  let start: Pos | null = null;
  let end: Pos | null = null;
  doc.blocks.forEach((block, b) => {
    let offset = 0;
    for (const run of block.runs) {
      let text = "";
      for (const ch of run.text) {
        if (ch === START) start = { block: b, char: offset };
        else if (ch === END) end = { block: b, char: offset };
        else {
          text += ch;
          offset += 1;
        }
      }
      run.text = text;
    }
  });
  return start && end ? { start, end } : null;
}

function blockLength(block: RichBlock) {
  return block.runs.reduce((n, r) => n + r.text.length, 0);
}

function patchMarks(marks: RichMarks | undefined, patch: MarkPatch): RichMarks {
  const next: Record<string, unknown> = { ...(marks ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) delete next[key];
    else next[key] = value;
  }
  return next as RichMarks;
}

/** Applies `patch` to the characters between `from` and `to` of every line. */
function applyInline(doc: RichDoc, from: Pos, to: Pos, patch: MarkPatch) {
  for (let b = from.block; b <= to.block; b++) {
    const block = doc.blocks[b];
    if (!block) continue;
    const lo = b === from.block ? from.char : 0;
    const hi = b === to.block ? to.char : blockLength(block);
    if (lo >= hi) continue;

    const runs: RichRun[] = [];
    let pos = 0;
    for (const run of block.runs) {
      const rs = pos;
      const re = pos + run.text.length;
      pos = re;
      const a = Math.min(Math.max(lo, rs), re);
      const z = Math.min(Math.max(hi, rs), re);
      const push = (text: string, marks?: RichMarks) => {
        if (text) runs.push({ text, marks });
      };
      push(run.text.slice(0, a - rs), run.marks);
      push(run.text.slice(a - rs, z - rs), patchMarks(run.marks, patch));
      push(run.text.slice(z - rs), run.marks);
    }
    block.runs = mergeRuns(runs);
  }
}

function applyBlock(doc: RichDoc, from: Pos, to: Pos, patch: BlockPatch) {
  for (let b = from.block; b <= to.block; b++) {
    const block = doc.blocks[b];
    if (!block) continue;
    if (patch.align !== undefined) {
      if (patch.align === null) delete block.align;
      else block.align = patch.align;
    }
    if (patch.lineHeight !== undefined) {
      if (patch.lineHeight === null) delete block.lineHeight;
      else block.lineHeight = patch.lineHeight;
    }
  }
}

/** Puts a model position back into the redrawn surface. */
function domPoint(root: HTMLElement, pos: Pos): [Node, number] {
  const blocks = root.children;
  const div = blocks[Math.min(pos.block, blocks.length - 1)];
  if (!div) return [root, 0];
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
  let remaining = pos.char;
  let last: Text | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    if (remaining <= t.data.length) return [t, remaining];
    remaining -= t.data.length;
    last = t;
  }
  return last ? [last, last.data.length] : [div, 0];
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Active {
  size: number;
  weight: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  letterSpacing: number;
  align: RichAlign;
  lineHeight: number | null;
}

export default function RichTextEditor({
  id,
  name,
  label,
  value,
  limits,
  baseStyle,
  sizePresets,
  onChange,
}: {
  id: string;
  /** Hidden input name the JSON document is posted under. */
  name: string;
  label: string;
  value: RichDoc;
  limits: RichLimits;
  /** How unstyled text looks — should match the public default. */
  baseStyle: CSSProperties;
  sizePresets: number[];
  onChange?: (doc: RichDoc) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [doc, setDoc] = useState<RichDoc>(() => sanitizeRichDoc(value, limits) ?? value);
  const [active, setActive] = useState<Active | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState("");

  const commit = useCallback(
    (next: RichDoc) => {
      const clean = sanitizeRichDoc(next, limits) ?? { blocks: [{ runs: [] }] };
      setDoc(clean);
      onChange?.(clean);
      return clean;
    },
    [limits, onChange],
  );

  // Draw the initial content once; after that the surface is the source.
  useEffect(() => {
    if (rootRef.current) renderDom(rootRef.current, doc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the selection inside this editor so toolbar controls — which take
  // focus — can still act on it, and reflect its styling in the toolbar.
  useEffect(() => {
    const onSelection = () => {
      const root = rootRef.current;
      const sel = window.getSelection();
      if (!root || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!root.contains(range.startContainer)) return;
      savedRange.current = range.cloneRange();

      const node = range.startContainer;
      const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement | null;
      if (!el) return;
      const cs = window.getComputedStyle(el);
      let blockEl: HTMLElement | null = el;
      while (blockEl && blockEl.parentElement !== root) blockEl = blockEl.parentElement;
      const bcs = blockEl ? window.getComputedStyle(blockEl) : cs;
      const size = parseFloat(cs.fontSize);
      const weight = Number(cs.fontWeight) || 400;
      const lh = blockEl ? parseFloat(blockEl.style.lineHeight) : NaN;
      setActive({
        size: Math.round(size),
        weight,
        bold: weight >= 600,
        italic: cs.fontStyle === "italic",
        underline: cs.textDecorationLine.includes("underline"),
        color: rgbToHex(cs.color) ?? "#ffffff",
        letterSpacing: Math.round((parseFloat(cs.letterSpacing) / size || 0) * 100) / 100,
        align: (["left", "center", "right"].includes(bcs.textAlign)
          ? bcs.textAlign
          : "left") as RichAlign,
        lineHeight: Number.isFinite(lh) ? lh : null,
      });
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  const onInput = () => {
    if (rootRef.current) commit(parseDom(rootRef.current));
  };

  /**
   * The shared path for every formatting command: mark the selection, read the
   * surface, change the model, redraw, restore the selection.
   */
  const transform = (
    apply: (doc: RichDoc, from: Pos, to: Pos) => void,
    { needsSelection }: { needsSelection: boolean },
  ) => {
    const root = rootRef.current;
    const range = savedRange.current;
    if (!root || !range || !root.contains(range.startContainer)) {
      setHint("Click into the text first.");
      return;
    }
    if (needsSelection && range.collapsed) {
      setHint("Select the words you want to change first.");
      return;
    }
    setHint(null);

    const endMarker = document.createTextNode(END);
    const startMarker = document.createTextNode(START);
    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(endMarker);
    const startRange = range.cloneRange();
    startRange.collapse(true);
    startRange.insertNode(startMarker);

    const next = parseDom(root);
    const where = takeMarkers(next);
    if (!where) {
      // Should not happen; redraw what we had rather than leave markers.
      renderDom(root, doc);
      return;
    }
    apply(next, where.start, where.end);
    const clean = commit(next);
    renderDom(root, clean);

    root.focus();
    const sel = window.getSelection();
    if (sel) {
      const r = document.createRange();
      const [sn, so] = domPoint(root, where.start);
      const [en, eo] = domPoint(root, where.end);
      r.setStart(sn, so);
      r.setEnd(en, eo);
      sel.removeAllRanges();
      sel.addRange(r);
      savedRange.current = r.cloneRange();
    }
  };

  const inline = (patch: MarkPatch) =>
    transform((d, a, b) => applyInline(d, a, b, patch), { needsSelection: true });
  const block = (patch: BlockPatch) =>
    transform((d, a, b) => applyBlock(d, a, b, patch), { needsSelection: false });

  const toggle = (key: "bold" | "italic" | "underline") => {
    if (key === "bold") inline({ weight: active?.bold ? null : 800 });
    if (key === "italic") inline({ italic: active?.italic ? null : true });
    if (key === "underline") inline({ underline: active?.underline ? null : true });
  };

  const applySize = (raw: string) => {
    if (raw === "") return inline({ size: null });
    const px = Number(raw);
    if (!Number.isFinite(px)) return;
    const clamped = Math.min(limits.maxSize, Math.max(limits.minSize, px));
    inline({ size: clamped });
  };

  // Toolbar buttons must not take focus, or the selection would be lost.
  const keep = (e: React.MouseEvent) => e.preventDefault();
  const chars = richPlainText(doc).replace(/\n/g, "").length;
  // Text coloured close to the orange background would vanish on the site.
  const unreadable = doc.blocks.some((b) =>
    b.runs.some((r) => r.marks?.color && contrast(r.marks.color, SURFACE) < 1.6),
  );

  return (
    <div className="rte">
      <span className="ad-label" id={`${id}-label`}>
        {label}
      </span>

      <div className="rte-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        <div className="rte-group">
          <select
            aria-label="Font size"
            value={active && sizePresets.includes(active.size) ? String(active.size) : ""}
            onChange={(e) => applySize(e.target.value)}
          >
            <option value="">Size{active ? ` (${active.size})` : ""}</option>
            {sizePresets.map((px) => (
              <option key={px} value={px}>
                {px}px
              </option>
            ))}
          </select>
          <input
            className="rte-num"
            type="number"
            min={limits.minSize}
            max={limits.maxSize}
            placeholder="px"
            aria-label={`Custom font size (${limits.minSize}–${limits.maxSize}px)`}
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (customSize) applySize(customSize);
              }
            }}
          />
          <button
            type="button"
            className="rte-btn"
            onMouseDown={keep}
            onClick={() => customSize && applySize(customSize)}
            title="Apply custom size"
          >
            Set
          </button>
        </div>

        <div className="rte-group">
          <select
            aria-label="Font weight"
            value={active ? String(Math.round(active.weight / 100) * 100) : ""}
            onChange={(e) =>
              inline({ weight: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Weight</option>
            {WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rte-btn rte-b"
            aria-pressed={Boolean(active?.bold)}
            aria-label="Bold"
            onMouseDown={keep}
            onClick={() => toggle("bold")}
          >
            B
          </button>
          <button
            type="button"
            className="rte-btn rte-i"
            aria-pressed={Boolean(active?.italic)}
            aria-label="Italic"
            onMouseDown={keep}
            onClick={() => toggle("italic")}
          >
            I
          </button>
          <button
            type="button"
            className="rte-btn rte-u"
            aria-pressed={Boolean(active?.underline)}
            aria-label="Underline"
            onMouseDown={keep}
            onClick={() => toggle("underline")}
          >
            U
          </button>
        </div>

        <div className="rte-group">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              className="rte-swatch"
              style={{ background: c }}
              aria-label={`Text colour ${c}`}
              aria-pressed={active?.color === c}
              onMouseDown={keep}
              onClick={() => inline({ color: c })}
            />
          ))}
          <label className="rte-color" title="Custom colour">
            <input
              type="color"
              aria-label="Custom text colour"
              value={active?.color ?? "#ffffff"}
              onChange={(e) => inline({ color: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="rte-btn"
            onMouseDown={keep}
            onClick={() => inline({ color: null })}
            title="Back to the default colour"
          >
            Default
          </button>
        </div>

        <div className="rte-group">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className="rte-btn"
              aria-pressed={active?.align === a}
              aria-label={`Align ${a}`}
              onMouseDown={keep}
              onClick={() => block({ align: a === "left" ? null : a })}
            >
              <AlignIcon align={a} />
            </button>
          ))}
          <select
            aria-label="Line height"
            value={active?.lineHeight ? String(active.lineHeight) : ""}
            onChange={(e) =>
              block({ lineHeight: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Line height</option>
            {LINE_HEIGHTS.filter(
              (v) => v >= LINE_HEIGHT_RANGE.min && v <= LINE_HEIGHT_RANGE.max,
            ).map((v) => (
              <option key={v} value={v}>
                {v.toFixed(1)}
              </option>
            ))}
          </select>
          <select
            aria-label="Letter spacing"
            value=""
            onChange={(e) =>
              inline({
                letterSpacing: e.target.value === "reset" ? null : Number(e.target.value),
              })
            }
          >
            <option value="">
              Spacing{active ? ` (${active.letterSpacing}em)` : ""}
            </option>
            {LETTER_SPACINGS.map((v) => (
              <option key={v} value={v}>
                {v > 0 ? `+${v}` : v}em
              </option>
            ))}
            <option value="reset">Default</option>
          </select>
          <button
            type="button"
            className="rte-btn"
            onMouseDown={keep}
            onClick={() =>
              inline({
                size: null,
                weight: null,
                italic: null,
                underline: null,
                color: null,
                letterSpacing: null,
              })
            }
            title="Remove formatting from the selection"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={rootRef}
        id={id}
        className="rte-surface"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={`${id}-label`}
        spellCheck
        style={baseStyle}
        onFocus={() => document.execCommand("defaultParagraphSeparator", false, "div")}
        onInput={onInput}
        onKeyDown={(e) => {
          const mod = e.metaKey || e.ctrlKey;
          const key = e.key.toLowerCase();
          if (mod && (key === "b" || key === "i" || key === "u")) {
            e.preventDefault();
            toggle(key === "b" ? "bold" : key === "i" ? "italic" : "underline");
          }
        }}
        onPaste={(e) => {
          // Plain text only — formatting comes from the toolbar.
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
        onDrop={(e) => e.preventDefault()}
      />

      {unreadable ? (
        <p className="rte-warn" role="status">
          Some text is coloured too close to the orange hero background and
          will be hard to read. Pick white, black or a darker shade instead.
        </p>
      ) : null}

      <div className="rte-foot">
        <span>
          {hint ??
            "Press Enter for a new line. Select words, then use the toolbar to style them."}
        </span>
        <span>
          {chars} / {limits.maxChars}
        </span>
      </div>

      <input type="hidden" name={name} value={JSON.stringify(doc)} />

      <style>{EDITOR_CSS}</style>
    </div>
  );
}

function AlignIcon({ align }: { align: RichAlign }) {
  const x = (w: number) => (align === "left" ? 1 : align === "right" ? 15 - w : (16 - w) / 2);
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
      {[14, 9, 12, 7].map((w, i) => (
        <rect key={i} x={x(w)} y={i * 3} width={w} height="1.6" rx="0.8" fill="currentColor" />
      ))}
    </svg>
  );
}

const EDITOR_CSS = `
  .rte { display: flex; flex-direction: column; gap: 8px; }
  .rte-toolbar {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 8px;
    border: 1px solid var(--ad-border);
    border-radius: 10px;
    background: var(--ad-surface-2);
  }
  .rte-group {
    display: flex; align-items: center; gap: 4px;
    padding-right: 6px; margin-right: 2px;
    border-right: 1px solid var(--ad-border);
  }
  .rte-group:last-child { border-right: 0; }
  .rte-toolbar select, .rte-num {
    height: 30px; padding: 0 8px;
    border-radius: 6px;
    border: 1px solid var(--ad-border);
    background: var(--ad-surface);
    color: var(--ad-txt);
    font-size: 12px;
    width: auto;
  }
  .rte-num { width: 58px; }
  .rte-btn {
    min-width: 30px; height: 30px; padding: 0 8px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 6px;
    border: 1px solid var(--ad-border);
    background: transparent;
    color: var(--ad-txt-2);
    font-size: 12px;
    cursor: pointer;
  }
  .rte-btn:hover { color: var(--ad-txt); border-color: var(--ad-border-strong); }
  .rte-btn[aria-pressed="true"] { background: var(--ad-accent); border-color: var(--ad-accent); color: #fff; }
  .rte-b { font-weight: 800; }
  .rte-i { font-style: italic; font-family: Georgia, serif; }
  .rte-u { text-decoration: underline; }
  .rte-swatch {
    width: 22px; height: 22px; border-radius: 50%;
    border: 1px solid var(--ad-border-strong);
    cursor: pointer; padding: 0;
  }
  .rte-swatch[aria-pressed="true"] { outline: 2px solid var(--ad-accent); outline-offset: 2px; }
  .rte-color { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; overflow: hidden; border: 1px solid var(--ad-border-strong); cursor: pointer; }
  .rte-color input { width: 40px; height: 40px; margin: -7px; border: 0; padding: 0; cursor: pointer; background: none; }
  .rte-surface {
    min-height: 90px;
    padding: 22px 24px;
    border-radius: 10px;
    border: 1px solid var(--ad-border);
    background: ${SURFACE};
    outline: none;
    overflow-wrap: anywhere;
    cursor: text;
  }
  .rte-surface:focus { border-color: #fff; box-shadow: 0 0 0 3px rgba(255,107,0,0.35); }
  .rte-warn {
    margin: 0;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 170, 60, 0.4);
    background: rgba(255, 140, 0, 0.1);
    color: #ffb46b;
    font-size: 12px;
  }
  .rte-foot { display: flex; justify-content: space-between; gap: 12px; font-size: 11.5px; color: var(--ad-txt-3); }
`;
