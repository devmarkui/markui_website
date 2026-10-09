"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { deleteVaultMediaAction } from "@/app/admin/vault-actions";
import { ACCEPT_ALL, formatBytes } from "@/lib/vault/media-types";
import { mediaRefFrom, type MediaKind, type VaultMedia } from "@/lib/vault/types";

import { MediaThumb } from "./MediaPicker";
import { uploadFile } from "./upload";

const KIND_LABELS: Record<MediaKind | "all", string> = {
  all: "All",
  image: "Photos",
  video: "Video",
  pdf: "PDFs",
  file: "Other files",
};

export default function VaultMediaLibrary({
  media: initial,
  usage,
}: {
  media: VaultMedia[];
  usage: { used: number; free: number | null };
}) {
  const router = useRouter();
  const [media, setMedia] = useState(initial);
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<{ name: string; progress: number; error?: string }[]>([]);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const shown = media.filter((m) => (kind === "all" || m.kind === kind) && (!query || m.name.toLowerCase().includes(query.toLowerCase())));
  const lowDisk = usage.free !== null && usage.free < 3 * 1024 ** 3;

  const upload = async (files: File[]) => {
    for (const file of files) {
      setUploads((prev) => [{ name: file.name, progress: 0 }, ...prev]);
      try {
        const item = await uploadFile(file, (p) =>
          setUploads((prev) => prev.map((u) => (u.name === file.name ? { ...u, progress: p } : u))),
        );
        setMedia((prev) => [item, ...prev]);
        setUploads((prev) => prev.filter((u) => u.name !== file.name));
      } catch (error) {
        setUploads((prev) => prev.map((u) => (u.name === file.name ? { ...u, error: (error as Error).message } : u)));
      }
    }
    router.refresh();
  };

  const remove = (item: VaultMedia, force = false) =>
    start(async () => {
      setNotice(null);
      const res = await deleteVaultMediaAction(item.id, force);
      if (res.usedBy?.length) {
        if (window.confirm(`"${item.name}" is used in ${res.usedBy.join(", ")}. Delete it anyway? Those spots will be empty.`)) {
          remove(item, true);
        }
        return;
      }
      if (res.error) setNotice({ kind: "error", text: res.error });
      else {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
        setNotice({ kind: "ok", text: `"${item.name}" was deleted.` });
      }
    });

  return (
    <>
      <div className="ad-stats">
        <div className="ad-stat">
          <div className="ad-stat-value">{media.length}</div>
          <div className="ad-stat-label">Files</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat-value">{formatBytes(usage.used)}</div>
          <div className="ad-stat-label">Used by the Vault</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat-value">{usage.free === null ? "—" : formatBytes(usage.free)}</div>
          <div className="ad-stat-label">Free on the server</div>
        </div>
      </div>
      {lowDisk ? (
        <p className="ad-alert ad-alert--error">
          The server is running low on space. Put long videos on YouTube or Vimeo and big photo sets in Google Drive, and
          link them instead of uploading.
        </p>
      ) : null}
      {notice ? <p className={`ad-alert ad-alert--${notice.kind}`}>{notice.text}</p> : null}

      <div className="ad-toolbar">
        {(Object.keys(KIND_LABELS) as (MediaKind | "all")[]).map((k) => (
          <button key={k} type="button" className="ad-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {KIND_LABELS[k]}
          </button>
        ))}
        <div className="ad-field vx-inline-select">
          <input type="text" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search files" />
        </div>
        <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={() => input.current?.click()}>
          Upload
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ACCEPT_ALL}
          onChange={(e) => {
            upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length ? (
        <ul className="vx-queue">
          {uploads.map((u) => (
            <li key={u.name} data-state={u.error ? "error" : "busy"}>
              <span className="vx-queue-name">{u.name}</span>
              {u.error ? (
                <span className="vx-queue-error">{u.error}</span>
              ) : (
                <span className="vx-bar">
                  <span style={{ width: `${Math.round(u.progress * 100)}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {shown.length === 0 ? (
        <div className="ad-empty">No files{media.length ? " match" : " yet"}.</div>
      ) : (
        <div className="vx-library" aria-busy={pending}>
          {shown.map((m) => (
            <figure key={m.id} className="vx-lib-item">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="vx-lib-thumb">
                <MediaThumb media={mediaRefFrom(m)} />
              </a>
              <figcaption>
                <span className="vx-lib-name" title={m.name}>
                  {m.name}
                </span>
                <span className="vx-lib-meta">
                  {formatBytes(m.bytes)}
                  {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                </span>
                <button type="button" className="vx-linkbtn vx-linkbtn--danger" onClick={() => remove(m)}>
                  Delete
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
