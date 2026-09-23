"use client";

import { useActionState } from "react";

import { removeEnquiry, type FormState } from "@/app/admin/actions";
import { ENQUIRY_SOURCE_LABELS, type Enquiry } from "@/lib/types";

const INITIAL: FormState = {};

export default function EnquiryList({
  enquiries,
  mailConfigured,
  recipient,
}: {
  enquiries: Enquiry[];
  /** False while SMTP_HOST / SMTP_USER are unset — nothing can be emailed yet. */
  mailConfigured: boolean;
  recipient: string;
}) {
  const [state, action, pending] = useActionState(removeEnquiry, INITIAL);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Form Submissions</h1>
          <p className="ad-subtitle">
            Everything sent through the Contact page form and the Home page
            form. Each one is saved here first and then emailed
            {recipient ? ` to ${recipient}` : ""}, so nothing is lost if the
            mail server is unreachable.
          </p>
        </div>
      </div>

      {!mailConfigured ? (
        <div className="ad-alert ad-alert--error" role="alert">
          Email is not set up yet, so submissions are only being saved here. Add
          SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to <code>.env.local</code>{" "}
          and restart the site to start receiving them by email.
        </div>
      ) : null}

      {state.error ? (
        <div className="ad-alert ad-alert--error" role="alert">{state.error}</div>
      ) : null}
      {state.ok ? (
        <div className="ad-alert ad-alert--ok" role="status">{state.message}</div>
      ) : null}

      <div className="ad-panel">
        <div className="ad-toolbar">
          <span className="ad-count">
            {enquiries.length} {enquiries.length === 1 ? "submission" : "submissions"}
          </span>
        </div>

        {enquiries.length === 0 ? (
          <p className="ad-empty">
            No submissions yet. They will appear here as soon as someone sends
            the form.
          </p>
        ) : (
          <div className="ad-list">
            {enquiries.map((enquiry) => (
              <article key={enquiry.id} className="ad-item ad-item--plain">
                <div className="ad-item-body">
                  <h2 className="ad-item-title">
                    {enquiry.name}
                    {enquiry.company ? ` · ${enquiry.company}` : ""}
                  </h2>

                  <p className="ad-item-meta">
                    <span className="ad-badge">
                      {ENQUIRY_SOURCE_LABELS[enquiry.source]}
                    </span>
                    {enquiry.service ? <span>{enquiry.service}</span> : null}
                    <span>{new Date(enquiry.createdAt).toLocaleString("en-GB")}</span>
                    {!enquiry.emailed ? (
                      <span title="Saved here, but the notification email did not send.">
                        not emailed
                      </span>
                    ) : null}
                  </p>

                  <p className="ad-item-meta">
                    {enquiry.email ? (
                      <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                    ) : null}
                    {enquiry.phone ? (
                      <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`}>
                        {enquiry.phone}
                      </a>
                    ) : null}
                  </p>

                  {enquiry.message ? (
                    <p className="ad-item-desc" style={{ whiteSpace: "pre-wrap" }}>
                      {enquiry.message}
                    </p>
                  ) : null}
                </div>

                <div className="ad-item-actions">
                  <form action={action}>
                    <input type="hidden" name="id" value={enquiry.id} />
                    <button
                      type="submit"
                      className="ad-btn ad-btn--danger ad-btn--sm"
                      disabled={pending}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
