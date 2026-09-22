"use client";

import { useActionState, useRef, useState } from "react";

import { saveSocialLinks, type FormState } from "@/app/admin/actions";
import {
  MAX_SOCIAL_LINKS,
  SOCIAL_PLATFORMS,
  type SocialLink,
} from "@/lib/types";

const INITIAL: FormState = {};

interface Row extends SocialLink {
  /** Stable React key; never sent to the server. */
  key: number;
}

export default function SocialLinksForm({ links }: { links: SocialLink[] }) {
  const [state, action, pending] = useActionState(saveSocialLinks, INITIAL);
  const nextKey = useRef(links.length);
  const [rows, setRows] = useState<Row[]>(() =>
    links.map((link, key) => ({ ...link, key })),
  );

  const update = (key: number, field: keyof SocialLink, value: string) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );

  const move = (index: number, by: -1 | 1) =>
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  const add = () =>
    setRows((prev) => [...prev, { key: nextKey.current++, label: "", url: "" }]);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Footer &amp; Social</h1>
          <p className="ad-subtitle">
            The social profiles listed under Contact in the footer of every
            page. Each opens in a new tab. With none added, the footer simply
            leaves the social row out.
          </p>
        </div>
      </div>

      {state.error ? (
        <div className="ad-alert ad-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <div className="ad-alert ad-alert--ok" role="status">
          {state.message}
        </div>
      ) : null}

      <form action={action} className="ad-panel">
        <datalist id="social-platforms">
          {SOCIAL_PLATFORMS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        {rows.length === 0 ? (
          <p className="ad-hint" style={{ marginBottom: 16 }}>
            No social links yet. Add one below.
          </p>
        ) : null}

        <div className="ad-list">
          {rows.map((row, index) => (
            <div className="ad-item" key={row.key}>
              <div className="ad-item-body">
                <div className="ad-grid">
                  <div className="ad-field">
                    <label className="ad-label" htmlFor={`social-label-${row.key}`}>
                      Name
                    </label>
                    <input
                      id={`social-label-${row.key}`}
                      name="socialLabel"
                      type="text"
                      list="social-platforms"
                      value={row.label}
                      onChange={(e) => update(row.key, "label", e.target.value)}
                      placeholder="Instagram"
                      required
                    />
                  </div>
                  <div className="ad-field">
                    <label className="ad-label" htmlFor={`social-url-${row.key}`}>
                      Profile address
                    </label>
                    <input
                      id={`social-url-${row.key}`}
                      name="socialUrl"
                      type="url"
                      value={row.url}
                      onChange={(e) => update(row.key, "url", e.target.value)}
                      placeholder="https://instagram.com/your-page"
                      spellCheck={false}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="ad-item-actions">
                <div className="ad-move">
                  <button
                    type="button"
                    aria-label={`Move ${row.label || "link"} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${row.label || "link"} down`}
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm ad-btn--danger"
                  onClick={() =>
                    setRows((prev) => prev.filter((r) => r.key !== row.key))
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="ad-btn"
            onClick={add}
            disabled={rows.length >= MAX_SOCIAL_LINKS}
          >
            + Add social link
          </button>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save footer links"}
          </button>
        </div>
        <p className="ad-hint" style={{ marginTop: 10 }}>
          Removing or reordering takes effect when you save. Up to{" "}
          {MAX_SOCIAL_LINKS} links.
        </p>
      </form>
    </>
  );
}
