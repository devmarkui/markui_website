"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { listVaultMediaAction } from "@/app/admin/vault-actions";
import { ACCEPT_ALL, ACCEPT_IMAGES, ACCEPT_VIDEOS, extensionOf, fileTypeOf, formatBytes } from "@/lib/vault/media-types";
import { mediaRefFrom, type MediaKind, type MediaRef, type VaultMedia } from "@/lib/vault/types";

import { uploadFile } from "./upload";

/**
 * The one place media is chosen in the Vault editor: pick from the library,
 * upload new files (any format, with progress) or paste a link. Sections ask
 * for it through `useMediaPicker()`.
 */

export type Accept = "image" | "video" | "visual" | "pdf" | "any";

interface PickRequest {
  accept: Accept;
  multiple?: boolean;
  title?: string;
  onPick: (refs: MediaRef[]) => void;
}

const PickerContext = createContext<{
  open: (request: PickRequest) => void;
  library: VaultMedia[] | null;
  addToLibrary: (media: VaultMedia) => void;
} | null>(null);

export function useMediaPicker() {
  const ctx = useContext(PickerContext);
  if (!ctx) throw new Error("useMediaPicker needs a <MediaPickerProvider>.");
  return ctx;
}

function allows(accept: Accept, kind: MediaKind) {
  if (accept === "any") return true;
  if (accept === "visual") return kind === "image" || kind === "video";
  return accept === kind;
}

const ACCEPT_ATTR: Record<Accept, string> = {
  image: ACCEPT_IMAGES,
  video: ACCEPT_VIDEOS,
  visual: `${ACCEPT_IMAGES},${ACCEPT_VIDEOS}`,
  pdf: ".pdf",
  any: ACCEPT_ALL,
};

export function thumbOf(ref: Pick<MediaRef, "kind" | "url" | "thumb" | "poster" | "display">): string | null {
  if (ref.thumb) return ref.thumb;
  if (ref.kind === "video") return ref.poster ?? null;
  if (ref.kind === "image") return ref.display ?? ref.url;
  return null;
}

export function MediaThumb({ media, className }: { media: Pick<MediaRef, "kind" | "url" | "thumb" | "poster" | "display" | "name">; className?: string }) {
  const src = thumbOf(media);
  const ext = extensionOf(media.name ?? media.url).replace(".", "") || media.kind;
  return (
    <span className={className ? `vx-thumb ${className}` : "vx-thumb"} data-kind={media.kind}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" />
      ) : (
        <span className="vx-thumb-ext">{ext}</span>
      )}
      {media.kind === "video" ? <span className="vx-thumb-play" aria-hidden="true">▶</span> : null}
    </span>
  );
}

interface QueueItem {
  key: string;
  name: string;
  size: number;
  progress: number;
  error?: string;
  done?: VaultMedia;
}

export function MediaPickerProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PickRequest | null>(null);
  const [library, setLibrary] = useState<VaultMedia[] | null>(null);

  const open = useCallback((req: PickRequest) => setRequest(req), []);
  const addToLibrary = useCallback(
    (media: VaultMedia) => setLibrary((prev) => (prev ? [media, ...prev.filter((m) => m.id !== media.id)] : [media])),
    [],
  );

  useEffect(() => {
    if (request && library === null) {
      listVaultMediaAction().then(setLibrary, () => setLibrary([]));
    }
  }, [request, library]);

  const value = useMemo(() => ({ open, library, addToLibrary }), [open, library, addToLibrary]);

  return (
    <PickerContext.Provider value={value}>
      {children}
      {request ? (
        <PickerModal
          request={request}
          library={library}
          onUploaded={addToLibrary}
          onClose={() => setRequest(null)}
        />
      ) : null}
    </PickerContext.Provider>
  );
}

