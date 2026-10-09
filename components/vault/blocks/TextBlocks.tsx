import { Arrow } from "@/components/site/icons";
import { Reveal } from "@/components/site/Reveal";
import { extensionOf, formatBytes } from "@/lib/vault/media-types";
import type { FilesBlock, QuoteBlock, ResultsBlock, StoryBlock } from "@/lib/vault/types";

import Paragraphs from "../Paragraphs";
import Section, { type ShownGround } from "../Section";
import CountUp from "./CountUp";

interface Props<T> {
  block: T;
  number: number;
  ground: ShownGround;
}

export function StoryView({ block, number, ground }: Props<StoryBlock>) {
  return (
    <Section block={block} number={number} ground={ground} split={block.layout === "split"}>
      <Reveal>
        <Paragraphs text={block.body} className={block.layout === "split" ? "vt-prose" : "vt-prose vt-prose--wide"} />
      </Reveal>
    </Section>
  );
}

export function QuoteView({ block, number, ground }: Props<QuoteBlock>) {
  if (!block.text) return null;
  const avatar = block.avatar ? (block.avatar.thumb ?? block.avatar.display ?? block.avatar.url) : null;
  return (
    <Section block={block} number={number} ground={ground}>
      <Reveal as="figure" className="vt-quote">
        <blockquote>
          <p>{block.text}</p>
        </blockquote>
        {block.name ? (
          <figcaption>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" loading="lazy" />
            ) : null}
            <span>
              <span className="vt-quote-name">{block.name}</span>
              {block.role ? <span className="vt-quote-role">{block.role}</span> : null}
            </span>
          </figcaption>
        ) : null}
      </Reveal>
    </Section>
  );
}

export function ResultsView({ block, number, ground }: Props<ResultsBlock>) {
  const items = block.items.filter((i) => i.value);
  if (!items.length) return null;
  return (
    <Section block={block} number={number} ground={ground}>
      <dl className="vt-results" data-count={items.length}>
        {items.map((item, i) => (
          <Reveal key={item.id} className="vt-result" delay={i}>
            <dt className="vt-result-value">
              <CountUp value={item.value} />
            </dt>
            <dd>
              <span className="vt-result-label">{item.label}</span>
              {item.note ? <span className="vt-result-note">{item.note}</span> : null}
            </dd>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}

export function FilesView({ block, number, ground }: Props<FilesBlock>) {
  const items = block.items.filter((i) => i.file || i.url);
  if (!items.length) return null;
  return (
    <Section block={block} number={number} ground={ground} split>
      <ul className="vt-files">
        {items.map((item, i) => {
          const href = item.file?.url ?? item.url;
          const ext = item.file ? extensionOf(item.file.name ?? item.file.url).replace(".", "") : "link";
          const external = !item.file;
          return (
            <Reveal as="li" key={item.id} delay={i}>
              <a
                className="vt-file"
                href={href}
                target={external || item.file?.kind === "pdf" ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                download={!external && item.file?.kind !== "pdf" ? (item.file?.name ?? true) : undefined}
              >
                <span className="vt-file-ext">{ext}</span>
                <span className="vt-file-name">
                  {item.label || item.file?.name || href}
                  {item.note ? <span className="vt-file-note">{item.note}</span> : null}
                </span>
                <span className="vt-file-size mono">
                  {item.file?.bytes ? formatBytes(item.file.bytes) : external ? "Open" : ""}
                </span>
                <span className="vt-file-go">
                  {external || item.file?.kind === "pdf" ? <Arrow /> : <span aria-hidden="true">↓</span>}
                </span>
              </a>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
