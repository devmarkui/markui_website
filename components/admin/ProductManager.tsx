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
  moveProduct,
  removeProduct,
  saveProduct,
  type FormState,
} from "@/app/admin/actions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import GalleryEditor from "@/components/admin/GalleryEditor";
import { ACCEPT_IMAGE } from "@/lib/media";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUSES,
  type Product,
} from "@/lib/types";

const INITIAL: FormState = {};

export default function ProductManager({ products }: { products: Product[] }) {
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [confirming, setConfirming] = useState<Product | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const [moving, startMove] = useTransition();

  const move = (product: Product, direction: "up" | "down") => {
    startMove(async () => {
      const formData = new FormData();
      formData.set("id", product.id);
      formData.set("direction", direction);
      const result = await moveProduct({}, formData);
      if (result.error) setError(result.error);
    });
  };

  const handleDelete = () => {
    if (!confirming) return;
    const target = confirming;

    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", target.id);
      const result = await removeProduct({}, formData);

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

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Products</h1>
          <p className="ad-subtitle">
            The digital products Mark UI has built, shown on the public
            Products page in this order with their Product Preview. Services —
            the work your team delivers for clients — are managed separately.
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
          + Add product
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

      {products.length > 0 ? (
        <div className="ad-toolbar">
          <span className="ad-count">
            {products.length} {products.length === 1 ? "product" : "products"} ·{" "}
            {products.filter((p) => p.active).length} live
          </span>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="ad-empty">
          No products yet. The public Products page shows a &ldquo;coming
          soon&rdquo; message until you add one — use{" "}
          <strong>+ Add product</strong> to get started.
        </div>
      ) : (
        <div className="ad-list">
          {products.map((product, index) => (
            <article className="ad-item" key={product.id}>
              <div className="ad-thumb">
                {product.image ? (
                  <img src={product.image} alt="" loading="lazy" />
                ) : (
                  <div className="ad-thumb-empty" aria-hidden="true">
                    {product.icon || product.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="ad-item-body">
                <h2 className="ad-item-title">
                  {product.name}
                  <span
                    className={`ad-status ad-status--${product.active ? "on" : "off"}`}
                  >
                    {product.active ? "Live" : "Hidden"}
                  </span>
                  <span className="ad-badge">
                    {PRODUCT_STATUS_LABELS[product.status ?? "available"]}
                  </span>
                  {product.price ? (
                    <span className="ad-badge">{product.price}</span>
                  ) : null}
                </h2>
                <p className="ad-item-desc">{product.shortDescription}</p>
                <div className="ad-item-meta">
                  {product.category ? <span>{product.category}</span> : null}
                  {product.features.length ? (
                    <span>{product.features.length} features</span>
                  ) : null}
                  <span>
                    {product.preview?.length ?? 0} preview{" "}
                    {product.preview?.length === 1 ? "item" : "items"}
                  </span>
                  {product.link ? <span>Has link</span> : null}
                  {!product.image ? <span>⚠ no image</span> : null}
                </div>
              </div>

              <div className="ad-item-actions">
                <div className="ad-move">
                  <button
                    type="button"
                    aria-label={`Move ${product.name} up`}
                    disabled={index === 0 || moving}
                    onClick={() => move(product, "up")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${product.name} down`}
                    disabled={index === products.length - 1 || moving}
                    onClick={() => move(product, "down")}
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  onClick={() => {
                    setEditing(product);
                    setFlash(null);
                    setError(null);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm ad-btn--danger"
                  onClick={() => setConfirming(product)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <ProductEditor
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
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
          title="Delete this product?"
          body={
            <>
              <strong>{confirming.name}</strong> will be permanently removed
              from the database and will disappear from the Products page. This
              cannot be undone.
            </>
          }
          pending={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveProduct, INITIAL);
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [droppedMedia, setDroppedMedia] = useState<string[]>([]);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [newLogo, setNewLogo] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (newLogo) URL.revokeObjectURL(newLogo);
    };
  }, [newLogo]);

  const currentImage = newImage ?? (removeImage ? null : product?.image || null);
  const currentLogo = newLogo ?? (removeLogo ? null : product?.logo || null);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={product ? "Edit product" : "New product"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="ad-modal">
        <form action={action}>
          <div className="ad-modal-head">
            <h2 className="ad-modal-title">
              {product ? `Edit — ${product.name}` : "New product"}
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

            {product ? (
              <input type="hidden" name="id" value={product.id} />
            ) : null}

            <div className="ad-grid">
              <div className="ad-fieldset">Basics</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pd-name">
                  Product name
                </label>
                <input
                  id="pd-name"
                  name="name"
                  type="text"
                  defaultValue={product?.name ?? ""}
                  placeholder="e.g. Brand Starter Kit"
                  required
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pd-category">
                  Category <span>(optional)</span>
                </label>
                <input
                  id="pd-category"
                  name="category"
                  type="text"
                  defaultValue={product?.category ?? ""}
                  placeholder="e.g. Business software"
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pd-status">
                  Status
                </label>
                <select
                  id="pd-status"
                  name="status"
                  defaultValue={product?.status ?? "available"}
                >
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PRODUCT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pd-short">
                  Short description
                </label>
                <textarea
                  id="pd-short"
                  name="shortDescription"
                  defaultValue={product?.shortDescription ?? ""}
                  placeholder="One or two sentences on what it is."
                  required
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pd-full">
                  Detailed description
                </label>
                <textarea
                  id="pd-full"
                  name="fullDescription"
                  defaultValue={product?.fullDescription ?? ""}
                  placeholder="A paragraph on who it is for and what it does."
                  style={{ minHeight: 120 }}
                />
                <p className="ad-hint">
                  Leave blank to reuse the short description.
                </p>
              </div>

              <div className="ad-fieldset">Details</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pd-features">
                  Key features <span>(one per line)</span>
                </label>
                <textarea
                  id="pd-features"
                  name="features"
                  defaultValue={(product?.features ?? []).join("\n")}
                  placeholder={"Customer management\nReports\nPayments"}
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pd-tech">
                  Technologies <span>(optional, one per line)</span>
                </label>
                <textarea
                  id="pd-tech"
                  name="technologies"
                  defaultValue={(product?.technologies ?? []).join("\n")}
                  placeholder={"Next.js\nPostgreSQL\nFlutter"}
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pd-price">
                  Price <span>(optional)</span>
                </label>
                <input
                  id="pd-price"
                  name="price"
                  type="text"
                  defaultValue={product?.price ?? ""}
                  placeholder="From LKR 85,000"
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pd-icon">
                  Icon glyph
                </label>
                <input
                  id="pd-icon"
                  name="icon"
                  type="text"
                  maxLength={4}
                  defaultValue={product?.icon ?? "▣"}
                  placeholder="▣"
                />
                <p className="ad-hint">Shown when there is no image.</p>
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pd-link">
                  Product URL <span>(website, demo or app)</span>
                </label>
                <input
                  id="pd-link"
                  name="link"
                  type="url"
                  defaultValue={product?.link ?? ""}
                  placeholder="https://example.com"
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pd-cta">
                  Button label <span>(optional)</span>
                </label>
                <input
                  id="pd-cta"
                  name="ctaLabel"
                  type="text"
                  defaultValue={product?.ctaLabel ?? ""}
                  placeholder="Explore product"
                />
                <p className="ad-hint">
                  With a URL the button reads &ldquo;Explore product&rdquo; and
                  opens it; without one it becomes an enquiry to your contact
                  page.
                </p>
              </div>

              <div className="ad-fieldset">Media &amp; visibility</div>

              <div className="ad-field ad-field--full">
                <span className="ad-label">Visibility</span>
                <label className="ad-check" style={{ marginTop: 4 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={product ? product.active : true}
                  />
                  Show this product on the website
                </label>
              </div>

              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  Cover image{" "}
                  <span>(admin thumbnail; the preview until you add items below)</span>
                </span>

                {currentImage ? (
                  <div className="ad-preview">
                    <img src={currentImage} alt="Product preview" />
                  </div>
                ) : (
                  <p className="ad-hint">No cover image.</p>
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

                {product?.image && !newImage ? (
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

              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  Logo <span>(optional — shown beside the product number)</span>
                </span>

                {currentLogo ? (
                  <div className="ad-preview ad-preview--logo">
                    <img src={currentLogo} alt="Logo preview" />
                  </div>
                ) : null}

                <input
                  name="logo"
                  type="file"
                  accept={ACCEPT_IMAGE}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (newLogo) URL.revokeObjectURL(newLogo);
                    setNewLogo(file ? URL.createObjectURL(file) : null);
                    if (file) setRemoveLogo(false);
                  }}
                />

                {product?.logo && !newLogo ? (
                  <label className="ad-check">
                    <input
                      type="checkbox"
                      name="removeLogo"
                      checked={removeLogo}
                      onChange={(e) => setRemoveLogo(e.target.checked)}
                    />
                    Remove the current logo
                  </label>
                ) : null}
              </div>

              <div className="ad-fieldset">Product preview</div>

              <GalleryEditor
                prefix="preview"
                items={product?.preview ?? []}
                hint="Screenshots and demo videos, shown in this order. Videos play silently while a visitor hovers over them, and on tap on phones."
              />

              {product?.media.length ? (
              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  Older extra files{" "}
                  <span>(shown only while the preview above is empty)</span>
                </span>

                {product?.media.length ? (
                  <div className="ad-media-grid">
                    {product.media.map((media) => {
                      const dropped = droppedMedia.includes(media.url);
                      return (
                        <div
                          className="ad-media"
                          key={media.url}
                          data-removed={dropped}
                        >
                          {media.type === "video" ? (
                            <video src={media.url} muted playsInline />
                          ) : (
                            <img src={media.url} alt={media.name ?? ""} />
                          )}
                          <span className="ad-media-kind">{media.type}</span>
                          <button
                            type="button"
                            className="ad-media-toggle"
                            aria-label={
                              dropped
                                ? `Keep ${media.name ?? "file"}`
                                : `Remove ${media.name ?? "file"}`
                            }
                            onClick={() =>
                              setDroppedMedia((prev) =>
                                dropped
                                  ? prev.filter((u) => u !== media.url)
                                  : [...prev, media.url],
                              )
                            }
                          >
                            {dropped ? "↺" : "×"}
                          </button>
                          {dropped ? (
                            <input
                              type="hidden"
                              name="removeMedia"
                              value={media.url}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

              </div>
              ) : null}
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
              {pending ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
