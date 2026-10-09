"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteVaultProjectAction,
  duplicateVaultProjectAction,
  moveVaultProjectAction,
  setVaultProjectStatusAction,
} from "@/app/admin/vault-actions";
import { vaultUrl } from "@/lib/vault/links";
import { STATUS_LABELS, VAULT_STATUSES, type MediaRef, type VaultStatus } from "@/lib/vault/types";

import { MediaThumb } from "./MediaPicker";

export interface ListRow {
  id: string;
  slug: string;
  title: string;
  client: string;
  service: string;
  serviceId: string;
  status: VaultStatus;
  featured: boolean;
  sections: number;
  updatedAt: string;
  cover: MediaRef | null;
  linkedFrom?: string;
}

export default function VaultProjectList({
  rows,
  services,
  vaultOrigin,
}: {
  rows: ListRow[];
  services: { id: string; name: string }[];
  vaultOrigin: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<VaultStatus | "all">("all");
  const [service, setService] = useState("all");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const shown = rows.filter((r) => (status === "all" || r.status === status) && (service === "all" || r.serviceId === service));
  const filtered = status !== "all" || service !== "all";

  const run = (fn: () => Promise<{ error?: string; id?: string }>, then?: (id?: string) => void) =>
    start(async () => {
      setError("");
      const res = await fn();
      if (res.error) setError(res.error);
      else {
        then?.(res.id);
        router.refresh();
      }
    });

  return (
    <>
      <div className="ad-toolbar">
        {(["all", ...VAULT_STATUSES] as const).map((s) => (
          <button key={s} type="button" className="ad-chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {s === "all" ? "All" : STATUS_LABELS[s]} ({s === "all" ? rows.length : rows.filter((r) => r.status === s).length})
          </button>
        ))}
        <div className="ad-field vx-inline-select">
          <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Filter by service">
            <option value="all">Every service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="ad-alert ad-alert--error">{error}</p> : null}

      {rows.length === 0 ? (
        <div className="ad-empty">
          The Vault is empty. <Link href="/admin/vault/new">Create the first project</Link>.
        </div>
      ) : shown.length === 0 ? (
        <div className="ad-empty">No projects match these filters.</div>
      ) : (
        <ul className="ad-list" aria-busy={pending}>
          {shown.map((row, i) => (
            <li className="ad-item vx-row-item" key={row.id}>
              <Link href={`/admin/vault/${row.id}`} className="ad-thumb" aria-label={`Edit ${row.title}`}>
                {row.cover ? <MediaThumb media={row.cover} /> : <span className="ad-thumb-empty">{row.title.charAt(0)}</span>}
              </Link>
              <div className="ad-item-body">
                <div className="ad-item-title">
                  <Link href={`/admin/vault/${row.id}`}>{row.title}</Link>
                  <span className={`vx-pill vx-pill--${row.status}`}>{STATUS_LABELS[row.status]}</span>
                  {row.featured ? <span className="ad-badge">Featured</span> : null}
                </div>
                <div className="ad-item-meta">
                  {row.client ? <span>{row.client}</span> : null}
                  {row.service ? <span>{row.service}</span> : null}
                  <span>
                    {row.sections} section{row.sections === 1 ? "" : "s"}
                  </span>
                  <span>/{row.slug}</span>
                  {row.linkedFrom ? <span>On markui.lk: {row.linkedFrom}</span> : null}
                  <span>Updated {new Date(row.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="ad-item-actions">
                {!filtered ? (
                  <span className="ad-move">
                    <button
                      type="button"
                      className="vx-icon"
                      aria-label="Move up"
                      disabled={i === 0 || pending}
                      onClick={() => run(() => moveVaultProjectAction(row.id, "up"))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="vx-icon"
                      aria-label="Move down"
                      disabled={i === shown.length - 1 || pending}
                      onClick={() => run(() => moveVaultProjectAction(row.id, "down"))}
                    >
                      ↓
                    </button>
                  </span>
                ) : null}
                <div className="ad-field vx-inline-select">
                  <select
                    value={row.status}
                    aria-label="Visibility"
                    onChange={(e) => run(() => setVaultProjectStatusAction(row.id, e.target.value as VaultStatus))}
                  >
                    {VAULT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <Link className="ad-btn ad-btn--sm" href={`/admin/vault/${row.id}`}>
                  Edit
                </Link>
                {row.status !== "draft" ? (
                  <a className="ad-btn ad-btn--sm" href={vaultUrl(vaultOrigin, row.slug)} target="_blank" rel="noopener noreferrer">
                    View ↗
                  </a>
                ) : null}
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  disabled={pending}
                  onClick={() => run(() => duplicateVaultProjectAction(row.id), (id) => id && router.push(`/admin/vault/${id}`))}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm ad-btn--danger"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Delete "${row.title}" from the Vault? This can't be undone.`)) {
                      run(() => deleteVaultProjectAction(row.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