function PickerModal({
  request,
  library,
  onUploaded,
  onClose,
}: {
  request: PickRequest;
  library: VaultMedia[] | null;
  onUploaded: (media: VaultMedia) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"library" | "upload" | "link">(library && library.length === 0 ? "upload" : "library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const choices = (library ?? []).filter(
    (m) => allows(request.accept, m.kind) && (!query || m.name.toLowerCase().includes(query.toLowerCase())),
  );

  const finish = (media: VaultMedia[]) => {
    if (!media.length) return;
    request.onPick(media.map(mediaRefFrom));
    onClose();
  };

  const toggle = (m: VaultMedia) => {
    if (!request.multiple) return finish([m]);
    setSelected((prev) => (prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]));
  };

  const startUploads = async (files: File[]) => {
    const usable = files.filter((f) => {
      const type = fileTypeOf(f.name);
      return type && allows(request.accept, type.kind);
    });
    const skipped = files.length - usable.length;
    const items: QueueItem[] = usable.map((f, i) => ({
      key: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      size: f.size,
      progress: 0,
    }));
    setQueue((prev) => [
      ...items,
      ...(skipped
        ? [{ key: `skip-${Date.now()}`, name: `${skipped} file(s) skipped`, size: 0, progress: 0, error: "Not a type this slot takes." }]
        : []),
      ...prev,
    ]);
    const uploaded: VaultMedia[] = [];
    // One at a time: the server processes photos one by one anyway.
    for (const [i, file] of usable.entries()) {
      const key = items[i].key;
      try {
        const media = await uploadFile(file, (p) =>
          setQueue((prev) => prev.map((q) => (q.key === key ? { ...q, progress: p } : q))),
        );
        uploaded.push(media);
        onUploaded(media);
        setQueue((prev) => prev.map((q) => (q.key === key ? { ...q, progress: 1, done: media } : q)));
      } catch (error) {
        setQueue((prev) => prev.map((q) => (q.key === key ? { ...q, error: (error as Error).message } : q)));
      }
    }
    if (uploaded.length) {
      if (request.multiple) setSelected((prev) => [...prev, ...uploaded.map((m) => m.id)]);
      else finish([uploaded[0]]);
    }
  };

  const addLink = () => {
    const raw = link.trim();
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      setLinkError("That isn't a full link. It should start with https://");
      return;
    }
    if (url.protocol !== "https:") {
      setLinkError("Use an https:// link.");
      return;
    }
    const type = fileTypeOf(url.pathname);
    const kind: MediaKind = type?.kind ?? "image";
    if (!allows(request.accept, kind)) {
      setLinkError("That link isn't the kind of file this slot takes.");
      return;
    }
    request.onPick([{ url: url.toString(), kind, name: url.pathname.split("/").pop() || url.hostname }]);
    onClose();
  };

  const selectedMedia = (library ?? []).filter((m) => selected.includes(m.id));

  return (
    <div className="ad-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal vx-picker" role="dialog" aria-modal="true" aria-label={request.title ?? "Choose media"}>
        <div className="ad-modal-head">
          <h2 className="ad-modal-title">{request.title ?? "Choose media"}</h2>
          <button type="button" className="ad-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="vx-tabs" role="tablist">
          {(["library", "upload", "link"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className="vx-tab"
              onClick={() => setTab(t)}
            >
              {t === "library" ? "Library" : t === "upload" ? "Upload" : "Link"}
            </button>
          ))}
        </div>

        <div className="ad-modal-body vx-picker-body">
          {tab === "library" ? (
            <>
              <div className="ad-field">
                <input
                  type="text"
                  placeholder="Search by file name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search the library"
                />
              </div>
              {library === null ? (
                <p className="ad-hint vx-pad">Loading the library…</p>
              ) : choices.length === 0 ? (
                <div className="ad-empty vx-pad">
                  Nothing here yet.{" "}
                  <button type="button" className="vx-linkbtn" onClick={() => setTab("upload")}>
                    Upload files
                  </button>
                </div>
              ) : (
                <div className="vx-grid">
                  {choices.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="vx-pick"
                      aria-pressed={selected.includes(m.id)}
                      onClick={() => toggle(m)}
                      title={m.name}
                    >
                      <MediaThumb media={mediaRefFrom(m)} />
                      <span className="vx-pick-name">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {tab === "upload" ? (
            <>
              <div
                className="vx-drop"
                data-dragging={dragging || undefined}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  startUploads(Array.from(e.dataTransfer.files));
                }}
              >
                <p className="vx-drop-title">Drop files here</p>
                <p className="ad-hint">
                  {request.accept === "image"
                    ? "Photos: JPG, PNG, WebP, GIF, AVIF, SVG, HEIC or TIFF."
                    : request.accept === "video"
                      ? "Video: MP4, MOV, WebM or M4V. Long films are better on YouTube or Vimeo, linked."
                      : request.accept === "pdf"
                        ? "A PDF."
                        : "Photos, video, PDFs, RAW, PSD/AI, ZIP and Office files, up to the server's size limit."}
                </p>
                <button type="button" className="ad-btn ad-btn--sm" onClick={() => inputRef.current?.click()}>
                  Choose files
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  multiple={request.multiple}
                  accept={ACCEPT_ATTR[request.accept]}
                  onChange={(e) => {
                    startUploads(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </div>
              {queue.length ? (
                <ul className="vx-queue">
                  {queue.map((q) => (
                    <li key={q.key} data-state={q.error ? "error" : q.done ? "done" : "busy"}>
                      <span className="vx-queue-name">{q.name}</span>
                      {q.size ? <span className="vx-queue-size">{formatBytes(q.size)}</span> : null}
                      {q.error ? (
                        <span className="vx-queue-error">{q.error}</span>
                      ) : (
                        <span className="vx-bar">
                          <span style={{ width: `${Math.round(q.progress * 100)}%` }} />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {tab === "link" ? (
            <div className="ad-field">
              <label className="ad-label" htmlFor="vx-link">
                File link <span>(an https:// image, video or PDF address)</span>
              </label>
              <input
                id="vx-link"
                type="url"
                value={link}
                placeholder="https://…/poster.jpg"
                onChange={(e) => {
                  setLink(e.target.value);
                  setLinkError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
              />
              {linkError ? <p className="vx-error">{linkError}</p> : null}
              <p className="ad-hint">
                For Google Drive photo folders use a Gallery section instead; for YouTube, Instagram or Facebook
                videos use a Videos section.
              </p>
            </div>
          ) : null}
        </div>

        <div className="ad-modal-foot">
          {tab === "link" ? (
            <button type="button" className="ad-btn ad-btn--primary" onClick={addLink} disabled={!link.trim()}>
              Use link
            </button>
          ) : request.multiple ? (
            <button
              type="button"
              className="ad-btn ad-btn--primary"
              disabled={!selectedMedia.length}
              onClick={() => finish(selectedMedia)}
            >
              Add {selectedMedia.length || ""} {selectedMedia.length === 1 ? "file" : "files"}
            </button>
          ) : (
            <button type="button" className="ad-btn" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** One media slot: a preview with Choose / Replace / Remove. */
export function MediaSlot({
  label,
  hint,
  value,
  accept,
  onChange,
}: {
  label: string;
  hint?: string;
  value: MediaRef | null;
  accept: Accept;
  onChange: (ref: MediaRef | null) => void;
}) {
  const { open } = useMediaPicker();
  return (
    <div className="ad-field vx-slot">
      <span className="ad-label">
        {label} {hint ? <span>({hint})</span> : null}
      </span>
      <div className="vx-slot-row">
        {value ? <MediaThumb media={value} className="vx-thumb--lg" /> : <span className="vx-thumb vx-thumb--lg vx-thumb--empty">+</span>}
        <div className="vx-slot-actions">
          {value ? <span className="vx-slot-name">{value.name ?? value.url.split("/").pop()}</span> : null}
          <div className="vx-row">
            <button
              type="button"
              className="ad-btn ad-btn--sm"
              onClick={() => open({ accept, title: label, onPick: ([ref]) => onChange(ref) })}
            >
              {value ? "Replace" : "Choose"}
            </button>
            {value ? (
              <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => onChange(null)}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
