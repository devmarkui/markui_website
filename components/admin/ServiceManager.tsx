/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  moveService,
  removeService,
  saveService,
  type FormState,
} from "@/app/admin/actions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ACCEPT_IMAGE } from "@/lib/media";
import { slugify } from "@/lib/slug";
import type { Service } from "@/lib/types";

const INITIAL: FormState = {};

export default function ServiceManager({
  services,
  topWorkCounts,
}: {
  services: Service[];
  /** serviceId → number of Top Work items, shown as context on each row. */
  topWorkCounts: Record<string, number>;
}) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [confirming, setConfirming] = useState<Service | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const handleDelete = () => {
    if (!confirming) return;
    const target = confirming;

    startBusy(async () => {
      const formData = new FormData();
      formData.set("id", target.id);
      const result = await removeService({}, formData);

      setConfirming(null);
      if (result.error) {
        setError(result.error);
        setFlash(null);
      } else {
        setFlash(result.message ?? null);
        setError(null);
      }
    });
  };

  const move = (service: Service, direction: "up" | "down") => {
    startBusy(async () => {
      const formData = new FormData();
      formData.set("id", service.id);
      formData.set("direction", direction);
      const result = await moveService({}, formData);
      if (result.error) setError(result.error);
    });
  };

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Services</h1>
          <p className="ad-subtitle">
            Each service has its own public page at <code>/services/…</code>.
            Changes here update the Services page, the home page section and the
            service&rsquo;s own page immediately.
          </p>
        </div>
        <button
          className="ad-btn ad-btn--primary"
          type="button"
          onClick={() => {
            setEditing("new");
            setFlash(null);
            setError(null);
          }}
        >
          + Add service
        </button>
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

      <div className="ad-toolbar">
        <span className="ad-count">
          {services.length} {services.length === 1 ? "service" : "services"} ·{" "}
          {services.filter((s) => s.active).length} live
        </span>
      </div>

      {services.length === 0 ? (
        <div className="ad-empty">
          No services yet. Use <strong>+ Add service</strong> to create one.
        </div>
      ) : (
        <div className="ad-list">
          {services.map((service, index) => (
            <article className="ad-item" key={service.id}>
              <div className="ad-thumb">
                {service.image ? (
                  <img src={service.image} alt="" loading="lazy" />
                ) : (
                  <div className="ad-thumb-empty" aria-hidden="true">
                    {service.icon || service.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="ad-item-body">
                <h2 className="ad-item-title">
                  {service.name}
                  <span
                    className={`ad-status ad-status--${service.active ? "on" : "off"}`}
                  >
                    {service.active ? "Live" : "Hidden"}
                  </span>
                </h2>
                <p className="ad-item-desc">{service.shortDescription}</p>
                <div className="ad-item-meta">
                  <span>/services/{service.slug}</span>
                  <span>{service.features.length} deliverables</span>
                  <span>{topWorkCounts[service.id] ?? 0} top work</span>
                  {!service.image ? <span>⚠ no image</span> : null}
                </div>
              </div>

              <div className="ad-item-actions">
                <div className="ad-move">
                  <button
                    type="button"
                    aria-label={`Move ${service.name} up`}
                    disabled={index === 0 || busy}
                    onClick={() => move(service, "up")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${service.name} down`}
                    disabled={index === services.length - 1 || busy}
                    onClick={() => move(service, "down")}
                  >
                    ▼
                  </button>
                </div>
                <Link
                  className="ad-btn ad-btn--sm"
                  href={`/admin/top-work?service=${service.id}`}
                >
                  Top work
                </Link>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  onClick={() => {
                    setEditing(service);
                    setFlash(null);
                    setError(null);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm ad-btn--danger"
                  onClick={() => setConfirming(service)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <ServiceEditor
          key={editing === "new" ? "new" : editing.id}
          service={editing === "new" ? null : editing}
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
              <strong>{confirming.name}</strong> and its{" "}
              {topWorkCounts[confirming.id] ?? 0} Top Work{" "}
              {(topWorkCounts[confirming.id] ?? 0) === 1 ? "entry" : "entries"}{" "}
              will be permanently removed, and{" "}
              <code>/services/{confirming.slug}</code> will stop working. Your
              projects are not affected. This cannot be undone.
            </>
          }
          pending={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function ServiceEditor({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveService, INITIAL);
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(service));
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

  const currentImage = newImage ?? (removeImage ? null : service?.image || null);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={service ? "Edit service" : "New service"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="ad-modal">
        <form action={action}>
          <div className="ad-modal-head">
            <h2 className="ad-modal-title">
              {service ? `Edit — ${service.name}` : "New service"}
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

            {service ? (
              <input type="hidden" name="id" value={service.id} />
            ) : null}

            <div className="ad-grid">
              <div className="ad-fieldset">Basics</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-name">
                  Service name
                </label>
                <input
                  id="sv-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Digital Marketing"
                  required
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-slug">
                  Page address <span>(the /services/… part)</span>
                </label>
                <div className="ad-slug">
                  <span className="ad-slug-prefix">/services/</span>
                  <input
                    id="sv-slug"
                    name="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    onBlur={(e) => setSlug(slugify(e.target.value))}
                    placeholder="digital-marketing"
                  />
                </div>
                {service ? (
                  <p className="ad-hint">
                    Changing this breaks any existing links to the old address.
                  </p>
                ) : null}
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-short">
                  Short description <span>(cards and home page)</span>
                </label>
                <textarea
                  id="sv-short"
                  name="shortDescription"
                  defaultValue={service?.shortDescription ?? ""}
                  placeholder="One or two sentences summarising the service."
                  required
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-full">
                  Full description <span>(the service page)</span>
                </label>
                <textarea
                  id="sv-full"
                  name="fullDescription"
                  defaultValue={service?.fullDescription ?? ""}
                  placeholder="The longer explanation shown in the Overview section."
                  style={{ minHeight: 140 }}
                />
                <p className="ad-hint">
                  Leave blank to reuse the short description.
                </p>
              </div>

              <div className="ad-fieldset">Content</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-features">
                  What we offer <span>(one per line)</span>
                </label>
                <textarea
                  id="sv-features"
                  name="features"
                  defaultValue={(service?.features ?? []).join("\n")}
                  placeholder={"Social Media\nSEO\nGoogle & Meta Ads"}
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-benefits">
                  Why choose this service <span>(one per line)</span>
                </label>
                <textarea
                  id="sv-benefits"
                  name="benefits"
                  defaultValue={(service?.benefits ?? []).join("\n")}
                  placeholder={
                    "One connected strategy instead of disconnected channels"
                  }
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="sv-tags">
                  Tags <span>(one per line or comma separated)</span>
                </label>
                <textarea
                  id="sv-tags"
                  name="tags"
                  defaultValue={(service?.tags ?? []).join(", ")}
                  placeholder="Strategy, Paid Media, SEO"
                  style={{ minHeight: 64 }}
                />
              </div>

              <div className="ad-fieldset">Appearance &amp; visibility</div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="sv-icon">
                  Icon glyph
                </label>
                <input
                  id="sv-icon"
                  name="icon"
                  type="text"
                  maxLength={4}
                  defaultValue={service?.icon ?? "◆"}
                  placeholder="◎"
                />
                <p className="ad-hint">Shown when there is no image.</p>
              </div>

              <div className="ad-field">
                <span className="ad-label">Visibility</span>
                <label className="ad-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={service ? service.active : true}
                  />
                  Show this service on the website
                </label>
                <p className="ad-hint">
                  Unchecking hides it everywhere without deleting anything.
                </p>
              </div>

              <div className="ad-field ad-field--full">
                <span className="ad-label">Service image</span>

                {currentImage ? (
                  <div className="ad-preview">
                    <img src={currentImage} alt="Service image preview" />
                  </div>
                ) : (
                  <p className="ad-hint">
                    No image yet — the icon glyph is shown instead.
                  </p>
                )}

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
                <p className="ad-hint">
                  Used on the service card and as the hero background.
                </p>

                {service?.image && !newImage ? (
                  <label className="ad-check">
                    <input
                      type="checkbox"
                      name="removeImage"
                      checked={removeImage}
                      onChange={(e) => setRemoveImage(e.target.checked)}
                    />
                    Remove the current image
                  </label>
                ) : null}
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
              {pending ? "Saving…" : service ? "Save changes" : "Create service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
