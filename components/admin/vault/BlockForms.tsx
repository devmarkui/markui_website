"use client";

import { useState, useTransition } from "react";

import { captureScreenshotAction, checkWebsiteAction, syncAlbumAction } from "@/app/admin/vault-actions";
import {
  createComparePair,
  createFileItem,
  createGalleryUpload,
  createPosterItem,
  createResultItem,
  createSocialItem,
  createVideoItem,
  createWebsitePage,
} from "@/lib/vault/blocks";
import { albumKey, describeMedia, parseEmbedUrl, parseMediaUrl } from "@/lib/vault/embeds";
import {
  DEVICES,
  EMBED_RATIOS,
  GROUNDS,
  ORIENTATIONS,
  VIDEO_LABELS,
  mediaRefFrom,
  type BlockOf,
  type Device,
  type VaultAlbum,
  type VaultBlock,
} from "@/lib/vault/types";

import { Area, Check, Choice, Items, Segments, Text } from "./fields";
import { MediaSlot, MediaThumb, useMediaPicker } from "./MediaPicker";

type FormProps<T extends VaultBlock["type"]> = {
  block: BlockOf<T>;
  onChange: (next: BlockOf<T>) => void;
};

const GROUND_OPTIONS = GROUNDS.map((g) => ({
  value: g,
  label: { auto: "Automatic", carbon: "Dark", soot: "Dark (soft)", paper: "Light", signal: "Orange" }[g],
}));

/** The fields every section has: its label, heading, intro and background. */
export function CommonFields({ block, onChange }: { block: VaultBlock; onChange: (next: VaultBlock) => void }) {
  return (
    <div className="ad-grid vx-common">
      <Text
        label="Label"
        hint="the small line above the section"
        value={block.label}
        onChange={(label) => onChange({ ...block, label })}
        maxLength={60}
      />
      <Choice
        label="Background"
        value={block.ground}
        options={GROUND_OPTIONS}
        onChange={(ground) => onChange({ ...block, ground })}
      />
      <Text
        label="Heading"
        hint="optional"
        value={block.title}
        onChange={(title) => onChange({ ...block, title })}
        full
        maxLength={160}
      />
      <Area
        label="Intro"
        hint="optional, a sentence or two"
        rows={2}
        value={block.intro}
        onChange={(intro) => onChange({ ...block, intro })}
        maxLength={1200}
      />
    </div>
  );
}

function Detected({ url, kind }: { url: string; kind: "media" | "embed" }) {
  if (!url.trim()) return null;
  if (kind === "embed") {
    const embed = parseEmbedUrl(url);
    return embed ? (
      <span className="vx-chip vx-chip--ok">{embed.provider}</span>
    ) : (
      <span className="vx-chip vx-chip--bad">Not a link that can be embedded</span>
    );
  }
  const parsed = parseMediaUrl(url);
  if (!parsed) return <span className="vx-chip vx-chip--bad">Not recognised. Use a YouTube, Instagram, Facebook, TikTok, Vimeo or Drive link</span>;
  return (
    <span className="vx-chip vx-chip--ok">
      {describeMedia(parsed)}
      {parsed.needsResolve ? " · short link, expanded on save" : ""}
    </span>
  );
}

// ─── Story ───────────────────────────────────────────────────────────────────

function StoryForm({ block, onChange }: FormProps<"story">) {
  return (
    <div className="ad-grid">
      <Segments
        label="Layout"
        value={block.layout}
        options={[
          { value: "split", label: "Heading beside text" },
          { value: "wide", label: "Wide text" },
        ]}
        onChange={(layout) => onChange({ ...block, layout })}
      />
      <Area
        label="Text"
        hint="leave a blank line between paragraphs; **bold** and [link text](https://…) work"
        rows={10}
        value={block.body}
        onChange={(body) => onChange({ ...block, body })}
        maxLength={12000}
      />
    </div>
  );
}

// ─── Videos ──────────────────────────────────────────────────────────────────

