"use client";

import { useActionState, useRef, useState } from "react";

import { saveContactPage, type FormState } from "@/app/admin/actions";
import TextField from "@/components/admin/Field";
import { PageFields } from "@/components/admin/PageTextForm";
import { LIMITS, MAX_FAQS, MAX_PROMISES, MIN_PROMISES, type ContactPageCopy } from "@/lib/site-content";

const INITIAL: FormState = {};

interface PromiseRow {
  key: number;
  text: string;
}

interface FaqRow {
  key: number;
  q: string;
  a: string;
}

/**
 * The contact page's own text: its header, the promises on the orange strip,
 * the questions under the form and the closing line. (The numbers, email and
 * hours are the form above this one.)
 */
export default function ContactPageForm({ copy }: { copy: ContactPageCopy }) {
  const [state, action, pending] = useActionState(saveContactPage, INITIAL);

  const nextPromise = useRef(copy.promises.length);
  const [promises, setPromises] = useState<PromiseRow[]>(() => copy.promises.map((text, key) => ({ key, text })));
  const nextFaq = useRef(copy.faqs.length);
  const [faqs, setFaqs] = useState<FaqRow[]>(() => copy.faqs.map((faq, key) => ({ key, ...faq })));

  const moveFaq = (index: number, by: -1 | 1) =>
    setFaqs((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  return (
    <>
      <div className="ad-page-head" style={{ marginTop: 40 }}>
        <div>
          <h2 className="ad-title">Contact page</h2>
          <p className="ad-subtitle">
            The text of the contact page itself: its header, the promises that run past on the orange strip, the
            questions under the form, and the closing line. The form&rsquo;s &ldquo;I&rsquo;m looking for help
            with&rdquo; choices are your live services.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <form action={action}>
        <PageFields id="contact" name="Contact" path="/contact" copy={copy} />

        {/* ── Promises ── */}
        <div className="ad-panel">
          <h2 className="ad-panel-title">Promises strip</h2>
          <p className="ad-hint" style={{ marginBottom: 16 }}>
            Short promises that scroll past under the page header. Two to four words each, with no full stop:
            &ldquo;Response within 24 hours&rdquo;. Between {MIN_PROMISES} and {MAX_PROMISES}.
          </p>
          <div className="ad-list">
            {promises.map((row, index) => (
              <div className="ad-item ad-item--plain" key={row.key}>
                <div className="ad-item-body">
                  <TextField
                    id={`cp-promise-${row.key}`}
                    name="promise"
                    label={`Promise ${index + 1}`}
                    max={LIMITS.promise}
                    value={row.text}
                    onChange={(text) => setPromises((prev) => prev.map((r) => (r.key === row.key ? { ...r, text } : r)))}
                  />
                </div>
                <div className="ad-item-actions">
                  <button
                    type="button"
                    className="ad-btn ad-btn--sm ad-btn--danger"
                    disabled={promises.length <= MIN_PROMISES}
                    onClick={() => setPromises((prev) => prev.filter((r) => r.key !== row.key))}
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
              disabled={promises.length >= MAX_PROMISES}
              onClick={() => setPromises((prev) => [...prev, { key: nextPromise.current++, text: "" }])}
            >
              + Add promise
            </button>
          </div>
        </div>

        {/* ── Questions ── */}
        <div className="ad-panel">
          <h2 className="ad-panel-title">Frequently asked questions</h2>
          <p className="ad-hint" style={{ marginBottom: 16 }}>
            The questions people ask before they get in touch, in this order. Write each question as the visitor
            would ask it and answer in two or three sentences. Remove them all to hide the section. Up to{" "}
            {MAX_FAQS}.
          </p>
          <div className="ad-list">
            {faqs.map((row, index) => (
              <div className="ad-item ad-item--plain" key={row.key}>
                <div className="ad-item-body">
                  <div className="ad-grid">
                    <TextField
                      id={`cp-faq-q-${row.key}`}
                      name="faqQuestion"
                      label={`Question ${index + 1}`}
                      max={LIMITS.faqQuestion}
                      value={row.q}
                      onChange={(q) => setFaqs((prev) => prev.map((r) => (r.key === row.key ? { ...r, q } : r)))}
                      full
                    />
                    <TextField
                      id={`cp-faq-a-${row.key}`}
                      name="faqAnswer"
                      label="Answer"
                      max={LIMITS.faqAnswer}
                      rows={3}
                      value={row.a}
                      onChange={(a) => setFaqs((prev) => prev.map((r) => (r.key === row.key ? { ...r, a } : r)))}
                      full
                    />
                  </div>
                </div>
                <div className="ad-item-actions">
                  <div className="ad-move">
                    <button
                      type="button"
                      aria-label={`Move question ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => moveFaq(index, -1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={`Move question ${index + 1} down`}
                      disabled={index === faqs.length - 1}
                      onClick={() => moveFaq(index, 1)}
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ad-btn ad-btn--sm ad-btn--danger"
                    onClick={() => setFaqs((prev) => prev.filter((r) => r.key !== row.key))}
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
              disabled={faqs.length >= MAX_FAQS}
              onClick={() => setFaqs((prev) => [...prev, { key: nextFaq.current++, q: "", a: "" }])}
            >
              + Add question
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save contact page"}
          </button>
        </div>
      </form>
    </>
  );
}
