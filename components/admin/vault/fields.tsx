"use client";

import { useId, type ReactNode } from "react";

/** Small controlled form pieces in the dashboard's style (styles/admin.css). */

export function Text({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  full,
  list,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "url" | "date";
  full?: boolean;
  list?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className={full ? "ad-field ad-field--full" : "ad-field"}>
      <label className="ad-label" htmlFor={id}>
        {label} {hint ? <span>({hint})</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        list={list}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Area({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
  full = true,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  full?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className={full ? "ad-field ad-field--full" : "ad-field"}>
      <label className="ad-label" htmlFor={id}>
        {label} {hint ? <span>({hint})</span> : null}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Choice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  full,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  full?: boolean;
}) {
  const id = useId();
  return (
    <div className={full ? "ad-field ad-field--full" : "ad-field"}>
      <label className="ad-label" htmlFor={id}>
        {label} {hint ? <span>({hint})</span> : null}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A row of buttons for picking one layout. */
export function Segments<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="ad-field ad-field--full">
      <span className="ad-label">{label}</span>
      <div className="vx-segments" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className="vx-segment"
            onClick={() => onChange(o.value)}
            title={o.hint}
          >
            <span className="vx-segment-icon" data-layout={o.value} aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="ad-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/**
 * An editable list: each item gets move up/down and remove controls, and an
 * "add" button sits underneath.
 */
export function Items<T extends { id: string }>({
  items,
  onChange,
  render,
  onAdd,
  addLabel,
  empty,
  max,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  empty?: string;
  max?: number;
}) {
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="vx-items">
      {items.length === 0 && empty ? <p className="ad-hint">{empty}</p> : null}
      {items.map((item, i) => (
        <div className="vx-item" key={item.id}>
          <div className="vx-item-body">
            {render(item, (patch) => onChange(items.map((it) => (it.id === item.id ? { ...it, ...patch } : it))), i)}
          </div>
          <div className="vx-item-tools">
            <span className="vx-item-num">{String(i + 1).padStart(2, "0")}</span>
            <button type="button" className="vx-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              ↑
            </button>
            <button
              type="button"
              className="vx-icon"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              className="vx-icon vx-icon--danger"
              onClick={() => onChange(items.filter((it) => it.id !== item.id))}
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {onAdd && (!max || items.length < max) ? (
        <button type="button" className="ad-btn ad-btn--sm vx-add" onClick={onAdd}>
          + {addLabel ?? "Add"}
        </button>
      ) : null}
    </div>
  );
}
