import { Reveal } from "@/components/site/Reveal";
import { PLATFORM_NAMES, parseEmbedUrl, parseMediaUrl } from "@/lib/vault/embeds";
import type { EmbedBlock, SocialBlock, VideoBlock } from "@/lib/vault/types";

import LazyFrame from "../media/LazyFrame";
import PlatformIcon from "../media/PlatformIcon";
import PostScreen from "../media/PostScreen";
import VideoFrame from "../media/VideoFrame";
import Rail from "../Rail";
import Section, { type ShownGround } from "../Section";

interface Props<T> {
  block: T;
  number: number;
  ground: ShownGround;
}

export function VideoView({ block, number, ground }: Props<VideoBlock>) {
  const items = block.items.filter((i) => i.url || i.file);
  if (!items.length) return null;

  if (block.layout === "reels") {
    return (
      <Section
        block={block}
        number={number}
        ground={ground}
        bleed={
          <Rail label={block.label || "Reels"}>
            {items.map((item) => (
              <VideoFrame key={item.id} item={item} size="reel" />
            ))}
          </Rail>
        }
      />
    );
  }

  return (
    <Section block={block} number={number} ground={ground}>
      <div className={block.layout === "row" ? "vt-videos vt-videos--row" : "vt-videos"} data-count={items.length}>
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i}>
            <VideoFrame item={item} size={block.layout === "row" ? "row" : "feature"} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function SocialCard({ url, note }: { url: string; note: string }) {
  const parsed = parseMediaUrl(url);
  if (!parsed || parsed.platform === "file" || parsed.platform === "drive") return null;
  const name = PLATFORM_NAMES[parsed.platform];
  const ready = parsed.embedUrl && !parsed.needsResolve;
  return (
    <figure className="vt-post" data-platform={parsed.platform} data-kind={parsed.kind} data-shape={parsed.orientation}>
      <div className="vt-post-head">
        <span className="vt-video-mark">
          <PlatformIcon platform={parsed.platform} />
        </span>
        <span className="vt-post-where">{name}</span>
        <a className="vt-post-open" href={parsed.watchUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open on ${name}`}>
          ↗
        </a>
      </div>
      {ready ? (
        <PostScreen src={parsed.embedUrl} title={`${name} post`} />
      ) : (
        <div className="vt-post-screen">
          <a className="vt-video-out" href={url} target="_blank" rel="noopener noreferrer">
            <PlatformIcon platform={parsed.platform} />
            <span>View on {name}</span>
          </a>
        </div>
      )}
      {note ? <figcaption className="vt-post-note">{note}</figcaption> : null}
    </figure>
  );
}

export function SocialView({ block, number, ground }: Props<SocialBlock>) {
  const items = block.items.filter((i) => i.url && parseMediaUrl(i.url));
  if (!items.length) return null;
  const cards = items.map((item) => <SocialCard key={item.id} url={item.url} note={item.note} />);
  if (block.layout === "rail") {
    return <Section block={block} number={number} ground={ground} bleed={<Rail label={block.label || "Posts"}>{cards}</Rail>} />;
  }
  return (
    <Section block={block} number={number} ground={ground}>
      <div className="vt-posts">{cards}</div>
    </Section>
  );
}

const RATIOS: Record<EmbedBlock["ratio"], string> = {
  "16:9": "16 / 9",
  "4:3": "4 / 3",
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "9:16": "9 / 16",
  a4: "1 / 1.4142",
};

export function EmbedView({ block, number, ground }: Props<EmbedBlock>) {
  const embed = block.url ? parseEmbedUrl(block.url) : null;
  const src = embed?.embedUrl ?? (block.file ? `${block.file.url}#view=FitH` : "");
  if (!src) return null;
  const title = block.title || embed?.provider || "Embedded document";
  return (
    <Section block={block} number={number} ground={ground}>
      <Reveal as="figure" className="vt-embed" data-ratio={block.ratio}>
        <div className="vt-embed-box" style={{ aspectRatio: RATIOS[block.ratio] }}>
          <LazyFrame src={src} title={title} />
        </div>
        <figcaption className="vt-embed-cap">
          {block.caption ? <span>{block.caption}</span> : <span className="mono">{embed?.provider ?? "PDF"}</span>}
          <a className="btn-line" href={embed?.openUrl ?? block.file?.url} target="_blank" rel="noopener noreferrer">
            Open {embed ? `in ${embed.provider}` : "the PDF"} <span aria-hidden="true">↗</span>
          </a>
        </figcaption>
      </Reveal>
    </Section>
  );
}
