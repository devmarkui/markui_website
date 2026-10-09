"use client";

import { useState, type CSSProperties } from "react";

import { cx, useSeen } from "@/components/site/hooks";
import { refPicture, type Picture } from "@/lib/vault/media-urls";
import type { PosterItem, PostersBlock } from "@/lib/vault/types";

import Lightbox from "../Lightbox";
import Rail from "../Rail";

function Card({ item, picture, number, onOpen, style }: { item: PosterItem; picture: Picture; number: number; onOpen: () => void; style?: CSSProperties }) {
  return (
    <figure className="vt-poster" style={style}>
      <button
        type="button"
        className="vt-poster-art"
        onClick={onOpen}
        data-cursor="Open"
        aria-label={`Open ${item.title || `poster ${number}`}`}
        style={picture.w && picture.h ? { aspectRatio: `${picture.w} / ${picture.h}` } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={picture.src} srcSet={picture.srcSet} sizes="(min-width: 1100px) 30vw, 70vw" alt={item.title} loading="lazy" decoding="async" />
      </button>
      {item.title || item.description || item.date ? (
        <figcaption className="vt-poster-cap">
          <span className="vt-poster-num mono">{String(number).padStart(2, "0")}</span>
          <span className="vt-poster-text">
            {item.title ? <span className="vt-poster-title">{item.title}</span> : null}
            {item.date ? <span className="vt-poster-date mono">{item.date}</span> : null}
            {item.description ? <span className="vt-poster-desc">{item.description}</span> : null}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

/** The fanned deck: stacked as it arrives, then it spreads; hovering a card lifts it. */
function Deck({ items, pictures, onOpen }: { items: PosterItem[]; pictures: Picture[]; onOpen: (i: number) => void }) {
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -20% 0px");
  const n = items.length;
  return (
    <div ref={ref} className={cx("vt-deck", seen && "is-in")} style={{ "--n": n } as CSSProperties}>
      {items.map((item, i) => (
        <Card
          key={item.id}
          item={item}
          picture={pictures[i]}
          number={i + 1}
          onOpen={() => onOpen(i)}
          style={{ "--i": i, "--o": i - (n - 1) / 2 } as CSSProperties}
        />
      ))}
    </div>
  );
}

export default function Posters({ block }: { block: Pick<PostersBlock, "layout" | "items" | "label" | "title"> }) {
  const items = block.items.filter((i) => i.image);
  const pictures = items.map((item) => refPicture(item.image!, item.id, item.title || item.description || undefined));
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  const label = block.title || block.label || "Posters";

  return (
    <>
      {block.layout === "carousel" ? (
        <Rail label={label} className="vt-poster-rail">
          {items.map((item, i) => (
            <Card key={item.id} item={item} picture={pictures[i]} number={i + 1} onOpen={() => setOpen(i)} />
          ))}
        </Rail>
      ) : block.layout === "deck" && items.length > 1 ? (
        <div className="wrap">
          <Deck items={items} pictures={pictures} onOpen={setOpen} />
        </div>
      ) : (
        <div className="wrap">
          <div className="vt-poster-grid" data-count={items.length}>
            {items.map((item, i) => (
              <Card key={item.id} item={item} picture={pictures[i]} number={i + 1} onOpen={() => setOpen(i)} />
            ))}
          </div>
        </div>
      )}
      <Lightbox pictures={pictures} index={open} onIndex={setOpen} onClose={() => setOpen(null)} label={label} />
    </>
  );
}
