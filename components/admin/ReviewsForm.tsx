"use client";

import { useActionState, useRef, useState } from "react";

import { saveReviews, type FormState } from "@/app/admin/actions";
import TextField from "@/components/admin/Field";
import { hangReviews, LIMITS, MAX_REVIEWS, type Review, type ReviewSize } from "@/lib/site-content";

const INITIAL: FormState = {};

interface Row extends Review {
  /** Stable React key; never sent to the server. */
  key: number;
}

const SIZE_LABELS: Record<ReviewSize, string> = {
  xxl: "Headline · set largest",
  xl: "Very large",
  l: "Large",
  m: "Medium",
  s: "Small · body text",
};

/**
 * The homepage's review wall. A review's size is not chosen: it follows from
 * how few words it has, so the form shows the size each one will get.
 */
export default function ReviewsForm({ reviews, note }: { reviews: Review[]; note: string }) {
  const [state, action, pending] = useActionState(saveReviews, INITIAL);
  const nextKey = useRef(reviews.length);
  const [rows, setRows] = useState<Row[]>(() => reviews.map((review, key) => ({ ...review, key })));

  const update = (key: number, field: keyof Review, value: string) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const move = (index: number, by: -1 | 1) =>
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  // The sizes as the wall will hang them, worked out the same way the site does.
  const { spoken } = hangReviews(rows);
  const sizeOf = new Map(spoken.map((review) => [review.key, review.size]));
  const written = rows.filter((r) => r.text.trim()).length;

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Reviews</h1>
          <p className="ad-subtitle">
            The homepage&rsquo;s wall of Google reviews. The heading counts them by itself (&ldquo;Twelve reviews.
            All five stars.&rdquo;), so list five-star reviews only.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <div className="ad-alert ad-alert--note" role="note">
        <strong>How the wall sets them.</strong> The <strong>first</strong> review is the headline one, set
        largest: pick one of three to five words. After that, the fewer the words, the larger the type. Leave
        the text empty for someone who gave five stars without writing anything; they are listed together at
        the end under &ldquo;Zero words. Five stars.&rdquo; Copy reviews exactly as they were written on
        Google.
      </div>

      <form action={action}>
        <div className="ad-panel">
          <h2 className="ad-panel-title">
            {rows.length} {rows.length === 1 ? "review" : "reviews"} · {written} with words
          </h2>

          <div className="ad-list">
            {rows.map((row, index) => {
              const size = sizeOf.get(row.key);
              return (
                <div className="ad-item ad-item--plain" key={row.key}>
                  <div className="ad-item-body">
                    <p className="ad-hint" style={{ marginBottom: 12 }}>
                      <strong>{String(index + 1).padStart(2, "0")}</strong> ·{" "}
                      {size ? SIZE_LABELS[size] : "No words · listed under “Zero words. Five stars.”"}
                    </p>
                    <div className="ad-grid">
                      <TextField
                        id={`rv-name-${row.key}`}
                        name="reviewName"
                        label="Reviewer"
                        max={LIMITS.reviewName}
                        value={row.name}
                        onChange={(v) => update(row.key, "name", v)}
                        placeholder="Name as shown on Google"
                      />
                      <TextField
                        id={`rv-lead-${row.key}`}
                        name="reviewLead"
                        label="Bold opening line"
                        note="(optional)"
                        max={LIMITS.reviewLead}
                        value={row.lead}
                        onChange={(v) => update(row.key, "lead", v)}
                        required={false}
                        hint="A first sentence to set bold above the rest."
                      />
                      <TextField
                        id={`rv-text-${row.key}`}
                        name="reviewText"
                        label="Review"
                        note="(leave empty for a rating without words)"
                        max={LIMITS.reviewText}
                        rows={3}
                        value={row.text}
                        onChange={(v) => update(row.key, "text", v)}
                        required={false}
                        full
                      />
                      <TextField
                        id={`rv-aside-${row.key}`}
                        name="reviewAside"
                        label="Sticker note"
                        note="(optional)"
                        max={LIMITS.reviewAside}
                        value={row.aside}
                        onChange={(v) => update(row.key, "aside", v)}
                        required={false}
                        hint="A small tilted label under the review, e.g. “Keep reading. He’s joking.”"
                        full
                      />
                    </div>
                  </div>

                  <div className="ad-item-actions">
                    <div className="ad-move">
                      <button
                        type="button"
                        aria-label={`Move ${row.name || "review"} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${row.name || "review"} down`}
                        disabled={index === rows.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      className="ad-btn ad-btn--sm ad-btn--danger"
                      onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="ad-btn"
              disabled={rows.length >= MAX_REVIEWS}
              onClick={() =>
                setRows((prev) => [...prev, { key: nextKey.current++, name: "", text: "", lead: "", aside: "" }])
              }
            >
              + Add review
            </button>
          </div>
          <p className="ad-hint" style={{ marginTop: 10 }}>
            Up to {MAX_REVIEWS}. After the first, reviews are hung in this order: short ones in the wide
            places, long ones in the narrow places beside them.
          </p>
        </div>

        <div className="ad-panel">
          <h2 className="ad-panel-title">Note beside the heading</h2>
          <div className="ad-grid">
            <TextField
              id="rv-note"
              name="reviewsNote"
              label="Note"
              max={LIMITS.reviewsNote}
              defaultValue={note}
              required={false}
              hint="Explains why the reviews are different sizes. Leave empty to show none."
              full
            />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save reviews"}
          </button>
        </div>
      </form>
    </>
  );
}
