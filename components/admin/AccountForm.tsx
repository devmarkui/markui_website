"use client";

import { useActionState } from "react";

import { saveAccount, type FormState } from "@/app/admin/actions";

const INITIAL: FormState = {};

export default function AccountForm({
  username,
  passwordMinLength,
}: {
  username: string;
  passwordMinLength: number;
}) {
  const [state, action, pending] = useActionState(saveAccount, INITIAL);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Account</h1>
          <p className="ad-subtitle">
            Change the username and password used to sign in to this admin
            panel. Saving signs out every other browser that is signed in.
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

      <div className="ad-panel ad-settings-form">
        {/* Keyed on the username so a successful change resets the fields. */}
        <form action={action} key={username}>
          <div className="ad-field">
            <label className="ad-label" htmlFor="ac-username">
              Username
            </label>
            <input
              id="ac-username"
              name="username"
              type="text"
              defaultValue={username}
              required
              minLength={3}
              maxLength={64}
              pattern="[A-Za-z0-9._@\-]{3,64}"
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="none"
            />
            <p className="ad-hint">
              3–64 characters: letters, numbers, and <code>. _ @ -</code>
            </p>
          </div>

          <div className="ad-field" style={{ marginTop: 20 }}>
            <label className="ad-label" htmlFor="ac-new">
              New password
            </label>
            <input
              id="ac-new"
              name="newPassword"
              type="password"
              minLength={passwordMinLength}
              autoComplete="new-password"
            />
            <p className="ad-hint">
              At least {passwordMinLength} characters. Leave blank to keep your
              current password.
            </p>
          </div>

          <div className="ad-field" style={{ marginTop: 20 }}>
            <label className="ad-label" htmlFor="ac-confirm">
              Confirm new password
            </label>
            <input
              id="ac-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="ad-field" style={{ marginTop: 28 }}>
            <label className="ad-label" htmlFor="ac-current">
              Current password
            </label>
            <input
              id="ac-current"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
            <p className="ad-hint">Required to confirm any change.</p>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="ad-btn ad-btn--primary"
              disabled={pending}
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
