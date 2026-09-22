/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  moveHeroService,
  removeHeroService,
  saveHeroService,
  toggleHeroService,
  type FormState,
} from "@/app/admin/actions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import HeroArt from "@/components/sections/home/HeroIllustrations";
import { ACCEPT_IMAGE } from "@/lib/media";
import {
  HERO_ILLUSTRATIONS,
  HERO_PANEL_LABELS,
  HERO_PANELS,
  type HeroIllustration,
  type HeroPanel,
  type HeroService,
} from "@/lib/types";

const INITIAL: FormState = {};

/** Mirrors the server-side limit in `saveHeroService`. */
const DESCRIPTION_MAX = 140;

export default function HeroServicesManager({
  services,
  panelLinks,
}: {
  services: HeroService[];
  /** Each card's own link — used when a service has none. */
  panelLinks: Record<HeroPanel, string>;
}) {
  const [editing, setEditing] = useState<HeroService | { panel: HeroPanel } | null>(
    null,
  );
  const [confirming, setConfirming] = useState<HeroService | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const run = (
    action: (state: FormState, formData: FormData) => Promise<FormState>,
    fields: Record<string, string>,
    after?: () => void,
  ) => {
    startBusy(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(fields)) formData.set(key, value);
      const result = await action({}, formData);
      after?.();
      if (result.error) {
        setError(result.error);
        setFlash(null);
      } else if (result.message && result.message !== "Order updated.") {
        setFlash(result.message);
        setError(null);
      }
    });
  };

  return (
    <>
      <div className="ad-page-head" style={{ marginTop: 40 }}>
        <div>
          <h2 className="ad-title">Hero service cards</h2>
          <p className="ad-subtitle">
            The services each hero card rotates through, one every few seconds.
            Shown services join the rotation automatically in the order below;
            clicking a card opens that service&rsquo;s link. A card with no
            shown services falls back to its own title and description above.
          </p>
        </div>
      </div>

      {flash ? (
        <div className="ad-alert ad-alert--ok" role="status">
          {flash}
        </div>
      ) : null}
      {error ? (
        <div className="ad-alert ad-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      {HERO_PANELS.map((panel) => {
        const items = services
          .filter((s) => s.panel === panel)
          .sort((a, b) => a.order - b.order);

        return (
          <section className="ad-group" key={panel}>
            <div className="ad-group-head">
              <h3 className="ad-group-title">
                {HERO_PANEL_LABELS[panel]} card
                {panel === "it" ? " (black)" : " (white)"}
              </h3>
              <span className="ad-group-count">
                {items.length} {items.length === 1 ? "service" : "services"} ·{" "}
                {items.filter((i) => i.active).length} in rotation
              </span>
              <button
                type="button"
                className="ad-btn ad-btn--sm"
                onClick={() => {
                  setEditing({ panel });
                  setFlash(null);
                  setError(null);
                }}
              >
                + Add
              </button>
            </div>

            {items.length === 0 ? (
              <div className="ad-group-empty">
                No services yet — the card shows its own title and description.
              </div>
            ) : (
              <div className="ad-list">
                {items.map((item, index) => (
                  <article className="ad-item" key={item.id}>
                    <div className="ad-thumb">
                      {item.image ? (
                        <img src={item.image} alt="" loading="lazy" />
                      ) : (
                        <div
                          className="ad-thumb-empty"
                          aria-hidden="true"
                          style={{
                            background: panel === "it" ? "#0a0a0a" : "#fff",
                            color: panel === "it" ? "#fff" : "#0a0a0a",
                            padding: 8,
                          }}
                        >
                          <HeroArt name={item.illustration} />
                        </div>
                      )}
                    </div>

                    <div className="ad-item-body">
                      <h4 className="ad-item-title">
                        <span>{String(index + 1).padStart(2, "0")}</span>{" "}
                        {item.title}
                        <span
                          className={`ad-status ad-status--${item.active ? "on" : "off"}`}
                        >
                          {item.active ? "In rotation" : "Hidden"}
                        </span>
                      </h4>
                      <p className="ad-item-desc">{item.description}</p>
                      <div className="ad-item-meta">
                        <span>
                          Opens {item.link || `${panelLinks[panel] || "nothing"} (card link)`}
                        </span>
                      </div>
                    </div>

                    <div className="ad-item-actions">
                      <div className="ad-move">
                        <button
                          type="button"
                          aria-label={`Move ${item.title} up`}
                          disabled={index === 0 || busy}
                          onClick={() =>
                            run(moveHeroService, { id: item.id, direction: "up" })
                          }
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${item.title} down`}
                          disabled={index === items.length - 1 || busy}
                          onClick={() =>
                            run(moveHeroService, { id: item.id, direction: "down" })
                          }
                        >
                          ▼
                        </button>
                      </div>
                      <button
                        type="button"
                        className="ad-btn ad-btn--sm"
                        disabled={busy}
                        onClick={() => run(toggleHeroService, { id: item.id })}
                      >
                        {item.active ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className="ad-btn ad-btn--sm"
                        onClick={() => {
                          setEditing(item);
                          setFlash(null);
                          setError(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ad-btn ad-btn--sm ad-btn--danger"
                        onClick={() => setConfirming(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {editing ? (
        <HeroServiceEditor
          key={"id" in editing ? editing.id : `new-${editing.panel}`}
          item={"id" in editing ? editing : null}
          defaultPanel={editing.panel}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setFlash(message);
            setError(null);
          }}
        />
      ) : null}

      {confirming ? (
        <ConfirmDialog
          title="Delete this service?"
          body={
            <>
              &ldquo;{confirming.title}&rdquo; will leave the{" "}
              {HERO_PANEL_LABELS[confirming.panel]} card&rsquo;s rotation. This
              cannot be undone — use <em>Hide</em> to take it out temporarily.
            </>
          }
          pending={busy}
          onConfirm={() =>
            run(removeHeroService, { id: confirming.id }, () =>
              setConfirming(null),
            )
          }
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function HeroServiceEditor({
  item,
  defaultPanel,
  onClose,
  onSaved,
}: {
  item: HeroService | null;
  defaultPanel: HeroPanel;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveHeroService, INITIAL);
  const [panel, setPanel] = useState<HeroPanel>(item?.panel ?? defaultPanel);
  const [illustration, setIllustration] = useState<HeroIllustration>(
    item?.illustration ?? (defaultPanel === "it" ? "code" : "growth"),
  );
  const [description, setDescription] = useState(item?.description ?? "");
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (state.ok && !savedRef.current) {
      savedRef.current = true;
      onSaved(state.message ?? "Saved.");
    }
  }, [state, onSaved]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  useEffect(() => {
    return () => {
      if (newImage) URL.revokeObjectURL(newImage);
    };
  }, [newImage]);

  const currentImage = newImage ?? (removeImage ? null : item?.image || null);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item ? "Edit hero service" : "New hero service"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="ad-modal">
        <form action={action}>
          <div className="ad-modal-head">
            <h2 className="ad-modal-title">
              {item ? "Edit hero service" : "Add hero service"}
            </h2>
            <button
              type="button"
              className="ad-modal-close"
              aria-label="Close"
              onClick={onClose}
              disabled={pending}
            >
              ×
            </button>
          </div>

          <div className="ad-modal-body">
            {state.error ? (
              <div className="ad-alert ad-alert--error" role="alert">
                {state.error}
              </div>
            ) : null}

            {item ? <input type="hidden" name="id" value={item.id} /> : null}

            <div className="ad-grid">
              <div className="ad-field">
                <label className="ad-label" htmlFor="hs-panel">
                  Card
                </label>
                <select
                  id="hs-panel"
                  name="panel"
                  value={panel}
                  onChange={(e) => setPanel(e.target.value as HeroPanel)}
                >
                  {HERO_PANELS.map((p) => (
                    <option key={p} value={p}>
                      {HERO_PANEL_LABELS[p]} ({p === "it" ? "black" : "white"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ad-field">
                <span className="ad-label">Visibility</span>
                <label className="ad-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={item ? item.active : true}
                  />
                  Include in the card&rsquo;s rotation
                </label>
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="hs-title">
                  Title
                </label>
                <input
                  id="hs-title"
                  name="title"
                  type="text"
                  defaultValue={item?.title ?? ""}
                  placeholder="e.g. Website Development"
                  required
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="hs-description">
                  Short description{" "}
                  <span>
                    ({description.length}/{DESCRIPTION_MAX})
                  </span>
                </label>
                <textarea
                  id="hs-description"
                  name="description"
                  rows={2}
                  maxLength={DESCRIPTION_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <p className="ad-hint">
                  One sentence of about 80 characters reads best on the card.
                </p>
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="hs-link">
                  Link <span>(optional — defaults to the card&rsquo;s own link)</span>
                </label>
                <input
                  id="hs-link"
                  name="link"
                  type="text"
                  defaultValue={item?.link ?? ""}
                  placeholder="/services/web-design-development"
                />
                <p className="ad-hint">
                  Usually the matching service page, e.g.
                  /services/digital-marketing. A full https:// URL opens in a
                  new tab.
                </p>
              </div>

              <div className="ad-fieldset">Illustration</div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="hs-illustration">
                  Built-in illustration
                </label>
                <select
                  id="hs-illustration"
                  name="illustration"
                  value={illustration}
                  onChange={(e) =>
                    setIllustration(e.target.value as HeroIllustration)
                  }
                >
                  {Object.entries(HERO_ILLUSTRATIONS).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
                <div
                  className="ad-preview"
                  style={{
                    background: panel === "it" ? "#0a0a0a" : "#fff",
                    color: panel === "it" ? "#fff" : "#0a0a0a",
                    padding: 16,
                    maxWidth: 220,
                  }}
                >
                  <HeroArt name={illustration} />
                </div>
              </div>

              <div className="ad-field">
                <span className="ad-label">
                  Or upload an icon <span>(optional — replaces the illustration)</span>
                </span>

                {currentImage ? (
                  <div className="ad-preview" style={{ maxWidth: 220 }}>
                    <img src={currentImage} alt="Service icon preview" />
                  </div>
                ) : null}

                <input
                  name="image"
                  type="file"
                  accept={ACCEPT_IMAGE}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (newImage) URL.revokeObjectURL(newImage);
                    setNewImage(file ? URL.createObjectURL(file) : null);
                    if (file) setRemoveImage(false);
                  }}
                />

                {item?.image && !newImage ? (
                  <label className="ad-check">
                    <input
                      type="checkbox"
                      name="removeImage"
                      checked={removeImage}
                      onChange={(e) => setRemoveImage(e.target.checked)}
                    />
                    Remove the uploaded icon
                  </label>
                ) : null}
                <p className="ad-hint">
                  A square PNG with a transparent background works best.
                </p>
              </div>
            </div>
          </div>

          <div className="ad-modal-foot">
            <button
              type="button"
              className="ad-btn"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ad-btn ad-btn--primary"
              disabled={pending}
            >
              {pending ? "Saving…" : item ? "Save changes" : "Add service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
