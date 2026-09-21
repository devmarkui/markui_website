/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  moveTopWork,
  removeTopWork,
  saveTopWork,
  type FormState,
} from "@/app/admin/actions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ACCEPT_IMAGE, ACCEPT_MEDIA, ACCEPT_VIDEO } from "@/lib/media";
import type {
  Project,
  Service,
  TopWork,
  TopWorkMediaType,
} from "@/lib/types";

const INITIAL: FormState = {};

/** Older items have no media type saved; infer it the way the site does. */
function inferMediaType(item: TopWork | null): TopWorkMediaType {
  if (!item) return "image";
  if (item.mediaType) return item.mediaType;
  const hasVideo = item.video || item.media.some((m) => m.type === "video");
  return !item.image && hasVideo ? "video" : "image";
}

/** Uploaded files live under /api/uploads; anything else was pasted as a URL. */
function isUploaded(url: string | undefined) {
  return Boolean(url && url.startsWith("/api/uploads/"));
}

/** Just enough of a project to render the picker and previews. */
export type PickableProject = Pick<
  Project,
  "id" | "title" | "category" | "image" | "description"
>;

export default function TopWorkManager({
  services,
  topWork,
  projects,
  initialServiceId,
}: {
  services: Service[];
  topWork: TopWork[];
  projects: PickableProject[];
  initialServiceId?: string;
}) {
  const [filter, setFilter] = useState<string>(
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : "all",
  );
  const [editing, setEditing] = useState<TopWork | { serviceId: string } | null>(
    null,
  );
  const [confirming, setConfirming] = useState<TopWork | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const visibleServices =
    filter === "all" ? services : services.filter((s) => s.id === filter);

  const handleDelete = () => {
    if (!confirming) return;
    const target = confirming;

    startBusy(async () => {
      const formData = new FormData();
      formData.set("id", target.id);
      const result = await removeTopWork({}, formData);

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

  const move = (item: TopWork, direction: "up" | "down") => {
    startBusy(async () => {
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("direction", direction);
      const result = await moveTopWork({}, formData);
      if (result.error) setError(result.error);
    });
  };

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Service Top Work</h1>
          <p className="ad-subtitle">
            The highlighted work shown in the <em>Our Top Work</em> section of
            each service page. Every item belongs to one service, so visitors
            only ever see work related to what they are reading about. Linking
            an existing project is preferred — it avoids duplicating content.
          </p>
        </div>
        {services.length ? (
          <button
            className="ad-btn ad-btn--primary"
            type="button"
            onClick={() => {
              setEditing({
                serviceId: filter === "all" ? services[0].id : filter,
              });
              setFlash(null);
              setError(null);
            }}
          >
            + Add top work
          </button>
        ) : null}
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

      {services.length === 0 ? (
        <div className="ad-empty">
          Create a service first — Top Work always belongs to one.
        </div>
      ) : (
        <>
          <div className="ad-toolbar">
            <button
              type="button"
              className="ad-chip"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All services ({topWork.length})
            </button>
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                className="ad-chip"
                aria-pressed={filter === service.id}
                onClick={() => setFilter(service.id)}
              >
                {service.name} (
                {topWork.filter((w) => w.serviceId === service.id).length})
              </button>
            ))}
          </div>

          {visibleServices.map((service) => {
            const items = topWork
              .filter((w) => w.serviceId === service.id)
              .sort((a, b) => a.order - b.order);

            return (
              <section className="ad-group" key={service.id}>
                <div className="ad-group-head">
                  <h2 className="ad-group-title">{service.name}</h2>
                  <span className="ad-group-count">
                    {items.length}{" "}
                    {items.length === 1 ? "item" : "items"} ·{" "}
                    {items.filter((i) => i.active).length} shown
                  </span>
                  <button
                    type="button"
                    className="ad-btn ad-btn--sm"
                    onClick={() => {
                      setEditing({ serviceId: service.id });
                      setFlash(null);
                      setError(null);
                    }}
                  >
                    + Add
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="ad-group-empty">
                    No Top Work for {service.name} yet — its service page hides
                    the section until you add some.
                  </div>
                ) : (
                  <div className="ad-list">
                    {items.map((item, index) => {
                      const project = item.projectId
                        ? projectsById.get(item.projectId)
                        : undefined;
                      const title = item.title || project?.title || "Untitled";
                      const image = item.image || project?.image || "";
                      const mediaType = inferMediaType(item);
                      const video =
                        item.video ||
                        item.media.find((m) => m.type === "video")?.url;
                      const hasMedia = Boolean(image || video);

                      return (
                        <article className="ad-item" key={item.id}>
                          <div className="ad-thumb">
                            {image ? (
                              <img src={image} alt="" loading="lazy" />
                            ) : video ? (
                              <video
                                src={video}
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <div className="ad-thumb-empty" aria-hidden="true">
                                {title.slice(0, 1)}
                              </div>
                            )}
                          </div>

                          <div className="ad-item-body">
                            <h3 className="ad-item-title">
                              {title}
                              <span
                                className={`ad-status ad-status--${item.active ? "on" : "off"}`}
                              >
                                {item.active ? "Shown" : "Hidden"}
                              </span>
                              {project ? (
                                <span className="ad-badge">
                                  Linked · {project.category}
                                </span>
                              ) : (
                                <span className="ad-badge">Custom</span>
                              )}
                              <span className="ad-badge">
                                {mediaType === "video" ? "Video" : "Image"}
                              </span>
                            </h3>
                            <p className="ad-item-desc">
                              {item.description ||
                                project?.description ||
                                "No description."}
                            </p>
                            <div className="ad-item-meta">
                              {project ? (
                                <span>From project: {project.title}</span>
                              ) : null}
                              {item.media.length ? (
                                <span>{item.media.length} extra files</span>
                              ) : null}
                              {item.link ? <span>Has portfolio URL</span> : null}
                              {!hasMedia ? (
                                <span>No image or video yet — not shown on the site</span>
                              ) : null}
                            </div>
                          </div>

                          <div className="ad-item-actions">
                            <div className="ad-move">
                              <button
                                type="button"
                                aria-label={`Move ${title} up`}
                                disabled={index === 0 || busy}
                                onClick={() => move(item, "up")}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                aria-label={`Move ${title} down`}
                                disabled={index === items.length - 1 || busy}
                                onClick={() => move(item, "down")}
                              >
                                ▼
                              </button>
                            </div>
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
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      {editing ? (
        <TopWorkEditor
          key={"id" in editing ? editing.id : `new-${editing.serviceId}`}
          item={"id" in editing ? editing : null}
          defaultServiceId={editing.serviceId}
          services={services}
          projects={projects}
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
          title="Remove this Top Work?"
          body={
            <>
              It will disappear from that service&rsquo;s{" "}
              <em>Our Top Work</em> section.{" "}
              {confirming.projectId
                ? "The linked project itself is not affected — only this highlight."
                : "Its uploaded files will be deleted."}{" "}
              This cannot be undone.
            </>
          }
          confirmLabel="Remove"
          pending={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function TopWorkEditor({
  item,
  defaultServiceId,
  services,
  projects,
  onClose,
  onSaved,
}: {
  item: TopWork | null;
  defaultServiceId: string;
  services: Service[];
  projects: PickableProject[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveTopWork, INITIAL);
  const [mode, setMode] = useState<"project" | "custom">(
    item?.projectId || !item ? "project" : "custom",
  );
  const [projectId, setProjectId] = useState(item?.projectId ?? "");
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [droppedMedia, setDroppedMedia] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<TopWorkMediaType>(() =>
    inferMediaType(item),
  );
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

  const linked = projects.find((p) => p.id === projectId);
  const currentImage = newImage ?? (removeImage ? null : item?.image || null);
  const uploadedVideo = isUploaded(item?.video) ? item?.video : undefined;
  const currentVideo = newVideo ?? (removeVideo ? null : uploadedVideo || null);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item ? "Edit top work" : "New top work"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="ad-modal">
        <form action={action}>
          <div className="ad-modal-head">
            <h2 className="ad-modal-title">
              {item ? "Edit top work" : "Add top work"}
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
              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="tw-service">
                  Belongs to service
                </label>
                <select
                  id="tw-service"
                  name="serviceId"
                  defaultValue={item?.serviceId ?? defaultServiceId}
                  required
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <p className="ad-hint">
                  This work only appears on the page for the service you pick.
                </p>
              </div>

              <div className="ad-fieldset">Where the content comes from</div>

              <div className="ad-field ad-field--full">
                <div className="ad-toolbar" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className="ad-chip"
                    aria-pressed={mode === "project"}
                    onClick={() => setMode("project")}
                  >
                    Use an existing project
                  </button>
                  <button
                    type="button"
                    className="ad-chip"
                    aria-pressed={mode === "custom"}
                    onClick={() => {
                      setMode("custom");
                      setProjectId("");
                    }}
                  >
                    Enter it manually
                  </button>
                </div>
                <p className="ad-hint">
                  {mode === "project"
                    ? "Recommended — the title, description and image stay in sync with the project."
                    : "Use this for work that is not in your projects list."}
                </p>
              </div>

              {mode === "project" ? (
                <div className="ad-field ad-field--full">
                  <label className="ad-label" htmlFor="tw-project">
                    Project
                  </label>
                  <select
                    id="tw-project"
                    name="projectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">Choose a project…</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title} — {project.category}
                      </option>
                    ))}
                  </select>

                  {linked ? (
                    <div className="ad-linked" style={{ marginTop: 10 }}>
                      <div className="ad-linked-thumb">
                        {linked.image ? (
                          <img src={linked.image} alt="" />
                        ) : (
                          <div className="ad-thumb-empty" aria-hidden="true">
                            {linked.title.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="ad-linked-body">
                        <div className="ad-linked-title">{linked.title}</div>
                        <div className="ad-linked-meta">
                          {linked.category} · content is pulled from this
                          project
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                // Keeps the field present so switching modes clears the link.
                <input type="hidden" name="projectId" value="" />
              )}

              <div className="ad-fieldset">
                {mode === "project" ? "Overrides (optional)" : "Details"}
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="tw-title">
                  Title{" "}
                  {mode === "project" ? (
                    <span>(leave blank to use the project&rsquo;s)</span>
                  ) : null}
                </label>
                <input
                  id="tw-title"
                  name="title"
                  type="text"
                  defaultValue={item?.title ?? ""}
                  placeholder="e.g. ABC Social Media Campaign"
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="tw-description">
                  Description{" "}
                  {mode === "project" ? (
                    <span>(leave blank to use the project&rsquo;s)</span>
                  ) : null}
                </label>
                <textarea
                  id="tw-description"
                  name="description"
                  defaultValue={item?.description ?? ""}
                  placeholder="What the work was, and what it achieved."
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="tw-category">
                  Category{" "}
                  <span>
                    {mode === "project"
                      ? "(leave blank to use the project’s)"
                      : "(optional)"}
                  </span>
                </label>
                <input
                  id="tw-category"
                  name="category"
                  type="text"
                  defaultValue={item?.category ?? ""}
                  placeholder="e.g. Social Media, Branding, Reel"
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="tw-link">
                  Portfolio URL <span>(optional — defaults to the portfolio site in Settings)</span>
                </label>
                <input
                  id="tw-link"
                  name="link"
                  type="url"
                  defaultValue={item?.link ?? ""}
                  placeholder="https://your-portfolio-site.com/project"
                />
              </div>

              <div className="ad-field">
                <span className="ad-label">Visibility</span>
                <label className="ad-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={item ? item.active : true}
                  />
                  Show on the service page
                </label>
              </div>

              <div className="ad-fieldset">Media</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="tw-media-type">
                  Media type
                </label>
                <select
                  id="tw-media-type"
                  name="mediaType"
                  value={mediaType}
                  onChange={(e) =>
                    setMediaType(e.target.value as TopWorkMediaType)
                  }
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <p className="ad-hint">
                  {mediaType === "video"
                    ? "Videos play silently while a visitor hovers over them (and when scrolled into view on phones)."
                    : "Shown as a still thumbnail."}
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
                    htmlFor="tw-video-url"
                    style={{ marginTop: 12 }}
                  >
                    Or video URL <span>(direct link to an MP4 or WebM file)</span>
                  </label>
                  <input
                    id="tw-video-url"
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
                  {mediaType === "video" ? "Poster / thumbnail image" : "Image"}{" "}
                  {mediaType === "video" ? (
                    <span>(shown until the video plays — recommended)</span>
                  ) : mode === "project" ? (
                    <span>(overrides the project&rsquo;s image)</span>
                  ) : null}
                </span>

                {currentImage ? (
                  <div className="ad-preview">
                    <img src={currentImage} alt="Top work preview" />
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

              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  Extra images or videos <span>(optional)</span>
                </span>

                {item?.media.length ? (
                  <div className="ad-media-grid">
                    {item.media.map((media) => {
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

                <input
                  name="media"
                  type="file"
                  accept={ACCEPT_MEDIA}
                  multiple
                />
                <p className="ad-hint">
                  Kept with this work. For a video item with no video set
                  above, the first video here is used.
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
              {pending ? "Saving…" : item ? "Save changes" : "Add top work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
