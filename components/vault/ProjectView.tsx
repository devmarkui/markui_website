import Link from "next/link";
import type { CSSProperties } from "react";

import Chan from "@/components/site/Chan";
import { Arrow } from "@/components/site/icons";
import { Reveal } from "@/components/site/Reveal";
import { albumKey } from "@/lib/vault/embeds";
import { albumPictures, coverStill, uploadPictures, type Picture } from "@/lib/vault/media-urls";
import type { VaultAlbum, VaultBlock, VaultProject } from "@/lib/vault/types";

import Compare from "./blocks/Compare";
import Gallery from "./blocks/Gallery";
import { EmbedView, SocialView, VideoView } from "./blocks/MediaBlocks";
import Posters from "./blocks/Posters";
import { FilesView, QuoteView, ResultsView, StoryView } from "./blocks/TextBlocks";
import Website from "./blocks/Website";
import Paragraphs from "./Paragraphs";
import Section, { type ShownGround } from "./Section";
import VaultFooter from "./VaultFooter";
import VaultTop from "./VaultTop";
import VPrint from "./VPrint";

export interface NextProject {
  slug: string;
  title: string;
  client: string;
  service: string;
  cover: VaultProject["cover"];
}

function galleryPictures(block: Extract<VaultBlock, { type: "gallery" }>, albums: Record<string, VaultAlbum>): Picture[] {
  let pictures: Picture[] = [];
  if (block.source === "uploads") pictures = uploadPictures(block.items);
  else if (block.url) {
    const album = albums[albumKey(block.url) ?? ""];
    if (album?.items.length) pictures = albumPictures(album.items, block.source === "photos" ? "photos" : "drive");
  }
  return block.limit ? pictures.slice(0, block.limit) : pictures;
}

/** Whether a section has anything to show. */
function hasContent(block: VaultBlock, albums: Record<string, VaultAlbum>): boolean {
  if (block.hidden) return false;
  switch (block.type) {
    case "story":
      return Boolean(block.body.trim());
    case "video":
      return block.items.some((i) => i.url || i.file);
    case "posters":
      return block.items.some((i) => i.image);
    case "gallery":
      return galleryPictures(block, albums).length > 0;
    case "social":
      return block.items.some((i) => i.url);
    case "website":
      return Boolean(block.url);
    case "embed":
      return Boolean(block.url || block.file);
    case "compare":
      return block.items.some((p) => p.before && p.after);
    case "results":
      return block.items.some((i) => i.value);
    case "quote":
      return Boolean(block.text.trim());
    case "files":
      return block.items.some((i) => i.file || i.url);
  }
}

/** Where each kind of section looks best, in order of preference. */
function preferredGrounds(block: VaultBlock): ShownGround[] {
  switch (block.type) {
    case "posters":
    case "website":
    case "quote":
      return ["paper", "soot"];
    case "gallery":
      return block.layout === "masonry" || block.layout === "grid" ? ["paper", "carbon"] : ["carbon", "soot"];
    case "results":
      return ["signal", "paper"];
    case "video":
    case "social":
    case "embed":
    case "files":
      return ["soot", "carbon"];
    default:
      return ["carbon", "soot"];
  }
}

/** Picks each section's ground so two neighbours never share one. */
function groundsFor(blocks: VaultBlock[]): ShownGround[] {
  let previous: ShownGround = "carbon";
  return blocks.map((block) => {
    const ground =
      block.ground !== "auto" ? block.ground : (preferredGrounds(block).find((g) => g !== previous) ?? "soot");
    previous = ground;
    return ground;
  });
}

/** The orange full stop, unless the title already ends in punctuation. */
function Stop({ after }: { after: string }) {
  return /[.!?…]$/.test(after.trim()) ? null : <span className="mast-stop">.</span>;
}

