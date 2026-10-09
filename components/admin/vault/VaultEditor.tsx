"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  deleteVaultProjectAction,
  linkMainProjectAction,
  previewUrlAction,
  saveVaultProjectAction,
} from "@/app/admin/vault-actions";
import { slugify } from "@/lib/slug";
import { BLOCK_INFO, cloneBlock, createBlock } from "@/lib/vault/blocks";
import { RESERVED_SLUGS, SLUG_PATTERN, vaultUrl } from "@/lib/vault/links";
import {
  BLOCK_TYPES,
  STATUS_LABELS,
  VAULT_STATUSES,
  type BlockType,
  type VaultAlbum,
  type VaultBlock,
  type VaultProject,
  type VaultStatus,
} from "@/lib/vault/types";

import { BlockForm, CommonFields, summarize } from "./BlockForms";
import { Area, Choice, Items, Text } from "./fields";
import { MediaPickerProvider, MediaSlot } from "./MediaPicker";

interface Option {
  id: string;
  name: string;
}

const STATUS_HELP: Record<VaultStatus, string> = {
  draft: "Only you can see it, through a preview link.",
  unlisted: "Anyone with the link can open it; it isn't listed in the Vault or shown to search engines.",
  published: "Listed in the Vault for everyone.",
};

export default function VaultEditor(props: {
  initial: VaultProject;
  albums: Record<string, VaultAlbum>;
  services: Option[];
  mainProjects: (Option & { vaultProjectId?: string })[];
  vaultOrigin: string;
}) {
  return (
    <MediaPickerProvider>
      <Editor {...props} />
    </MediaPickerProvider>
  );
}

