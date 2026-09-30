import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import Chan from "./Chan";
import { NAV_LINKS, stationNumber, type Station } from "./nav-links";

export interface Readout {
  label: string;
  value: string;
}

/**
 * The opening ground of every page: channel label, a two-volume title (the
 * quiet half at 200, the loud half turned up to 600 as the page loads), the
 * lede and readouts, and the tuning scale with its needle on this page's
 * station. The nav watches `[data-mast]` to know when you are past it.
 */
export default function Masthead({
  station,
  label,
  quiet,
  loud,
  stop = true,
  lede,
  readouts = [],
  back,
  titleId,
  size,
  facts,
  backdrop,
  children,
}: {
  /** Which of the six channels this page sits on (the needle, the number). */
  station: Station;
  /** The channel label; defaults to the station's name. */
  label?: string;
  quiet?: string;
  loud: string;
  /** An orange full stop after the loud half. */
  stop?: boolean;
  lede?: ReactNode;
  readouts?: Readout[];
  back?: { href: string; label: string };
  titleId: string;
  /** "m" for long titles, such as a project or service name. */
  size?: "m";
  /** Word readouts (Client, Industry…): set smaller, across the full width. */
  facts?: Readout[];
  /** An image washed in behind the title (a service's picture). */
  backdrop?: string;
  children?: ReactNode;
}) {
  const at = NAV_LINKS.findIndex((link) => link.label === station);

  return (
    <section className="mast ground ground-carbon" data-mast data-ground="carbon" aria-labelledby={titleId}>
      {backdrop ? (
        <div className="mast-backdrop" aria-hidden="true">
          <Image src={backdrop} alt="" fill sizes="100vw" preload />
        </div>
      ) : null}
      <div className="wrap mast-inner">
        {back ? (
          <Link className="mast-back" href={back.href}>
            ← {back.label}
          </Link>
        ) : null}
        <Chan num={stationNumber(station)} className="is-live">
          {label ?? station}
        </Chan>

        <h1 className="mast-title" id={titleId} data-size={size}>
          {quiet ? <span className="mast-q">{quiet}</span> : null}{" "}
          <span className="mast-l">
            {loud}
            {stop ? <span className="mast-stop">.</span> : null}
          </span>
        </h1>

        {lede || readouts.length || facts?.length || children ? (
          <div className="mast-foot">
            {lede ? <div className="mast-lede">{lede}</div> : null}
            {readouts.length ? (
              <dl className="mast-read">
                {readouts.map((r) => (
                  <div key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {children}
            {facts?.length ? (
              <dl className="mast-read mast-facts">
                {facts.map((r) => (
                  <div key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="wrap" aria-hidden="true">
        <div
          className="dial"
          style={{ "--at": at, "--n": NAV_LINKS.length } as CSSProperties}
        >
          <div className="dial-scale" />
          <div className="dial-stations">
            {NAV_LINKS.map((link, i) => (
              <span
                className="dial-station"
                key={link.href}
                data-on={i === at ? "" : undefined}
              >
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{link.label}</span>
              </span>
            ))}
          </div>
          <span className="dial-needle" />
        </div>
      </div>
    </section>
  );
}