function VideoForm({ block, onChange }: FormProps<"video">) {
  return (
    <div className="ad-grid">
      <Segments
        label="Layout"
        value={block.layout}
        options={[
          { value: "feature", label: "One after another, large" },
          { value: "row", label: "Side by side" },
          { value: "reels", label: "Vertical reels rail" },
        ]}
        onChange={(layout) => onChange({ ...block, layout })}
      />
      <datalist id="vx-video-labels">
        {VIDEO_LABELS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <div className="ad-field ad-field--full">
        <Items
          items={block.items}
          onChange={(items) => onChange({ ...block, items })}
          onAdd={() => onChange({ ...block, items: [...block.items, createVideoItem()] })}
          addLabel="Add a video"
          max={24}
          render={(item, update) => (
            <div className="ad-grid">
              <div className="ad-field ad-field--full">
                <Text
                  label="Video link"
                  hint="YouTube, Instagram, Facebook, TikTok, Vimeo or Google Drive"
                  value={item.url}
                  onChange={(url) => update({ url })}
                  placeholder="https://www.facebook.com/…/videos/…"
                  full
                />
                <Detected url={item.url} kind="media" />
              </div>
              {!item.url ? (
                <MediaSlot
                  label="…or upload the video"
                  value={item.file}
                  accept="video"
                  onChange={(file) => update({ file })}
                />
              ) : null}
              <Text label="Label" hint="Teaser, Announcement…" value={item.label} onChange={(label) => update({ label })} list="vx-video-labels" />
              <Text label="Account" hint="shown in the frame, e.g. @markui.lk" value={item.account} onChange={(account) => update({ account })} />
              <Text label="Title" value={item.title} onChange={(title) => update({ title })} full />
              <Area label="Description" rows={2} value={item.description} onChange={(description) => update({ description })} />
              <Choice
                label="Shape"
                value={item.orientation}
                options={ORIENTATIONS.map((o) => ({
                  value: o,
                  label: { auto: "As the platform says", landscape: "Landscape 16:9", portrait: "Vertical 9:16", square: "Square" }[o],
                }))}
                onChange={(orientation) => update({ orientation })}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ─── Posters ─────────────────────────────────────────────────────────────────

function PostersForm({ block, onChange }: FormProps<"posters">) {
  const { open } = useMediaPicker();
  return (
    <div className="ad-grid">
      <Segments
        label="Layout"
        value={block.layout}
        options={[
          { value: "grid", label: "Grid" },
          { value: "deck", label: "Fanned deck" },
          { value: "carousel", label: "Carousel" },
        ]}
        onChange={(layout) => onChange({ ...block, layout })}
      />
      <div className="ad-field ad-field--full">
        <Items
          items={block.items}
          onChange={(items) => onChange({ ...block, items })}
          empty="No posters yet."
          render={(item, update) => (
            <div className="vx-poster-row">
              <MediaSlot label="Poster" value={item.image} accept="image" onChange={(image) => update({ image })} />
              <div className="ad-grid">
                <Text label="Title" value={item.title} onChange={(title) => update({ title })} />
                <Text label="Date" hint="optional" value={item.date} onChange={(date) => update({ date })} />
                <Area label="Description" rows={2} value={item.description} onChange={(description) => update({ description })} />
              </div>
            </div>
          )}
        />
        <button
          type="button"
          className="ad-btn ad-btn--sm vx-add"
          onClick={() =>
            open({
              accept: "image",
              multiple: true,
              title: "Add posters",
              onPick: (refs) => onChange({ ...block, items: [...block.items, ...refs.map((r) => createPosterItem(r))] }),
            })
          }
        >
          + Add posters
        </button>
      </div>
    </div>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

function AlbumStatus({ album }: { album?: VaultAlbum }) {
  if (!album) return <p className="ad-hint">Not synced yet. It syncs when you save, or now with the button.</p>;
  if (album.status === "error") return <p className="vx-error">{album.error}</p>;
  if (album.status === "syncing") return <p className="ad-hint">Syncing…</p>;
  const photos = album.items.filter((i) => i.kind === "image").length;
  const videos = album.items.length - photos;
  const folders = new Set(album.items.map((i) => i.folder).filter(Boolean)).size;
  return (
    <p className="vx-ok">
      {photos} photo{photos === 1 ? "" : "s"}
      {videos ? `, ${videos} video${videos === 1 ? "" : "s"}` : ""}
      {folders ? ` in ${folders} subfolder${folders === 1 ? "" : "s"}` : ""}
      {album.syncedAt ? ` · synced ${new Date(album.syncedAt).toLocaleString()}` : ""}. New photos added to the
      folder show up within a day, or straight away with Sync now.
    </p>
  );
}

function GalleryForm({
  block,
  onChange,
  albums,
  onAlbum,
}: FormProps<"gallery"> & { albums: Record<string, VaultAlbum>; onAlbum: (album: VaultAlbum) => void }) {
  const { open } = useMediaPicker();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const key = block.url ? albumKey(block.url) : null;
  const album = key ? albums[key] : undefined;

  const sync = () =>
    start(async () => {
      setError("");
      const res = await syncAlbumAction(block.url);
      if (res.album) onAlbum(res.album);
      if (res.error && !res.album) setError(res.error);
    });

  return (
    <div className="ad-grid">
      <Segments
        label="Photos from"
        value={block.source}
        options={[
          { value: "drive", label: "Google Drive folder" },
          { value: "photos", label: "Google Photos album" },
          { value: "uploads", label: "Uploads" },
        ]}
        onChange={(source) => onChange({ ...block, source })}
      />
      {block.source !== "uploads" ? (
        <div className="ad-field ad-field--full">
          <Text
            label={block.source === "drive" ? "Drive folder link" : "Shared album link"}
            hint={block.source === "drive" ? "shared as Anyone with the link" : "photos.app.goo.gl/…"}
            value={block.url}
            onChange={(url) => onChange({ ...block, url })}
            placeholder={block.source === "drive" ? "https://drive.google.com/drive/folders/…" : "https://photos.app.goo.gl/…"}
            full
          />
          {block.url && !key ? (
            <p className="vx-error">That isn&rsquo;t a Drive folder or Google Photos album link.</p>
          ) : null}
          {key ? <AlbumStatus album={album} /> : null}
          {error ? <p className="vx-error">{error}</p> : null}
          {block.source === "photos" ? (
            <p className="ad-hint">
              Google has no official way to read shared albums any more, so this reads the album&rsquo;s public page and
              may stop working if Google changes it. Drive folders are the reliable choice.
            </p>
          ) : null}
          <div className="vx-row">
            <button type="button" className="ad-btn ad-btn--sm" disabled={!key || pending} onClick={sync}>
              {pending ? "Syncing…" : "Sync now"}
            </button>
          </div>
        </div>
      ) : (
        <div className="ad-field ad-field--full">
          <span className="ad-label">Photos ({block.items.length})</span>
          <div className="vx-strip">
            {block.items.map((item, i) => (
              <div className="vx-strip-item" key={item.id}>
                <MediaThumb media={item.media} />
                <input
                  type="text"
                  className="vx-caption"
                  placeholder="Caption"
                  value={item.caption}
                  aria-label={`Caption for photo ${i + 1}`}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      items: block.items.map((it) => (it.id === item.id ? { ...it, caption: e.target.value } : it)),
                    })
                  }
                />
                <div className="vx-strip-tools">
                  <button
                    type="button"
                    className="vx-icon"
                    aria-label="Move earlier"
                    disabled={i === 0}
                    onClick={() => {
                      const items = [...block.items];
                      [items[i - 1], items[i]] = [items[i], items[i - 1]];
                      onChange({ ...block, items });
                    }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="vx-icon"
                    aria-label="Move later"
                    disabled={i === block.items.length - 1}
                    onClick={() => {
                      const items = [...block.items];
                      [items[i + 1], items[i]] = [items[i], items[i + 1]];
                      onChange({ ...block, items });
                    }}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="vx-icon vx-icon--danger"
                    aria-label="Remove"
                    onClick={() => onChange({ ...block, items: block.items.filter((it) => it.id !== item.id) })}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="vx-row">
            <button
              type="button"
              className="ad-btn ad-btn--sm"
              onClick={() =>
                open({
                  accept: "visual",
                  multiple: true,
                  title: "Add photos",
                  onPick: (refs) =>
                    onChange({ ...block, items: [...block.items, ...refs.map((r) => createGalleryUpload(r))] }),
                })
              }
            >
              + Add photos
            </button>
          </div>
        </div>
      )}
      <Segments
        label="Layout"
        value={block.layout}
        options={[
          { value: "slideshow", label: "Slideshow" },
          { value: "masonry", label: "Masonry" },
          { value: "filmstrip", label: "Filmstrip" },
          { value: "grid", label: "Grid" },
        ]}
        onChange={(layout) => onChange({ ...block, layout })}
      />
      <div className="ad-field ad-field--full vx-checks">
        {block.layout === "slideshow" ? (
          <Check label="Play the slideshow by itself" checked={block.autoplay} onChange={(autoplay) => onChange({ ...block, autoplay })} />
        ) : null}
        <Check label="Show captions / file names" checked={block.captions} onChange={(captions) => onChange({ ...block, captions })} />
        {block.source === "drive" ? (
          <Check label="Split into chapters by subfolder" checked={block.chapters} onChange={(chapters) => onChange({ ...block, chapters })} />
        ) : null}
      </div>
      <Text
        label="Show at most"
        hint="photos; 0 shows all"
        value={String(block.limit)}
        onChange={(v) => onChange({ ...block, limit: Math.max(0, Math.min(1000, Number(v.replace(/\D/g, "")) || 0)) })}
      />
    </div>
  );
}

// ─── Social posts ────────────────────────────────────────────────────────────

function SocialForm({ block, onChange }: FormProps<"social">) {
  return (
    <div className="ad-grid">
      <Segments
        label="Layout"
        value={block.layout}
        options={[
          { value: "rail", label: "Scrolling feed" },
          { value: "grid", label: "Grid" },
        ]}
        onChange={(layout) => onChange({ ...block, layout })}
      />
      <div className="ad-field ad-field--full">
        <Items
          items={block.items}
          onChange={(items) => onChange({ ...block, items })}
          onAdd={() => onChange({ ...block, items: [...block.items, createSocialItem()] })}
          addLabel="Add a post"
          max={40}
          render={(item, update) => (
            <div className="ad-grid">
              <div className="ad-field ad-field--full">
                <Text
                  label="Post link"
                  hint="Instagram, Facebook, TikTok, LinkedIn or X"
                  value={item.url}
                  onChange={(url) => update({ url })}
                  placeholder="https://www.instagram.com/p/…"
                  full
                />
                <Detected url={item.url} kind="media" />
              </div>
              <Text label="Note" hint="optional, under the post" value={item.note} onChange={(note) => update({ note })} full />
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ─── Website ─────────────────────────────────────────────────────────────────

function pageUrl(base: string, url: string) {
  try {
    return new URL(url || "/", base).toString();
  } catch {
    return "";
  }
}

function WebsiteForm({ block, onChange }: FormProps<"website">) {
  const { addToLibrary } = useMediaPicker();
  const [checking, startCheck] = useTransition();
  const [capturing, setCapturing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const check = () =>
    startCheck(async () => {
      setError("");
      const res = await checkWebsiteAction(block.url);
      if (res.error) setError(res.error);
      else onChange({ ...block, frameable: res.frameable ?? null, checkedAt: new Date().toISOString() });
    });

  const capture = async (pageId: string, device: "desktop" | "mobile") => {
    const page = block.pages.find((p) => p.id === pageId);
    if (!page) return;
    setError("");
    setCapturing(`${pageId}-${device}`);
    const res = await captureScreenshotAction(pageUrl(block.url, page.url), device);
    setCapturing(null);
    if (res.error || !res.media) {
      setError(res.error ?? "The screenshot couldn't be taken.");
      return;
    }
    addToLibrary(res.media);
    const ref = mediaRefFrom(res.media);
    onChange({ ...block, pages: block.pages.map((p) => (p.id === pageId ? { ...p, [device]: ref } : p)) });
  };

  return (
    <div className="ad-grid">
      <div className="ad-field ad-field--full">
        <Text
          label="Website address"
          value={block.url}
          onChange={(url) => onChange({ ...block, url, frameable: null })}
          placeholder="https://example.lk"
          type="url"
          full
        />
        <div className="vx-row">
          <button type="button" className="ad-btn ad-btn--sm" disabled={!block.url || checking} onClick={check}>
            {checking ? "Checking…" : "Check the site"}
          </button>
          {block.frameable === true ? (
            <span className="vx-chip vx-chip--ok">Can be shown live in the Vault</span>
          ) : block.frameable === false ? (
            <span className="vx-chip vx-chip--bad">This site blocks framing; screenshots are shown instead</span>
          ) : block.url ? (
            <span className="ad-hint">Checked when you save.</span>
          ) : null}
        </div>
      </div>
      <Choice
        label="Show"
        value={block.mode}
        options={[
          { value: "auto", label: "Live site when allowed, else screenshots" },
          { value: "live", label: "Always the live site" },
          { value: "screens", label: "Always screenshots" },
        ]}
        onChange={(mode) => onChange({ ...block, mode })}
      />
      <div className="ad-field">
        <span className="ad-label">Devices</span>
        <div className="vx-checks">
          {DEVICES.map((d) => (
            <Check
              key={d}
              label={{ desktop: "Desktop", tablet: "Tablet", mobile: "Phone" }[d]}
              checked={block.devices.includes(d)}
              onChange={(on) => {
                const devices: Device[] = on ? [...block.devices, d] : block.devices.filter((x) => x !== d);
                onChange({ ...block, devices: devices.length ? DEVICES.filter((x) => devices.includes(x)) : ["desktop"] });
              }}
            />
          ))}
        </div>
      </div>
      {error ? <p className="vx-error ad-field--full">{error}</p> : null}
      <div className="ad-field ad-field--full">
        <span className="ad-label">Pages</span>
        <Items
          items={block.pages}
          onChange={(pages) => onChange({ ...block, pages })}
          onAdd={() => onChange({ ...block, pages: [...block.pages, createWebsitePage()] })}
          addLabel="Add a page"
          max={20}
          render={(page, update) => (
            <div className="ad-grid">
              <Text label="Tab name" value={page.label} onChange={(label) => update({ label })} placeholder="Home" />
              <Text label="Address" hint="a path like /shop, or a full link" value={page.url} onChange={(url) => update({ url })} placeholder="/" />
              <div className="vx-shot">
                <MediaSlot label="Desktop screenshot" hint="full page" value={page.desktop} accept="image" onChange={(desktop) => update({ desktop })} />
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  disabled={!block.url || capturing !== null}
                  onClick={() => capture(page.id, "desktop")}
                >
                  {capturing === `${page.id}-desktop` ? "Capturing…" : "Capture desktop"}
                </button>
              </div>
              <div className="vx-shot">
                <MediaSlot label="Phone screenshot" hint="full page" value={page.mobile} accept="image" onChange={(mobile) => update({ mobile })} />
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  disabled={!block.url || capturing !== null}
                  onClick={() => capture(page.id, "mobile")}
                >
                  {capturing === `${page.id}-mobile` ? "Capturing…" : "Capture phone"}
                </button>
              </div>
            </div>
          )}
        />
        <p className="ad-hint">
          Screenshots are taken by an outside service and take up to a minute each. They&rsquo;re used when the site
          can&rsquo;t be framed, and as a fallback while the live site loads.
        </p>
      </div>
    </div>
  );
}

// ─── Prototype & embeds ──────────────────────────────────────────────────────

function EmbedForm({ block, onChange }: FormProps<"embed">) {
  return (
    <div className="ad-grid">
      <div className="ad-field ad-field--full">
        <Text
          label="Link"
          hint="Figma, Canva, Google Slides, Loom, Spline, CodePen, Behance, a Drive PDF…"
          value={block.url}
          onChange={(url) => onChange({ ...block, url })}
          placeholder="https://www.figma.com/proto/…"
          full
        />
        <Detected url={block.url} kind="embed" />
      </div>
      {!block.url ? (
        <MediaSlot label="…or upload a PDF" value={block.file} accept="pdf" onChange={(file) => onChange({ ...block, file })} />
      ) : null}
      <Choice
        label="Shape"
        value={block.ratio}
        options={EMBED_RATIOS.map((r) => ({ value: r, label: r === "a4" ? "A4 page" : r }))}
        onChange={(ratio) => onChange({ ...block, ratio })}
      />
      <Text label="Caption" value={block.caption} onChange={(caption) => onChange({ ...block, caption })} full />
    </div>
  );
}

// ─── Before / after ──────────────────────────────────────────────────────────

function CompareForm({ block, onChange }: FormProps<"compare">) {
  return (
    <Items
      items={block.items}
      onChange={(items) => onChange({ ...block, items })}
      onAdd={() => onChange({ ...block, items: [...block.items, createComparePair()] })}
      addLabel="Add a pair"
      max={20}
      render={(pair, update) => (
        <div className="ad-grid">
          <MediaSlot label="Before" value={pair.before} accept="image" onChange={(before) => update({ before })} />
          <MediaSlot label="After" value={pair.after} accept="image" onChange={(after) => update({ after })} />
          <Text label="Before label" value={pair.beforeLabel} onChange={(beforeLabel) => update({ beforeLabel })} />
          <Text label="After label" value={pair.afterLabel} onChange={(afterLabel) => update({ afterLabel })} />
          <Text label="Caption" value={pair.caption} onChange={(caption) => update({ caption })} full />
        </div>
      )}
    />
  );
}

// ─── Results ─────────────────────────────────────────────────────────────────

function ResultsForm({ block, onChange }: FormProps<"results">) {
  return (
    <Items
      items={block.items}
      onChange={(items) => onChange({ ...block, items })}
      onAdd={() => onChange({ ...block, items: [...block.items, createResultItem()] })}
      addLabel="Add a number"
      max={12}
      render={(item, update) => (
        <div className="ad-grid ad-grid--triple">
          <Text label="Number" hint="e.g. 2.4M, +38%" value={item.value} onChange={(value) => update({ value })} maxLength={24} />
          <Text label="What it counts" value={item.label} onChange={(label) => update({ label })} />
          <Text label="Note" hint="optional" value={item.note} onChange={(note) => update({ note })} />
        </div>
      )}
    />
  );
}

// ─── Quote ───────────────────────────────────────────────────────────────────

function QuoteForm({ block, onChange }: FormProps<"quote">) {
  return (
    <div className="ad-grid">
      <Area label="Quote" rows={4} value={block.text} onChange={(text) => onChange({ ...block, text })} />
      <Text label="Name" value={block.name} onChange={(name) => onChange({ ...block, name })} />
      <Text label="Role" hint="and company" value={block.role} onChange={(role) => onChange({ ...block, role })} />
      <MediaSlot label="Photo" hint="optional" value={block.avatar} accept="image" onChange={(avatar) => onChange({ ...block, avatar })} />
    </div>
  );
}

// ─── Files ───────────────────────────────────────────────────────────────────

function FilesForm({ block, onChange }: FormProps<"files">) {
  const { open } = useMediaPicker();
  return (
    <div className="ad-field ad-field--full">
      <Items
        items={block.items}
        onChange={(items) => onChange({ ...block, items })}
        empty="No files yet."
        render={(item, update) => (
          <div className="ad-grid">
            {item.file ? (
              <div className="ad-field ad-field--full vx-file-line">
                <MediaThumb media={item.file} />
                <span>{item.file.name}</span>
              </div>
            ) : (
              <Text label="Link" hint="Drive, WeTransfer, Dropbox…" value={item.url} onChange={(url) => update({ url })} full />
            )}
            <Text label="Name" value={item.label} onChange={(label) => update({ label })} />
            <Text label="Note" hint="optional" value={item.note} onChange={(note) => update({ note })} />
          </div>
        )}
      />
      <div className="vx-row">
        <button
          type="button"
          className="ad-btn ad-btn--sm"
          onClick={() =>
            open({
              accept: "any",
              multiple: true,
              title: "Add files",
              onPick: (refs) => onChange({ ...block, items: [...block.items, ...refs.map((r) => createFileItem(r))] }),
            })
          }
        >
          + Upload files
        </button>
        <button
          type="button"
          className="ad-btn ad-btn--sm"
          onClick={() => onChange({ ...block, items: [...block.items, createFileItem()] })}
        >
          + Add a link
        </button>
      </div>
    </div>
  );
}

export function BlockForm({
  block,
  onChange,
  albums,
  onAlbum,
}: {
  block: VaultBlock;
  onChange: (next: VaultBlock) => void;
  albums: Record<string, VaultAlbum>;
  onAlbum: (album: VaultAlbum) => void;
}) {
  // A handler that takes any section also takes this section's type.
  const set = onChange;
  switch (block.type) {
    case "story":
      return <StoryForm block={block} onChange={set} />;
    case "video":
      return <VideoForm block={block} onChange={set} />;
    case "posters":
      return <PostersForm block={block} onChange={set} />;
    case "gallery":
      return <GalleryForm block={block} onChange={set} albums={albums} onAlbum={onAlbum} />;
    case "social":
      return <SocialForm block={block} onChange={set} />;
    case "website":
      return <WebsiteForm block={block} onChange={set} />;
    case "embed":
      return <EmbedForm block={block} onChange={set} />;
    case "compare":
      return <CompareForm block={block} onChange={set} />;
    case "results":
      return <ResultsForm block={block} onChange={set} />;
    case "quote":
      return <QuoteForm block={block} onChange={set} />;
    case "files":
      return <FilesForm block={block} onChange={set} />;
  }
}

/** One line under a collapsed section: what's in it. */
export function summarize(block: VaultBlock, albums: Record<string, VaultAlbum>): string {
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  switch (block.type) {
    case "story":
      return block.body ? `${block.body.split(/\s+/).filter(Boolean).length} words` : "No text yet";
    case "video":
      return n(block.items.filter((i) => i.url || i.file).length, "video");
    case "posters":
      return n(block.items.filter((i) => i.image).length, "poster");
    case "gallery": {
      if (block.source === "uploads") return `Uploads · ${n(block.items.length, "photo")}`;
      const album = block.url ? albums[albumKey(block.url) ?? ""] : undefined;
      const where = block.source === "drive" ? "Google Drive" : "Google Photos";
      if (!block.url) return `${where} · no link yet`;
      if (!album) return `${where} · not synced yet`;
      if (album.status === "error") return `${where} · needs attention`;
      return `${where} · ${n(album.items.length, "item")}`;
    }
    case "social":
      return n(block.items.filter((i) => i.url).length, "post");
    case "website": {
      if (!block.url) return "No address yet";
      let host = block.url;
      try {
        host = new URL(block.url).hostname;
      } catch {
        // Still being typed.
      }
      return `${host} · ${n(block.pages.length, "page")}`;
    }
    case "embed":
      return block.url ? (parseEmbedUrl(block.url)?.provider ?? "Link") : block.file ? "PDF" : "Nothing yet";
    case "compare":
      return n(block.items.length, "pair");
    case "results":
      return block.items.filter((i) => i.value).map((i) => i.value).join(" · ") || "No numbers yet";
    case "quote":
      return block.name || (block.text ? "Quote" : "No quote yet");
    case "files":
      return n(block.items.length, "file");
  }
}
