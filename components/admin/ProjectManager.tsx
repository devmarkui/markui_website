/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  moveProject,
  removeProject,
  saveProject,
  type FormState,
} from "@/app/admin/actions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import GalleryEditor from "@/components/admin/GalleryEditor";
import { ACCEPT_IMAGE, ACCEPT_VIDEO } from "@/lib/media";
import {
  PROJECT_CATEGORIES,
  type Project,
  type ProjectFilter,
  type Service,
} from "@/lib/types";

const INITIAL: FormState = {};
const FILTERS: ProjectFilter[] = ["All", ...PROJECT_CATEGORIES];

export default function ProjectManager({
  projects,
  services,
}: {
  projects: Project[];
  services: Service[];
}) {
  const [filter, setFilter] = useState<ProjectFilter>("All");
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const [confirming, setConfirming] = useState<Project | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const [moving, startMove] = useTransition();

  const move = (project: Project, direction: "up" | "down") => {
    startMove(async () => {
      const formData = new FormData();
      formData.set("id", project.id);
      formData.set("direction", direction);
      const result = await moveProject({}, formData);
      if (result.error) setError(result.error);
    });
  };

  const visible =
    filter === "All"
      ? projects
      : projects.filter((p) => p.category === filter);

  const handleDelete = () => {
    if (!confirming) return;
    const target = confirming;

    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", target.id);
      const result = await removeProject({}, formData);

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
          <h1 className="ad-title">Projects</h1>
          <p className="ad-subtitle">
            Your client work, shown on the Projects page in this order (and in
            the home page&rsquo;s <em>Our Projects</em> section). Adding,
            editing, hiding or reordering a project updates the website
            straight away. Projects without a cover image or video are left
            off the Projects page.
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
          + New project
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
        {FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            className="ad-chip"
            aria-pressed={filter === cat}
            onClick={() => setFilter(cat)}
          >
            {cat}
            {cat !== "All"
              ? ` (${projects.filter((p) => p.category === cat).length})`
              : ` (${projects.length})`}
          </button>
        ))}
        <span className="ad-count">
          {visible.length} {visible.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="ad-empty">
          No projects in this category yet. Use <strong>+ New project</strong>{" "}
          to add one.
        </div>
      ) : (
        <div className="ad-list">
          {visible.map((project) => {
            const index = projects.indexOf(project);
            const hasCover = Boolean(
              project.image ||
                (project.coverType === "video" && project.coverVideo),
            );
            return (
            <article className="ad-item" key={project.id}>
              <div className="ad-thumb">
                {project.image ? (
                  <img src={project.image} alt="" loading="lazy" />
                ) : (
                  <div className="ad-thumb-empty" aria-hidden="true">
                    {project.title.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="ad-item-body">
                <h2 className="ad-item-title">
                  {project.title}
                  <span className="ad-badge">{project.category}</span>
                  {project.active === false ? (
                    <span className="ad-status ad-status--off">Hidden</span>
                  ) : null}
                  {project.featured ? (
                    <span className="ad-badge">Featured</span>
                  ) : null}
                  {project.coverType === "video" ? (
                    <span className="ad-badge">Video cover</span>
                  ) : null}
                </h2>
                <p className="ad-item-desc">{project.description}</p>
                <div className="ad-item-meta">
                  {project.industry ? <span>{project.industry}</span> : null}
                  {project.date ? <span>{project.date}</span> : null}
                  {project.client ? <span>{project.client}</span> : null}
                  <span>
                    {project.gallery?.length ?? project.media.length} gallery{" "}
                    {(project.gallery?.length ?? project.media.length) === 1
                      ? "item"
                      : "items"}
                  </span>
                  {!hasCover ? (
                    <span>⚠ no cover — not shown on the Projects page</span>
                  ) : null}
                  {project.link ? <span>Has website</span> : null}
                  {project.portfolioUrl ? <span>Has portfolio URL</span> : null}
                </div>
              </div>

              <div className="ad-item-actions">
                <div className="ad-move">
                  <button
                    type="button"
                    aria-label={`Move ${project.title} up`}
                    title={filter === "All" ? undefined : "Show all projects to reorder"}
                    disabled={filter !== "All" || index === 0 || moving}
                    onClick={() => move(project, "up")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${project.title} down`}
                    title={filter === "All" ? undefined : "Show all projects to reorder"}
                    disabled={
                      filter !== "All" || index === projects.length - 1 || moving
                    }
                    onClick={() => move(project, "down")}
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  onClick={() => {
                    setEditing(project);
                    setFlash(null);
                    setError(null);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm ad-btn--danger"
                  onClick={() => setConfirming(project)}
                >
                  Delete
                </button>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {editing ? (
        <ProjectEditor
          key={editing === "new" ? "new" : editing.id}
          project={editing === "new" ? null : editing}
          services={services}
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
          title="Delete this project?"
          body={
            <>
              <strong>{confirming.title}</strong> will be permanently removed
              from the database and will disappear from the public website.
              This cannot be undone.
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

function ProjectEditor({
  project,
  services,
  onClose,
  onSaved,
}: {
  project: Project | null;
  services: Service[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveProject, INITIAL);
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [droppedMedia, setDroppedMedia] = useState<string[]>([]);
  const [coverType, setCoverType] = useState<"image" | "video">(
    project?.coverType ?? "image",
  );
  const [removeVideo, setRemoveVideo] = useState(false);
  const [newVideo, setNewVideo] = useState<string | null>(null);
  const savedRef = useRef(false);

  // The action reports success once; close the editor and let the parent show
  // the confirmation message.
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

  // Revoke the object URL used for the local preview.
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

  const currentImage = newImage ?? (removeImage ? null : project?.image || null);
  const uploadedVideo = project?.coverVideo?.startsWith("/api/uploads/")
    ? project.coverVideo
    : undefined;
  const linkedVideo =
    project?.coverVideo && !uploadedVideo ? project.coverVideo : "";
  const currentVideo =
    newVideo ?? (removeVideo ? null : uploadedVideo || null);

  return (
    <div
      className="ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={project ? "Edit project" : "New project"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="ad-modal">
        <form action={action}>
          <div className="ad-modal-head">
            <h2 className="ad-modal-title">
              {project ? `Edit — ${project.title}` : "New project"}
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

            {project ? <input type="hidden" name="id" value={project.id} /> : null}

            <div className="ad-grid">
              <div className="ad-fieldset">Basics</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-title">
                  Project name
                </label>
                <input
                  id="pr-title"
                  name="title"
                  type="text"
                  defaultValue={project?.title ?? ""}
                  placeholder="e.g. ATLAS"
                  required
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-category">
                  Category
                </label>
                <select
                  id="pr-category"
                  name="category"
                  defaultValue={project?.category ?? "Web"}
                  required
                >
                  {PROJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="ad-hint">
                  Decides which filter the project appears under.
                </p>
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-client">
                  Client <span>(optional)</span>
                </label>
                <input
                  id="pr-client"
                  name="client"
                  type="text"
                  defaultValue={project?.client ?? ""}
                  placeholder="e.g. Atlas Hotels"
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-description">
                  Short description <span>(shown on project cards)</span>
                </label>
                <textarea
                  id="pr-description"
                  name="description"
                  defaultValue={project?.description ?? ""}
                  placeholder="One or two sentences on the work."
                  required
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-full">
                  About the project <span>(detail page — optional)</span>
                </label>
                <textarea
                  id="pr-full"
                  name="fullDescription"
                  defaultValue={project?.fullDescription ?? ""}
                  placeholder="The brief, the approach, and how the work came together."
                  style={{ minHeight: 120 }}
                />
                <p className="ad-hint">
                  Leave blank to reuse the short description. Blank lines start
                  a new paragraph.
                </p>
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-outcome">
                  Outcome / result <span>(optional)</span>
                </label>
                <textarea
                  id="pr-outcome"
                  name="outcome"
                  defaultValue={project?.outcome ?? ""}
                  placeholder="e.g. 3× more enquiries in the first quarter after launch."
                />
              </div>

              <div className="ad-fieldset">What we did</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-deliverables">
                  Work delivered <span>(one per line)</span>
                </label>
                <textarea
                  id="pr-deliverables"
                  name="deliverables"
                  defaultValue={(project?.deliverables ?? []).join("\n")}
                  placeholder={"Strategy\nDesign\nDevelopment"}
                />
              </div>

              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  Services <span>(optional — links to the service pages)</span>
                </span>
                {services.length ? (
                  <div className="ad-check-grid">
                    {services.map((service) => (
                      <label className="ad-check" key={service.id}>
                        <input
                          type="checkbox"
                          name="serviceIds"
                          value={service.id}
                          defaultChecked={project?.serviceIds?.includes(
                            service.id,
                          )}
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="ad-hint">No services yet.</p>
                )}
                <p className="ad-hint">
                  To show this project in a service&rsquo;s <em>Our Top
                  Work</em>, add it under Service Top Work and pick this
                  project — its content is reused, not copied.
                </p>
              </div>

              <div className="ad-fieldset">Links &amp; display</div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-link">
                  Project website <span>(optional)</span>
                </label>
                <input
                  id="pr-link"
                  name="link"
                  type="url"
                  defaultValue={project?.link ?? ""}
                  placeholder="https://client-site.com"
                />
                <p className="ad-hint">Shown as &ldquo;Visit website&rdquo;.</p>
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-portfolio">
                  Portfolio URL <span>(optional)</span>
                </label>
                <input
                  id="pr-portfolio"
                  name="portfolioUrl"
                  type="url"
                  defaultValue={project?.portfolioUrl ?? ""}
                  placeholder="https://your-portfolio-site.com/project"
                />
                <p className="ad-hint">
                  This project&rsquo;s page on the separate portfolio site.
                </p>
              </div>

              <div className="ad-field">
                <span className="ad-label">Visibility</span>
                <label className="ad-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={project ? project.active !== false : true}
                  />
                  Show on the website
                </label>
                <label className="ad-check">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={project?.featured ?? false}
                  />
                  Featured — pin near the top of the Projects page
                </label>
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-date">
                  Project date <span>(optional)</span>
                </label>
                <input
                  id="pr-date"
                  name="date"
                  type="date"
                  defaultValue={project?.date ?? ""}
                />
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-size">
                  Card size <span>(home page grid)</span>
                </label>
                <select
                  id="pr-size"
                  name="size"
                  defaultValue={project?.size ?? "small"}
                >
                  <option value="small">Standard</option>
                  <option value="large">Large</option>
                </select>
                <p className="ad-hint">
                  Also makes the card taller on the Projects page.
                </p>
              </div>

              <div className="ad-field">
                <label className="ad-label" htmlFor="pr-industry">
                  Industry <span>(optional)</span>
                </label>
                <input
                  id="pr-industry"
                  name="industry"
                  type="text"
                  defaultValue={project?.industry ?? ""}
                  placeholder="e.g. Hospitality"
                />
              </div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-tag">
                  Card caption <span>(home page — optional)</span>
                </label>
                <input
                  id="pr-tag"
                  name="tag"
                  type="text"
                  defaultValue={project?.tag ?? ""}
                  placeholder="e.g. / brand identity"
                />
              </div>

              <div className="ad-fieldset">Cover</div>

              <div className="ad-field ad-field--full">
                <label className="ad-label" htmlFor="pr-cover-type">
                  Cover type
                </label>
                <select
                  id="pr-cover-type"
                  name="coverType"
                  value={coverType}
                  onChange={(e) =>
                    setCoverType(e.target.value as "image" | "video")
                  }
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <p className="ad-hint">
                  {coverType === "video"
                    ? "The video plays silently while a visitor hovers over the card (tap to preview on phones)."
                    : "Shown on the project card and at the top of the project page."}
                </p>
              </div>

              {coverType === "video" ? (
                <div className="ad-field ad-field--full">
                  <span className="ad-label">Cover video</span>
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
                    name="coverVideoFile"
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
                        name="removeCoverVideo"
                        checked={removeVideo}
                        onChange={(e) => setRemoveVideo(e.target.checked)}
                      />
                      Remove the current video
                    </label>
                  ) : null}
                  <label
                    className="ad-label"
                    htmlFor="pr-cover-video-url"
                    style={{ marginTop: 12 }}
                  >
                    Or video URL <span>(direct link to an MP4 or WebM file)</span>
                  </label>
                  <input
                    id="pr-cover-video-url"
                    name="coverVideoUrl"
                    type="url"
                    defaultValue={linkedVideo}
                    placeholder="https://cdn.example.com/reel.mp4"
                  />
                </div>
              ) : null}

              {/* ── Thumbnail ── */}
              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  {coverType === "video"
                    ? "Poster image (recommended — shown until the video plays)"
                    : "Cover image"}
                </span>

                {currentImage ? (
                  <div className="ad-preview">
                    <img src={currentImage} alt="Project thumbnail preview" />
                  </div>
                ) : (
                  <p className="ad-hint">
                    No image yet.
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
                  JPG, PNG, WEBP, GIF or AVIF, up to 25MB.{" "}
                  {project?.image
                    ? "Choosing a file replaces the current image."
                    : ""}
                </p>

                {project?.image && !newImage ? (
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

              <div className="ad-fieldset">Project gallery</div>

              <GalleryEditor
                prefix="gallery"
                items={project?.gallery ?? []}
                hint="Images and videos for the project page, shown in this order. Images open larger when clicked; videos play with controls."
              />

              {project?.media.length ? (
              <div className="ad-field ad-field--full">
                <span className="ad-label">
                  Older extra files{" "}
                  <span>(shown only while the gallery above is empty)</span>
                </span>

                {project?.media.length ? (
                  <div className="ad-media-grid">
                    {project.media.map((item) => {
                      const dropped = droppedMedia.includes(item.url);
                      return (
                        <div
                          className="ad-media"
                          key={item.url}
                          data-removed={dropped}
                        >
                          {item.type === "video" ? (
                            <video src={item.url} muted playsInline />
                          ) : (
                            <img src={item.url} alt={item.name ?? ""} />
                          )}
                          <span className="ad-media-kind">{item.type}</span>
                          <button
                            type="button"
                            className="ad-media-toggle"
                            aria-label={
                              dropped
                                ? `Keep ${item.name ?? "file"}`
                                : `Remove ${item.name ?? "file"}`
                            }
                            onClick={() =>
                              setDroppedMedia((prev) =>
                                dropped
                                  ? prev.filter((u) => u !== item.url)
                                  : [...prev, item.url],
                              )
                            }
                          >
                            {dropped ? "↺" : "×"}
                          </button>
                          {dropped ? (
                            <input
                              type="hidden"
                              name="removeMedia"
                              value={item.url}
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
              {pending
                ? "Saving…"
                : project
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