function Editor({
  initial,
  albums: initialAlbums,
  services,
  mainProjects,
  vaultOrigin,
}: {
  initial: VaultProject;
  albums: Record<string, VaultAlbum>;
  services: Option[];
  mainProjects: (Option & { vaultProjectId?: string })[];
  vaultOrigin: string;
}) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [albums, setAlbums] = useState(initialAlbums);
  const [open, setOpen] = useState<Set<string>>(() => new Set(initial.blocks.length <= 3 ? initial.blocks.map((b) => b.id) : []));
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [linked, setLinked] = useState(() => mainProjects.find((p) => p.vaultProjectId === initial.id)?.id ?? "");
  const dirty = JSON.stringify(project) !== JSON.stringify(saved);
  const saveRef = useRef<() => void>(() => undefined);

  const patch = (next: Partial<VaultProject>) => setProject((p) => ({ ...p, ...next }));
  const setBlock = (next: VaultBlock) =>
    setProject((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === next.id ? next : b)) }));
  const setBlocks = (blocks: VaultBlock[]) => setProject((p) => ({ ...p, blocks }));

  const save = useCallback(() => {
    startSave(async () => {
      setNotice(null);
      const res = await saveVaultProjectAction(project.id, project);
      if (res.error || !res.project) {
        setNotice({ kind: "error", text: res.error ?? "The project couldn't be saved." });
        return;
      }
      setProject(res.project);
      setSaved(res.project);
      if (res.albums) setAlbums(res.albums);
      setNotice({ kind: "ok", text: "Saved." });
      router.refresh();
    });
  }, [project, router]);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const slugProblem = !SLUG_PATTERN.test(project.slug)
    ? "Use lowercase letters, numbers and single hyphens."
    : RESERVED_SLUGS.has(project.slug)
      ? "That word is reserved; pick another."
      : "";

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= project.blocks.length) return;
    const blocks = [...project.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    setBlocks(blocks);
  };

  const add = (type: BlockType) => {
    const block = createBlock(type);
    setBlocks([...project.blocks, block]);
    setOpen((prev) => new Set(prev).add(block.id));
    setAdding(false);
    requestAnimationFrame(() => document.getElementById(`vx-block-${block.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const preview = async () => {
    // Open the tab first so pop-up blockers allow it, then point it at the link.
    const tab = window.open("", "_blank");
    const res = await previewUrlAction(project.id);
    if (res.url && tab) tab.location.href = res.url;
    else tab?.close();
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${saved.title}" from the Vault? This can't be undone.`)) return;
    const res = await deleteVaultProjectAction(project.id);
    if (res.error) setNotice({ kind: "error", text: res.error });
    else router.push("/admin/vault");
  };

  const relink = async (mainId: string) => {
    setLinked(mainId);
    const res = await linkMainProjectAction(project.id, mainId || null);
    setNotice(res.error ? { kind: "error", text: res.error } : { kind: "ok", text: mainId ? "Linked on markui.lk." : "Unlinked." });
  };

  const liveUrl = vaultUrl(vaultOrigin, saved.slug);

  return (
    <div className="vx-editor">
      <div className="vx-editor-main">
        <section className="ad-panel">
          <h2 className="ad-panel-title">Project</h2>
          <div className="ad-grid">
            <Text label="Title" value={project.title} onChange={(title) => patch({ title })} full maxLength={160} />
            <div className="ad-field ad-field--full">
              <label className="ad-label" htmlFor="vx-slug">
                Link <span>(the page&rsquo;s address)</span>
              </label>
              <div className="ad-slug">
                <span className="ad-slug-prefix">{vaultOrigin.replace(/^https?:\/\//, "")}/</span>
                <input
                  id="vx-slug"
                  type="text"
                  value={project.slug}
                  onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  onBlur={(e) => patch({ slug: slugify(e.target.value) })}
                />
              </div>
              {slugProblem ? (
                <p className="vx-error">{slugProblem}</p>
              ) : project.slug !== saved.slug ? (
                <p className="ad-hint">The old link /{saved.slug} will keep working and redirect here.</p>
              ) : null}
            </div>
            <Text label="Client" value={project.client} onChange={(client) => patch({ client })} />
            <Choice
              label="Service"
              value={project.serviceId}
              options={[{ value: "", label: "None" }, ...services.map((s) => ({ value: s.id, label: s.name }))]}
              onChange={(serviceId) => patch({ serviceId })}
            />
            <Text label="Date" hint="optional" type="date" value={project.date} onChange={(date) => patch({ date })} />
            <Text label="Location" hint="optional" value={project.location} onChange={(location) => patch({ location })} />
            <Area
              label="Summary"
              hint="the opening paragraph under the title"
              rows={3}
              value={project.summary}
              onChange={(summary) => patch({ summary })}
              maxLength={1500}
            />
            <MediaSlot
              label="Cover"
              hint="a photo, or a short muted video loop"
              value={project.cover?.media ?? null}
              accept="visual"
              onChange={(media) => patch({ cover: media ? { kind: media.kind === "video" ? "video" : "image", media } : null })}
            />
            <div className="ad-field">
              <label className="ad-label" htmlFor="vx-accent">
                Accent colour <span>(optional)</span>
              </label>
              <div className="vx-row">
                <input
                  id="vx-accent"
                  type="color"
                  className="vx-color"
                  value={project.accent || "#ff6b00"}
                  onChange={(e) => patch({ accent: e.target.value })}
                />
                {project.accent ? (
                  <button type="button" className="ad-btn ad-btn--sm" onClick={() => patch({ accent: "" })}>
                    Use Mark UI orange
                  </button>
                ) : (
                  <span className="ad-hint">Mark UI orange</span>
                )}
              </div>
            </div>
          </div>

          <div className="vx-sub">
            <h3 className="ad-label">Facts</h3>
            <p className="ad-hint">Short lines in the header: Role, Duration, Team, Tools…</p>
            <Items
              items={project.facts.map((f, i) => ({ ...f, id: `f${i}` }))}
              onChange={(items) => patch({ facts: items.map(({ label, value }) => ({ label, value })) })}
              onAdd={() => patch({ facts: [...project.facts, { label: "", value: "" }] })}
              addLabel="Add a fact"
              max={12}
              render={(item, update) => (
                <div className="ad-grid">
                  <Text label="Label" value={item.label} onChange={(label) => update({ label })} />
                  <Text label="Value" value={item.value} onChange={(value) => update({ value })} />
                </div>
              )}
            />
          </div>
          <div className="vx-sub">
            <h3 className="ad-label">Links</h3>
            <p className="ad-hint">Buttons in the header: the live site, the client&rsquo;s Instagram…</p>
            <Items
              items={project.links.map((l, i) => ({ ...l, id: `l${i}` }))}
              onChange={(items) => patch({ links: items.map(({ label, url }) => ({ label, url })) })}
              onAdd={() => patch({ links: [...project.links, { label: "", url: "" }] })}
              addLabel="Add a link"
              max={12}
              render={(item, update) => (
                <div className="ad-grid">
                  <Text label="Label" value={item.label} onChange={(label) => update({ label })} placeholder="Visit the website" />
                  <Text label="Address" type="url" value={item.url} onChange={(url) => update({ url })} placeholder="https://" />
                </div>
              )}
            />
          </div>
        </section>

        <div className="vx-sections-head">
          <h2 className="ad-panel-title">Sections</h2>
          <div className="vx-row">
            <button type="button" className="ad-btn ad-btn--sm" onClick={() => setOpen(new Set(project.blocks.map((b) => b.id)))}>
              Expand all
            </button>
            <button type="button" className="ad-btn ad-btn--sm" onClick={() => setOpen(new Set())}>
              Collapse all
            </button>
          </div>
        </div>

        {project.blocks.length === 0 ? <div className="ad-empty">No sections yet. Add the first one below.</div> : null}

        <ol className="vx-blocks">
          {project.blocks.map((block, i) => {
            const isOpen = open.has(block.id);
            return (
              <li key={block.id} id={`vx-block-${block.id}`} className="vx-block" data-hidden={block.hidden || undefined}>
                <div className="vx-block-head">
                  <button type="button" className="vx-block-toggle" onClick={() => toggle(block.id)} aria-expanded={isOpen}>
                    <span className="vx-block-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="vx-block-type" data-type={block.type} aria-hidden="true" />
                    <span className="vx-block-names">
                      <span className="vx-block-name">
                        {block.label || BLOCK_INFO[block.type].name}
                        <span className="vx-block-kind">{BLOCK_INFO[block.type].name}</span>
                        {block.hidden ? <span className="ad-status ad-status--off">Hidden</span> : null}
                      </span>
                      <span className="vx-block-summary">{summarize(block, albums)}</span>
                    </span>
                    <span className="vx-caret" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <div className="vx-block-tools">
                    <button type="button" className="vx-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move section up">
                      ↑
                    </button>
                    <button
                      type="button"
                      className="vx-icon"
                      onClick={() => move(i, 1)}
                      disabled={i === project.blocks.length - 1}
                      aria-label="Move section down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="vx-icon"
                      onClick={() => setBlock({ ...block, hidden: !block.hidden })}
                      aria-label={block.hidden ? "Show section" : "Hide section"}
                      title={block.hidden ? "Show on the page" : "Hide from the page"}
                    >
                      {block.hidden ? "◌" : "◉"}
                    </button>
                    <button
                      type="button"
                      className="vx-icon"
                      onClick={() => {
                        const copy = cloneBlock(block);
                        const blocks = [...project.blocks];
                        blocks.splice(i + 1, 0, copy);
                        setBlocks(blocks);
                      }}
                      aria-label="Duplicate section"
                      title="Duplicate"
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      className="vx-icon vx-icon--danger"
                      onClick={() => {
                        if (window.confirm(`Remove the "${block.label || BLOCK_INFO[block.type].name}" section?`)) {
                          setBlocks(project.blocks.filter((b) => b.id !== block.id));
                        }
                      }}
                      aria-label="Remove section"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="vx-block-body">
                    <CommonFields block={block} onChange={setBlock} />
                    <div className="vx-divider" />
                    <BlockForm
                      block={block}
                      onChange={setBlock}
                      albums={albums}
                      onAlbum={(album) => setAlbums((prev) => ({ ...prev, [album.key]: album }))}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        {adding ? (
          <div className="ad-panel vx-add-menu">
            <div className="vx-add-menu-head">
              <h2 className="ad-panel-title">Add a section</h2>
              <button type="button" className="ad-modal-close" onClick={() => setAdding(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="vx-add-grid">
              {BLOCK_TYPES.map((type) => (
                <button key={type} type="button" className="vx-add-card" onClick={() => add(type)}>
                  <span className="vx-block-type" data-type={type} aria-hidden="true" />
                  <span className="vx-add-name">{BLOCK_INFO[type].name}</span>
                  <span className="vx-add-hint">{BLOCK_INFO[type].hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button type="button" className="ad-btn vx-add-section" onClick={() => setAdding(true)} disabled={project.blocks.length >= 40}>
            + Add a section
          </button>
        )}
      </div>

      <aside className="vx-editor-side">
        <div className="ad-panel vx-sticky">
          <h2 className="ad-panel-title">Visibility</h2>
          <div className="vx-status" role="radiogroup" aria-label="Visibility">
            {VAULT_STATUSES.map((s) => (
              <label key={s} className="vx-status-option" data-on={project.status === s || undefined}>
                <input type="radio" name="vx-status" checked={project.status === s} onChange={() => patch({ status: s })} />
                <span className="vx-status-name">{STATUS_LABELS[s]}</span>
                <span className="vx-status-help">{STATUS_HELP[s]}</span>
              </label>
            ))}
          </div>
          <label className="ad-check vx-featured">
            <input type="checkbox" checked={project.featured} onChange={(e) => patch({ featured: e.target.checked })} />
            Feature at the top of the Vault
          </label>

          {notice ? <p className={`ad-alert ad-alert--${notice.kind === "ok" ? "ok" : "error"} vx-notice`}>{notice.text}</p> : null}

          <button type="button" className="ad-btn ad-btn--primary vx-save" onClick={save} disabled={saving || !dirty || Boolean(slugProblem)}>
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          <p className="ad-hint vx-center">{dirty ? "Unsaved changes · Ctrl+S" : `Last saved ${new Date(saved.updatedAt).toLocaleString()}`}</p>

          <div className="vx-side-links">
            <button type="button" className="ad-btn ad-btn--sm" onClick={preview}>
              Preview ↗
            </button>
            {saved.status !== "draft" ? (
              <a className="ad-btn ad-btn--sm" href={liveUrl} target="_blank" rel="noopener noreferrer">
                Open live ↗
              </a>
            ) : null}
            <button
              type="button"
              className="ad-btn ad-btn--sm"
              onClick={() => navigator.clipboard?.writeText(liveUrl).then(() => setNotice({ kind: "ok", text: "Link copied." }))}
            >
              Copy link
            </button>
          </div>
        </div>

        <div className="ad-panel">
          <h2 className="ad-panel-title">On markui.lk</h2>
          <div className="ad-field">
            <label className="ad-label" htmlFor="vx-main">
              Main-site project
            </label>
            <select id="vx-main" value={linked} onChange={(e) => relink(e.target.value)}>
              <option value="">Not linked</option>
              {mainProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.vaultProjectId && p.vaultProjectId !== project.id ? " (linked elsewhere)" : ""}
                </option>
              ))}
            </select>
            <p className="ad-hint">
              Its page on markui.lk gets an &ldquo;Explore the full project&rdquo; button to this one. Saved straight away.
            </p>
          </div>
        </div>

        <div className="ad-panel">
          <h2 className="ad-panel-title">Project</h2>
          <div className="vx-side-links">
            <Link className="ad-btn ad-btn--sm" href="/admin/vault">
              ← All projects
            </Link>
            <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={remove}>
              Delete
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