function formatDate(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function renderBlock(block: VaultBlock, number: number, ground: ShownGround, albums: Record<string, VaultAlbum>) {
  switch (block.type) {
    case "story":
      return <StoryView key={block.id} block={block} number={number} ground={ground} />;
    case "video":
      return <VideoView key={block.id} block={block} number={number} ground={ground} />;
    case "social":
      return <SocialView key={block.id} block={block} number={number} ground={ground} />;
    case "embed":
      return <EmbedView key={block.id} block={block} number={number} ground={ground} />;
    case "results":
      return <ResultsView key={block.id} block={block} number={number} ground={ground} />;
    case "quote":
      return <QuoteView key={block.id} block={block} number={number} ground={ground} />;
    case "files":
      return <FilesView key={block.id} block={block} number={number} ground={ground} />;
    case "posters":
      return <Section key={block.id} block={block} number={number} ground={ground} bleed={<Posters block={block} />} />;
    case "gallery":
      return (
        <Section
          key={block.id}
          block={block}
          number={number}
          ground={ground}
          bleed={<Gallery block={block} pictures={galleryPictures(block, albums)} />}
        />
      );
    case "website":
      return (
        <Section key={block.id} block={block} number={number} ground={ground}>
          <Website block={block} />
        </Section>
      );
    case "compare":
      return (
        <Section key={block.id} block={block} number={number} ground={ground}>
          <Compare items={block.items} />
        </Section>
      );
  }
}

export default function ProjectView({
  project,
  albums,
  serviceName,
  next,
  siteOrigin,
  cta,
  banner,
}: {
  project: VaultProject;
  albums: Record<string, VaultAlbum>;
  serviceName: string;
  next: NextProject | null;
  siteOrigin: string;
  cta: { label: string; url: string };
  /** Shown across the top of a preview. */
  banner?: string;
}) {
  const blocks = project.blocks.filter((b) => hasContent(b, albums));
  const grounds = groundsFor(blocks);
  const cover = project.cover?.media;
  const still = coverStill(cover);
  const facts = [
    project.client ? { label: "Client", value: project.client } : null,
    serviceName ? { label: "Service", value: serviceName } : null,
    project.date ? { label: "Date", value: formatDate(project.date) } : null,
    project.location ? { label: "Location", value: project.location } : null,
    ...project.facts,
  ].filter((f): f is { label: string; value: string } => Boolean(f));
  const style = project.accent ? ({ "--signal": project.accent, "--signal-hover": project.accent } as CSSProperties) : undefined;

  return (
    <main id="main" className="sx pg vault" style={style}>
      {banner ? <div className="vt-banner mono">{banner}</div> : null}
      <VaultTop siteOrigin={siteOrigin} back />

      <header className="vt-hero ground ground-carbon" data-mast data-ground="carbon">
        <div className="vt-hero-media" aria-hidden="true">
          {cover ? (
            <VPrint
              src={still}
              srcSet={cover.kind === "image" && cover.thumb && cover.display ? `${cover.thumb} 720w, ${cover.display} 2400w` : undefined}
              sizes="100vw"
              video={cover.kind === "video" ? cover.url : undefined}
              poster={cover.kind === "video" ? cover.poster : undefined}
              eager
              autoPlay={cover.kind === "video"}
              develop={false}
              className="vt-hero-print"
            />
          ) : null}
        </div>
        <div className="wrap vt-hero-inner">
          <Chan className="is-live">{serviceName || "Project"}</Chan>
          <h1 className="mast-title vt-hero-title">
            <span className="mast-l">
              {project.title}
              <Stop after={project.title} />
            </span>
          </h1>
          {project.client ? <p className="vt-hero-client">for {project.client}</p> : null}
        </div>
        <span className="vt-hero-scroll mono" aria-hidden="true">
          Scroll
        </span>
      </header>

      {facts.length || project.summary || project.links.length ? (
        <section className="vt-intro ground ground-carbon" aria-label="About the project">
          <div className="wrap vt-intro-grid">
            {facts.length ? (
              <dl className="vt-facts">
                {facts.map((f) => (
                  <div key={`${f.label}-${f.value}`}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="vt-intro-body">
              {project.summary ? (
                <Reveal>
                  <Paragraphs text={project.summary} className="vt-lead" />
                </Reveal>
              ) : null}
              {project.links.length ? (
                <div className="btn-row vt-intro-links">
                  {project.links.map((link, i) => (
                    <a
                      key={link.url}
                      className={i === 0 ? "btn-signal" : "btn-line"}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label} <Arrow />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {blocks.map((block, i) => renderBlock(block, i + 1, grounds[i], albums))}

      {next ? (
        <section className="vt-next ground ground-soot" aria-label="Next project">
          <div className="wrap">
            <Link className="vt-next-link" href={`/${next.slug}`} data-cursor="Next">
              <span className="vt-next-text">
                <Chan>Next project</Chan>
                <span className="vt-next-title">
                  {next.title}
                  <Stop after={next.title} />
                </span>
                <span className="vt-next-meta mono">{[next.client, next.service].filter(Boolean).join(" · ")}</span>
              </span>
              {next.cover ? (
                <VPrint
                  className="vt-next-print"
                  src={coverStill(next.cover.media)}
                  video={next.cover.kind === "video" ? next.cover.media.url : undefined}
                  poster={next.cover.kind === "video" ? next.cover.media.poster : undefined}
                  playOnHover
                  sizes="(min-width: 1100px) 40vw, 92vw"
                />
              ) : null}
            </Link>
          </div>
        </section>
      ) : null}

      <VaultFooter siteOrigin={siteOrigin} cta={cta} />
    </main>
  );
}
