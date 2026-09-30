import Link from "next/link";

import Chan from "./Chan";
import { Arrow } from "./icons";
import { LiveSection, Reveal } from "./Reveal";

/**
 * The last ground before the footer on every page: a two-volume line, a
 * sentence, and the two ways in — a project enquiry and a call.
 */
export default function ClosingCta({
  quiet,
  loud,
  text,
  primary = { href: "/contact", label: "Start a project" },
  secondary = { href: "/proposal", label: "Book a call" },
  ground = "soot",
}: {
  quiet: string;
  loud: string;
  text: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
  ground?: "soot" | "signal";
}) {
  return (
    <LiveSection
      className={`cta ground ground-${ground}`}
      data-ground={ground}
      aria-labelledby="cta-title"
    >
      <div className="wrap cta-inner">
        <Chan>Start a project</Chan>
        <h2 className="cta-title" id="cta-title">
          <span className="q">{quiet}</span> {loud}
          <span className="stop">.</span>
        </h2>
        <Reveal className="cta-side">
          <p className="cta-text">{text}</p>
          <div className="btn-row">
            <Link
              className={ground === "signal" ? "btn-signal btn-ink" : "btn-signal"}
              href={primary.href}
            >
              {primary.label} <Arrow />
            </Link>
            {secondary ? (
              <Link className="btn-line" href={secondary.href}>
                {secondary.label} <Arrow />
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </LiveSection>
  );
}
