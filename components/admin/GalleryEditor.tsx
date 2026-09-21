/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import { ACCEPT_IMAGE, ACCEPT_VIDEO } from "@/lib/media";
import type { GalleryItem } from "@/lib/types";


interface DraftItem {
  /** Existing item id, or a temporary key for a new one. */
  key: string;
  saved?: GalleryItem;
  type: "image" | "video";
}

let draftCounter = 0;
const newKey = () => `new-${Date.now().toString(36)}-${draftCounter++}`;

/**
 * An ordered list of images and videos — a product's preview or a project's
 * gallery. Each row's fields are posted as `<prefix>.<key>.<field>`, with one
 * `<prefix>Key` per row in display order, so reordering here is just
 * reordering the rows. `readGalleryItems` in the admin actions reads it back.
 */
export default function GalleryEditor({
  prefix,
  items,
  hint,
}: {
  prefix: string;
  items: GalleryItem[];
  hint: string;
}) {
  const [rows, setRows] = useState<DraftItem[]>(() =>
    items.map((item) => ({ key: item.id, saved: item, type: item.type })),
  );

  const move = (index: number, delta: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  };

  return (
    <div className="ad-field ad-field--full">
      <p className="ad-hint" style={{ marginTop: 0 }}>
        {hint} Upload up to about 25MB per save — add large videos one at a
        time, or link them by URL.
      </p>

      {rows.length ? (
        <ol className="ad-pv-list">
          {rows.map((row, index) => (
            <GalleryRow
              key={row.key}
              prefix={prefix}
              row={row}
              index={index}
              count={rows.length}
              onType={(type) =>
                setRows((prev) =>
                  prev.map((r) => (r.key === row.key ? { ...r, type } : r)),
                )
              }
              onMove={(delta) => move(index, delta)}
              onRemove={() =>
                setRows((prev) => prev.filter((r) => r.key !== row.key))
              }
            />
          ))}
        </ol>
      ) : (
        <p className="ad-hint">No media yet.</p>
      )}

      <div className="ad-toolbar" style={{ marginBottom: 0 }}>
        <button
          type="button"
          className="ad-btn ad-btn--sm"
          onClick={() =>
            setRows((prev) => [...prev, { key: newKey(), type: "image" }])
          }
        >
          + Add image
        </button>
        <button
          type="button"
          className="ad-btn ad-btn--sm"
          onClick={() =>
            setRows((prev) => [...prev, { key: newKey(), type: "video" }])
          }
        >
          + Add video
        </button>
      </div>
    </div>
  );
}

function GalleryRow({
  prefix,
  row,
  index,
  count,
  onType,
  onMove,
  onRemove,
}: {
  prefix: string;
  row: DraftItem;
  index: number;
  count: number;
  onType: (type: "image" | "video") => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { key, saved, type } = row;
  const field = (name: string) => `${prefix}.${key}.${name}`;
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);

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

  const uploadedVideo = saved?.video?.startsWith("/api/uploads/")
    ? saved.video
    : undefined;
  const linkedVideo = saved?.video && !uploadedVideo ? saved.video : "";
  const image = newImage ?? (removeImage ? null : saved?.image || null);
  const video = newVideo ?? (removeVideo ? null : uploadedVideo || null);

  return (
    <li className="ad-pv-item">
      <input type="hidden" name={`${prefix}Key`} value={key} />

      <div className="ad-pv-head">
        <span className="ad-pv-num">{String(index + 1).padStart(2, "0")}</span>
        <select
          aria-label="Media type"
          name={field("type")}
          value={type}
          onChange={(e) => onType(e.target.value as "image" | "video")}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        <label className="ad-check" style={{ margin: 0 }}>
          <input
            type="checkbox"
            name={field("active")}
            defaultChecked={saved ? saved.active : true}
          />
          Show
        </label>
        <div className="ad-move" style={{ marginLeft: "auto" }}>
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ▲
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            ▼
          </button>
        </div>
        <button
          type="button"
          className="ad-btn ad-btn--sm ad-btn--danger"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <input
        aria-label="Title"
        name={field("title")}
        type="text"
        defaultValue={saved?.title ?? ""}
        placeholder={
          type === "video" ? "Title, e.g. Product demo" : "Title, e.g. Dashboard"
        }
      />

      <div className="ad-pv-media">
        {type === "video" ? (
          <div className="ad-pv-col">
            <span className="ad-label">Video</span>
            {video ? (
              <div className="ad-preview">
                <video src={video} muted playsInline controls preload="metadata" />
              </div>
            ) : null}
            <input
              name={field("videoFile")}
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
                  name={field("removeVideo")}
                  checked={removeVideo}
                  onChange={(e) => setRemoveVideo(e.target.checked)}
                />
                Remove the current video
              </label>
            ) : null}
            <input
              aria-label="Or video URL"
              name={field("videoUrl")}
              type="url"
              defaultValue={linkedVideo}
              placeholder="Or a direct .mp4 / .webm URL"
            />
          </div>
        ) : null}

        <div className="ad-pv-col">
          <span className="ad-label">
            {type === "video" ? "Poster image (recommended)" : "Image"}
          </span>
          {image ? (
            <div className="ad-preview">
              <img src={image} alt="" />
            </div>
          ) : null}
          <input
            name={field("imageFile")}
            type="file"
            accept={ACCEPT_IMAGE}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (newImage) URL.revokeObjectURL(newImage);
              setNewImage(file ? URL.createObjectURL(file) : null);
              if (file) setRemoveImage(false);
            }}
          />
          {type === "video" && saved?.image && !newImage ? (
            <label className="ad-check">
              <input
                type="checkbox"
                name={field("removeImage")}
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
              />
              Remove the current poster
            </label>
          ) : null}
        </div>
      </div>
    </li>
  );
}
