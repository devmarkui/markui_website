"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, type FormState } from "@/app/admin/actions";

const INITIAL: FormState = {};

export default function LoginForm({
  next,
  showDefaultHint,
}: {
  next: string;
  showDefaultHint: boolean;
}) {
  const [state, action, pending] = useActionState(login, INITIAL);

  return (
    <div className="ad-login">
      <div className="ad-login-card">
        <div className="ad-login-brand">
          Mark UI<sup>®</sup>
        </div>
        <p className="ad-login-eyebrow">Admin Login</p>

        {state.error ? (
          <div className="ad-alert ad-alert--error" role="alert">
            {state.error}
          </div>
        ) : null}

        {showDefaultHint ? (
          <div className="ad-alert ad-alert--note">
            No admin credentials are configured yet. Sign in with{" "}
            <strong>admin / admin</strong>, then run{" "}
            <strong>npm run admin:setup</strong> to set a real password.
          </div>
        ) : null}

        <form action={action}>
          <input type="hidden" name="next" value={next} />

          <div className="ad-login-fields">
            <div className="ad-field">
              <label className="ad-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div className="ad-field">
              <label className="ad-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="ad-btn ad-btn--primary"
              type="submit"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <Link href="/" className="ad-login-back">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
