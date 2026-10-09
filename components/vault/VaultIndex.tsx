"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import "@/components/sections/projects/projects.css";
import { Arrow } from "@/components/site/icons";
import { coverStill } from "@/lib/vault/media-urls";
import type { MediaRef } from "@/lib/vault/types";

import VPrint from "./VPrint";

export interface VaultCard {
  id: string;
  slug: string;
  title: string;
  client: string;
  service: string;
  serviceSlug: string;
  year: string;
  summary: string;
  cover: { kind: "image" | "video"; media: MediaRef } | null;
  /** "3 films · 248 photos · Live site". */
  contents: string[];
  featured: boolean;
}

/**
 * The Vault's gallery wall, on the site's paper ground: the projects hung in
 * the main site's five-slot rhythm, with a sticky tuner to pick a service.
 * The choice is kept in ?service= so a filtered wall can be linked to (the
 * service pages on markui.lk do).
 */
export default function VaultIndex({ cards, services }: { cards: VaultCard[]; services: { slug: string; name: string; count: number }[] }) {
  const [service, setService] = useState("");

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("service") ?? "";
    // Read once on arrival: the page itself is static.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (services.some((s) => s.slug === wanted)) setService(wanted);
  }, [services]);

  const pick = (slug: string) => {
    setService(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("service", slug);
    else url.searchParams.delete("service");
    window.history.replaceState(null, "", url);
  };

  const shown = service ? cards.filter((c) => c.serviceSlug === service) : cards;

  return (
    <section className="wall vt-wall ground ground-paper" data-ground="paper" aria-label="Projects">
      <div className="wrap">
        {services.length > 1 ? (
          <div className="tuner vt-tuner" role="group" aria-label="Filter by service">
            <span className="tuner-label">Tune</span>
            <div className="tuner-options">
              <button type="button" className="tuner-btn" aria-pressed={service === ""} onClick={() => pick("")}>
                <span className="tuner-name" data-label="Everything">
                  Everything
                </span>
                <span className="tuner-count">{cards.length}</span>
              </button>
              {services.map((s) => (
                <button key={s.slug} type="button" className="tuner-btn" aria-pressed={service === s.slug} onClick={() => pick(s.slug)}>
                  <span className="tuner-name" data-label={s.name}>
                    {s.name}
                  </span>
                  <span className="tuner-count">{s.count}</span>
                </button>
              ))}
            </div>
            <span className="tuner-status" aria-live="polite">
              {shown.length} project{shown.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        {shown.length === 0 ? (
          <p className="vt-empty">Nothing here yet. New work is on its way.</p>
        ) : (
          <ul className="wall-grid vt-wall-grid" key={service}>
            {shown.map((card, i) => (
              <li className="wall-item" key={card.id}>
                <Link className="wall-card" href={`/${card.slug}`} data-cursor="View">
                  <VPrint
                    src={coverStill(card.cover?.media)}
                    srcSet={
                      card.cover?.kind === "image" && card.cover.media.thumb && card.cover.media.display
                        ? `${card.cover.media.thumb} 720w, ${card.cover.media.display} 2400w`
                        : undefined
                    }
                    sizes="(min-width: 1100px) 58vw, 92vw"
                    video={card.cover?.kind === "video" ? card.cover.media.url : undefined}
                    poster={card.cover?.kind === "video" ? card.cover.media.poster : undefined}
                    playOnHover
                    eager={i < 2}
                    alt=""
                  >
                    {card.featured ? <span className="wall-flag">Featured</span> : null}
                    <span className="print-view">
                      Open project <Arrow />
                    </span>
                  </VPrint>
                  <span className="wall-caption">
                    <span className="wall-index">{String(i + 1).padStart(2, "0")}</span>
                    <span className="wall-name">{card.title}</span>
                    <span className="wall-meta">
                      {card.client ? <span>{card.client}</span> : null}
                      {card.service ? <span>{card.service}</span> : null}
                      {card.year ? <span>{card.year}</span> : null}
                    </span>
                    {card.contents.length ? <span className="vt-contents mono">{card.contents.join(" · ")}</span> : null}
                    {card.summary ? <span className="wall-desc">{card.summary}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
