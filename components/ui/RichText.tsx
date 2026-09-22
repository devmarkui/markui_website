import type { CSSProperties } from "react";

import {
  responsiveSize,
  type RichBlock,
  type RichDoc,
  type RichMarks,
} from "@/lib/rich-text";

/**
 * Renders a sanitised `RichDoc` as React elements. Text is escaped by React and
 * every style goes through a style object built from validated values, so no
 * markup from the database ever reaches the page.
 *
 * Lines are `<span style="display:block">` so the output is valid inside a
 * heading or paragraph. Unstyled text inherits from the surrounding element.
 */

export function marksStyle(
  marks: RichMarks | undefined,
  { responsive = true }: { responsive?: boolean } = {},
): CSSProperties | undefined {
  if (!marks) return undefined;
  const style: CSSProperties = {};
  if (marks.size) style.fontSize = responsive ? responsiveSize(marks.size) : `${marks.size}px`;
  if (marks.weight) style.fontWeight = marks.weight;
  if (marks.italic) style.fontStyle = "italic";
  if (marks.underline) {
    style.textDecorationLine = "underline";
    style.textDecorationThickness = "0.06em";
    style.textUnderlineOffset = "0.12em";
  }
  if (marks.color) style.color = marks.color;
  if (marks.letterSpacing !== undefined) style.letterSpacing = `${marks.letterSpacing}em`;
  return style;
}

export function blockStyle(block: RichBlock): CSSProperties {
  const style: CSSProperties = { display: "block" };
  if (block.align) style.textAlign = block.align;
  if (block.lineHeight) style.lineHeight = block.lineHeight;
  return style;
}

export default function RichText({
  doc,
  responsive = true,
}: {
  doc: RichDoc;
  /** Off for previews that should show the exact desktop sizes. */
  responsive?: boolean;
}) {
  return (
    <>
      {doc.blocks.map((block, i) => (
        <span key={i} className="rt-line" style={blockStyle(block)}>
          {block.runs.length
            ? block.runs.map((run, j) => (
                <span key={j} style={marksStyle(run.marks, { responsive })}>
                  {run.text}
                </span>
              ))
            : " "}
        </span>
      ))}
    </>
  );
}
