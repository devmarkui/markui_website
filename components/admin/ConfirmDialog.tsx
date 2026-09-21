"use client";

import { useEffect } from "react";

/**
 * Deliberate confirmation step before anything is permanently deleted.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  pending,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="ad-modal ad-modal--sm">
        <div className="ad-modal-head">
          <h2 className="ad-modal-title">{title}</h2>
        </div>

        <div className="ad-modal-body">
          <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "#a3a3a3" }}>
            {body}
          </p>
        </div>

        <div className="ad-modal-foot">
          <button
            type="button"
            className="ad-btn"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
