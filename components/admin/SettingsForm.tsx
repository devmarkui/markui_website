"use client";

import { useActionState, useState } from "react";

import { saveSettings, type FormState } from "@/app/admin/actions";
import type { Settings } from "@/lib/types";

const INITIAL: FormState = {};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, INITIAL);
  const [url, setUrl] = useState(settings.portfolioUrl);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Portfolio Settings</h1>
          <p className="ad-subtitle">
            Your separate portfolio website. Every service page ends with a{" "}
            <strong>Check our portfolio</strong> button that opens this address
            in a new tab.
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

      {!url ? (
        <div className="ad-alert ad-alert--note">
          No portfolio address is set, so the button is hidden on every service
          page rather than linking nowhere. Add one below to switch it on.
        </div>
      ) : null}

      <div className="ad-panel ad-settings-form">
        <form action={action}>
          <div className="ad-field">
            <label className="ad-label" htmlFor="st-portfolio">
              Portfolio website address
            </label>
            <input
              id="st-portfolio"
              name="portfolioUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://portfolio.markui.lk"
              autoComplete="url"
              spellCheck={false}
            />
            <p className="ad-hint">
              Include the full address with <code>https://</code>. Clear the
              field and save to hide the button again.
            </p>
          </div>

          {url ? (
            <div className="ad-field" style={{ marginTop: 20 }}>
              <span className="ad-label">How the button will look</span>
              <span className="ad-settings-preview">
                Check our portfolio <span aria-hidden="true">↗</span>
              </span>
              <p className="ad-hint">
                Opens <strong>{url}</strong> in a new tab.
              </p>
            </div>
          ) : null}

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="ad-btn ad-btn--primary"
              disabled={pending}
            >
              {pending ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
