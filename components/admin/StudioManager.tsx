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
  moveStudioItem,
  removeStudioItem,
  saveStudioItem,
  toggleStudioItem,
  type FormState,
} from "@/app/admin/actions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ACCEPT_IMAGE, ACCEPT_VIDEO, MAX_UPLOAD_MB } from "@/lib/media";
import type { StudioItem } from "@/lib/types";

const INITIAL: FormState = {};

/** Uploaded files live under /api/uploads; anything else was pasted as a URL. */
function isUploaded(url: string | undefined) {
  return Boolean(url && url.startsWith("/api/uploads/"));
}

export default function StudioManager({ items }: { items: StudioItem[] }) {
  const [editing, setEditing] = useState<StudioItem | "new" | null>(null);
  const [confirming, setConfirming] = useState<StudioItem | null>(null);
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

  const shown = items.filter((i) => i.active).length;

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Latest From Our Studio</h1>
          <p className="ad-subtitle">
            Photo and video posts shown in the <em>Latest From Our Studio</em>{" "}
            section of the Home page. Each post can link to a project, product,
            service, campaign, article or any external website. The section is
            hidden on the site until at least one post is shown.
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
          + Add post
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

      {items.length === 0 ? (
        <div className="ad-empty">
          No posts yet. Add a photo or video to show the section on the Home
          page.
        </div>
      ) : (
        <section className="ad-group">
          <div className="ad-group-head">
            <h2 className="ad-group-title">Posts</h2>
            <span className="ad-group-count">
              {items.length} {items.length === 1 ? "post" : "posts"} · {shown}{" "}
              shown
            </span>
          </div>

          <div className="ad-list">
            {items.map((item, index) => (
              <article className="ad-item" key={item.id}>
                <div className="ad-thumb">
                  {item.image ? (
                    <img src={item.image} alt="" loading="lazy" />
                  ) : item.video ? (
                    <video
                      src={item.video}
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="ad-thumb-empty" aria-hidden="true">
                      {item.title.slice(0, 1)}
                    </div>
                  )}
                </div>

                <div className="ad-item-body">
                  <h3 className="ad-item-title">
                    {item.title}
                    <span
                      className={`ad-status ad-status--${item.active ? "on" : "off"}`}
                    >
                      {item.active ? "Shown" : "Hidden"}
                    </span>
                    <span className="ad-badge">
                      {item.mediaType === "video" ? "Video" : "Photo"}
                    </span>
                  </h3>
                  <p className="ad-item-desc">
                    {item.description || "No description."}
                  </p>
                  <div className="ad-item-meta">
                    <span>
                      {item.link ? `Links to ${item.link}` : "No link — not clickable"}
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
                        run(moveStudioItem, { id: item.id, direction: "up" })
                      }
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${item.title} down`}
                      disabled={index === items.length - 1 || busy}
                      onClick={() =>
                        run(moveStudioItem, { id: item.id, direction: "down" })
                      }
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ad-btn ad-btn--sm"
                    disabled={busy}
                    onClick={() => run(toggleStudioItem, { id: item.id })}
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
        </section>
      )}

      {editing ? (
        <StudioEditor
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
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
          title="Delete this post?"
          body={
            <>
              &ldquo;{confirming.title}&rdquo; will disappear from the Home page
              and its uploaded files will be deleted. This cannot be undone.
            </>
          }
          pending={busy}
          onConfirm={() =>
            run(removeStudioItem, { id: confirming.id }, () =>
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

function StudioEditor({
  item,
  onClose,
  onSaved,
}: {
  item: StudioItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveStudioItem, INITIAL);
  const [mediaType, setMediaType] = useState<StudioItem["mediaType"]>(
    item?.mediaType ?? "image",
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [newVideo, setNewVideo] = useState<string | null>(null);
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
      if (newVideo) URL.revokeObjectURL(newVideo);
    };
  }, [newVideo]);

  const currentImage = newImage ?? (removeImage ? null : item?.image || null);
  const uploadedVideo = isUploaded(item?.video) ? item?.video : undefined;
  const currentVideo = newVideo ?? (removeVideo ? null : uploadedVideo || null);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item ? "Edit post" : "New post"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="ad-modal">
        <form action={action}>
          <div className="ad-modal-head">
            <h2 className="ad-modal-title">{item ? "Edit post" : "Add post"}</h2>
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
              <div className="ad-fieldset">Details</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="st-title">
                  Title
                </label>
                <input
                  id="st-title"
                  name="title"
                  type="text"
                  defaultValue={item?.title ?? ""}
                  required
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="st-description">
                  Short description <span>(optional)</span>
                </label>
                <textarea
                  id="st-description"
                  name="description"
                  rows={2}
                  defaultValue={item?.description ?? ""}
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="st-link">
                  Destination URL <span>(optional)</span>
                </label>
                <input
                  id="st-link"
                  name="link"
                  type="text"
                  defaultValue={item?.link ?? ""}
                  placeholder="/projects/… or https://…"
                />
                <p className="ad-hint">
                  A site path such as /services/digital-marketing opens on this
                  site; a full https:// URL opens in a new tab.
                </p>
              </div>

              <div className="ad-field">
                <span className="ad-label">Visibility</span>
                <label className="ad-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={item ? item.active : true}
                  />
                  Show on the Home page
                </label>
              </div>

              <div className="ad-fieldset">Media</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="st-media-type">
                  Media type
                </label>
                <select
                  id="st-media-type"
                  name="mediaType"
                  value={mediaType}
                  onChange={(e) =>
                    setMediaType(e.target.value as StudioItem["mediaType"])
                  }
                >
                  <option value="image">Photo</option>
                  <option value="video">Video</option>
                </select>
                <p className="ad-hint">
                  {mediaType === "video"
                    ? "Videos play silently while a visitor hovers over them (and when scrolled into view on phones)."
                    : "Shown as a still image."}{" "}
                  Files up to {MAX_UPLOAD_MB}MB.
                </p>
              </div>

              {mediaType === "video" ? (
                <div className="ad-field ad-field--full">
                  <span className="ad-label">Video</span>

                  {currentVideo ? (
                    <div className="ad-preview">
                      <video
                        src={currentVideo}
                        muted
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  ) : null}

                  <input
                    name="videoFile"
                    type="file"
                    accept={ACCEPT_VIDEO}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (newVideo) URL.revokeObjectURL(newVideo);
                      setNewVideo(file ? URL.createObjectURL(file) : null);
                      if (file) setRemoveVideo(false);
                    }}
                  />

                  {uploadedVideo && !newVideo ? (
                    <label className="ad-check">
                      <input
                        type="checkbox"
                        name="removeVideo"
                        checked={removeVideo}
                        onChange={(e) => setRemoveVideo(e.target.checked)}
                      />
                      Remove the current video
                    </label>
                  ) : null}

                  <label
                    className="ad-label"
                    htmlFor="st-video-url"
                    style={{ marginTop: 12 }}
                  >
                    Or video URL <span>(direct link to an MP4 or WebM file)</span>
                  </label>
                  <input
                    id="st-video-url"
                    name="videoUrl"
                    type="url"
                    defaultValue={
                      item?.video && !isUploaded(item.video) ? item.video : ""
                    }
                    placeholder="https://cdn.example.com/reel.mp4"
                  />
                  <p className="ad-hint">
                    An uploaded file is used over the URL. YouTube and Vimeo
                    page links will not play — use the file link.
                  </p>
                </div>
              ) : null}

              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  {mediaType === "video" ? (
                    <>
                      Poster / thumbnail image{" "}
                      <span>(shown until the video plays — recommended)</span>
                    </>
                  ) : (
                    "Image"
                  )}
                </span>

                {currentImage ? (
                  <div className="ad-preview">
                    <img src={currentImage} alt="Post preview" />
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
              {pending ? "Saving…" : item ? "Save changes" : "Add post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
