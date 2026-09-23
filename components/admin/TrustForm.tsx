"use client";

import { useActionState, useRef, useState } from "react";

import { saveTrustSettings, type FormState } from "@/app/admin/actions";
import {
  MAX_TRUST_LOGOS,
  MAX_TRUST_STATS,
  type TrustContent,
  type TrustLogo,
  type TrustStat,
} from "@/lib/types";

const INITIAL: FormState = {};

/** Symbols the strip already uses, offered as suggestions. */
const ICON_SUGGESTIONS = ["◎", "●", "◭", "⬡", "◈", "⊠", "⊡", "◇", "▣", "✦", "▲", "◐"];

interface StatRow extends TrustStat {
  /** Stable React key; never sent to the server. */
  key: number;
}

interface LogoRow extends TrustLogo {
  key: number;
}

export default function TrustForm({ trust }: { trust: TrustContent }) {
  const [state, action, pending] = useActionState(saveTrustSettings, INITIAL);

  const nextStatKey = useRef(trust.stats.length);
  const [stats, setStats] = useState<StatRow[]>(() =>
    trust.stats.map((stat, key) => ({ ...stat, key })),
  );

  const nextLogoKey = useRef(trust.logos.length);
  const [logos, setLogos] = useState<LogoRow[]>(() =>
    trust.logos.map((logo, key) => ({ ...logo, key })),
  );

  const updateStat = (key: number, field: keyof TrustStat, value: string) =>
    setStats((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );

  const updateLogo = (key: number, field: keyof TrustLogo, value: string) =>
    setLogos((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );

  const moveStat = (index: number, by: -1 | 1) =>
    setStats((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  const moveLogo = (index: number, by: -1 | 1) =>
    setLogos((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Trust &amp; Stats</h1>
          <p className="ad-subtitle">
            The band under the Home page hero — the headline, the scrolling
            client names and the stat cards beside them.
          </p>
        </div>
      </div>

      {state.error ? (
        <div className="ad-alert ad-alert--error" role="alert">{state.error}</div>
      ) : null}
      {state.ok ? (
        <div className="ad-alert ad-alert--ok" role="status">{state.message}</div>
      ) : null}

      <form action={action}>
        {/* ── Headline ── */}
        <div className="ad-panel">
          <h2 className="ad-panel-title">Headline</h2>
          <div className="ad-grid">
            <div className="ad-field">
              <label className="ad-label" htmlFor="trust-heading-dark">
                Black lines
              </label>
              <textarea
                id="trust-heading-dark"
                name="trustHeadingDark"
                rows={2}
                defaultValue={trust.headingDark}
                placeholder={"DESIGN\nTHAT WORKS"}
                required
              />
              <p className="ad-hint">One line per line.</p>
            </div>
            <div className="ad-field">
              <label className="ad-label" htmlFor="trust-heading-muted">
                Grey lines <span>(shown underneath)</span>
              </label>
              <textarea
                id="trust-heading-muted"
                name="trustHeadingMuted"
                rows={2}
                defaultValue={trust.headingMuted}
                placeholder={"RESULTS\nTHAT LAST"}
              />
              <p className="ad-hint">Leave blank for a headline in black only.</p>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="ad-panel">
          <h2 className="ad-panel-title">Stat cards</h2>

          {stats.length === 0 ? (
            <p className="ad-hint" style={{ marginBottom: 16 }}>
              No stat cards yet. Add one below.
            </p>
          ) : null}

          <div className="ad-list">
            {stats.map((row, index) => (
              <div className="ad-item ad-item--plain" key={row.key}>
                <div className="ad-item-body">
                  <div className="ad-grid ad-grid--triple">
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`stat-label-${row.key}`}>
                        Label
                      </label>
                      <input
                        id={`stat-label-${row.key}`}
                        name="statLabel"
                        type="text"
                        value={row.label}
                        onChange={(e) => updateStat(row.key, "label", e.target.value)}
                        placeholder="Client Satisfaction"
                        required
                      />
                    </div>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`stat-value-${row.key}`}>
                        Figure
                      </label>
                      <input
                        id={`stat-value-${row.key}`}
                        name="statValue"
                        type="text"
                        value={row.value}
                        onChange={(e) => updateStat(row.key, "value", e.target.value)}
                        placeholder="100%"
                        required
                      />
                    </div>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`stat-suffix-${row.key}`}>
                        Under the figure <span>(optional)</span>
                      </label>
                      <input
                        id={`stat-suffix-${row.key}`}
                        name="statSuffix"
                        type="text"
                        value={row.suffix}
                        onChange={(e) => updateStat(row.key, "suffix", e.target.value)}
                        placeholder="Years"
                      />
                    </div>
                    <div className="ad-field ad-field--full">
                      <label
                        className="ad-label"
                        htmlFor={`stat-description-${row.key}`}
                      >
                        Description
                      </label>
                      <input
                        id={`stat-description-${row.key}`}
                        name="statDescription"
                        type="text"
                        value={row.description}
                        onChange={(e) =>
                          updateStat(row.key, "description", e.target.value)
                        }
                        placeholder="Trusted by growing digital teams"
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-item-actions">
                  <div className="ad-move">
                    <button
                      type="button"
                      aria-label={`Move ${row.label || "card"} up`}
                      disabled={index === 0}
                      onClick={() => moveStat(index, -1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${row.label || "card"} down`}
                      disabled={index === stats.length - 1}
                      onClick={() => moveStat(index, 1)}
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ad-btn ad-btn--sm ad-btn--danger"
                    onClick={() =>
                      setStats((prev) => prev.filter((r) => r.key !== row.key))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="ad-btn"
              disabled={stats.length >= MAX_TRUST_STATS}
              onClick={() =>
                setStats((prev) => [
                  ...prev,
                  {
                    key: nextStatKey.current++,
                    label: "",
                    value: "",
                    suffix: "",
                    description: "",
                  },
                ])
              }
            >
              + Add stat card
            </button>
          </div>
          <p className="ad-hint" style={{ marginTop: 10 }}>
            They sit in a two-column grid, so an even number looks tidiest. Up to{" "}
            {MAX_TRUST_STATS}.
          </p>
        </div>

        {/* ── Client names ── */}
        <div className="ad-panel">
          <h2 className="ad-panel-title">Client names</h2>
          <p className="ad-hint" style={{ marginBottom: 16 }}>
            The symbol is one character shown before the name — pick one of the
            suggestions or paste any you like.
          </p>

          <datalist id="trust-icons">
            {ICON_SUGGESTIONS.map((icon) => (
              <option key={icon} value={icon} />
            ))}
          </datalist>

          {logos.length === 0 ? (
            <p className="ad-hint" style={{ marginBottom: 16 }}>
              No client names yet. Add one below.
            </p>
          ) : null}

          <div className="ad-list">
            {logos.map((row, index) => (
              <div className="ad-item ad-item--plain" key={row.key}>
                <div className="ad-item-body">
                  <div className="ad-grid ad-grid--icon">
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`logo-icon-${row.key}`}>
                        Symbol <span>(optional)</span>
                      </label>
                      <input
                        id={`logo-icon-${row.key}`}
                        name="logoIcon"
                        type="text"
                        list="trust-icons"
                        maxLength={4}
                        value={row.icon}
                        onChange={(e) => updateLogo(row.key, "icon", e.target.value)}
                        placeholder="◎"
                      />
                    </div>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`logo-name-${row.key}`}>
                        Name
                      </label>
                      <input
                        id={`logo-name-${row.key}`}
                        name="logoName"
                        type="text"
                        value={row.name}
                        onChange={(e) => updateLogo(row.key, "name", e.target.value)}
                        placeholder="Orbital"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="ad-item-actions">
                  <div className="ad-move">
                    <button
                      type="button"
                      aria-label={`Move ${row.name || "client"} up`}
                      disabled={index === 0}
                      onClick={() => moveLogo(index, -1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${row.name || "client"} down`}
                      disabled={index === logos.length - 1}
                      onClick={() => moveLogo(index, 1)}
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ad-btn ad-btn--sm ad-btn--danger"
                    onClick={() =>
                      setLogos((prev) => prev.filter((r) => r.key !== row.key))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="ad-btn"
              disabled={logos.length >= MAX_TRUST_LOGOS}
              onClick={() =>
                setLogos((prev) => [
                  ...prev,
                  { key: nextLogoKey.current++, name: "", icon: "" },
                ])
              }
            >
              + Add client
            </button>
          </div>
          <p className="ad-hint" style={{ marginTop: 10 }}>
            The strip scrolls on a loop, so the order is just where each name
            starts. Up to {MAX_TRUST_LOGOS}.
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save trust strip"}
          </button>
        </div>
      </form>
    </>
  );
}
