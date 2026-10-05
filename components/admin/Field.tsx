"use client";

import { useState, type ReactNode } from "react";

/**
 * One text field with its limit shown as it is typed: every piece of site
 * text has a length the layout was drawn for (lib/site-content.ts LIMITS),
 * so the count is the first thing an editor needs to see.
 *
 * Uncontrolled unless `value`/`onChange` are given (list rows are controlled
 * by their form, so they survive being reordered).
 */
export default function TextField({
  id,
  name,
  label,
  note,
  hint,
  max,
  rows,
  defaultValue,
  value,
  onChange,
  placeholder,
  required = true,
  full = false,
}: {
  id: string;
  name: string;
  label: string;
  /** Small text after the label: "(set light)". */
  note?: string;
  hint?: ReactNode;
  max: number;
  /** A textarea of this many rows; an input when left out. */
  rows?: number;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Span the whole row of the form grid. */
  full?: boolean;
}) {
  const [typed, setTyped] = useState(defaultValue ?? "");
  const text = value ?? typed;
  const change = (next: string) => {
    if (onChange) onChange(next);
    else setTyped(next);
  };
  const shared = {
    id,
    name,
    maxLength: max,
    placeholder,
    required,
    value: text,
    onChange: (e: { target: { value: string } }) => change(e.target.value),
  };
  const near = text.length > max * 0.9;

  return (
    <div className={full ? "ad-field ad-field--full" : "ad-field"}>
      <label className="ad-label" htmlFor={id}>
        {label}
        {note ? <span> {note}</span> : null}
      </label>
      {rows ? <textarea rows={rows} {...shared} /> : <input type="text" {...shared} />}
      <p className="ad-hint">
        <span style={near ? { color: "#ff9a4d" } : undefined}>
          {text.length} / {max}
        </span>
        {hint ? <> · {hint}</> : null}
      </p>
    </div>
  );
}
