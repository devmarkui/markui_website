import "./about.css";

import Link from "next/link";
import type { CSSProperties } from "react";

import Chan from "@/components/site/Chan";
import ClosingCta from "@/components/site/ClosingCta";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import type { AboutContent, TrustStat } from "@/lib/types";

import Wave from "./Wave";

const pad = (n: number) => String(n).padStart(2, "0");

/** "We create\ndigital experiences\nthat matter." → quiet lines, then the loud last line. */
function splitHeading(heading: string) {
  const lines = heading
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const last = lines.pop() ?? "";
  const stop = last.endsWith(".");
  return { quiet: lines.join(" "), loud: stop ? last.slice(0, -1) : last, stop };
}

/** "Let's work together" → "Let's work" quiet, "together" loud. */
function splitLine(line: string) {
  const words = line.trim().replace(/[.!]$/, "").split(/\s+/);
  const loud = words.pop() ?? "";
  return { quiet: words.join(" "), loud };
}

/** "+40%" → the digits loud, the signs in orange. */
function StatValue({ value }: { value: string }) {
  return (
    <>
      {value.split(/(\d+(?:[.,]\d+)?)/).map((part, i) =>
        /\d/.test(part) ? part : part ? <span className="unit" key={i}>{part}</span> : null,
      )}
    </>
  );
}

/**
 * The public /about page. Every word of it is edited in the dashboard: the
 * About copy (heading, story, approach, reasons, expertise, values, closing
 * call) and the Trust stats, which the homepage shares.
 */
export default function AboutPage({ about, stats }: { about: AboutContent; stats: TrustStat[] }) {
  const heading = splitHeading(about.heroHeading);
  const cta = splitLine(about.ctaHeading);
  const story = about.whoWeAre
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const [lead, ...rest] = story;
  const steps = about.approach;
  let section = 0;
  const next = () => pad(++section);

  return (
    <SitePage>
      <Masthead
        station="About"
        label="About Mark UI"
        titleId="about-title"
        quiet={heading.quiet || undefined}
        loud={heading.loud}
        stop={heading.stop}
        lede={<p>{about.introduction}</p>}
      />

      {story.length ? (
        <LiveSection className="ab-story ground ground-carbon" data-ground="carbon" aria-labelledby="ab-story-title">
          <div className="wrap ab-story-grid">
            <Chan num={next()}>
              <span id="ab-story-title">Our story</span>
            </Chan>
            <Reveal className="ab-story-text">
              <p className="ab-story-lead">{lead}</p>
              {rest.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </Reveal>
          </div>
        </LiveSection>
      ) : null}

      {stats.length ? (
        <LiveSection className="ab-proof ground ground-carbon" data-ground="carbon" aria-label="By the numbers">
          <div className="wrap">
            <dl
              className="ab-proof-grid"
              style={{ "--cols": Math.min(4, stats.length) } as CSSProperties}
            >
              {stats.map((stat, i) => (
                <Reveal className="ab-stat" key={`${stat.label}-${i}`} delay={i}>
                  <dt>{stat.label}</dt>
                  <dd className="ab-stat-value">
                    <StatValue value={stat.value} />
                    {stat.suffix ? <span className="ab-stat-suffix">{stat.suffix}</span> : null}
                  </dd>
                  {stat.description ? <dd className="ab-stat-note">{stat.description}</dd> : null}
                </Reveal>
              ))}
            </dl>
          </div>
        </LiveSection>
      ) : null}

      {steps.length ? (
        <LiveSection className="ab-approach ground ground-bone" data-ground="bone" aria-labelledby="ab-approach-title">
          <div className="wrap">
            <div className="sec-head">
              <Chan num={next()}>Our approach</Chan>
              <h2 className="sec-title" id="ab-approach-title">
                <span className="q">{steps.length === 4 ? "Four stages." : `${steps.length} stages.`}</span> One clean
                signal.
              </h2>
              <p className="sec-lede">A clear process keeps the work focused, collaborative and useful.</p>
            </div>
            <Wave />
            <ol className="ab-steps" style={{ "--cols": Math.min(4, steps.length) } as CSSProperties}>
              {steps.map((step, i) => (
                <Reveal
                  as="li"
                  className="ab-step"
                  key={`${step.title}-${i}`}
                  delay={i}
                  style={{ "--s": steps.length > 1 ? i / (steps.length - 1) : 1 } as CSSProperties}
                >
                  <span className="ab-step-num">{pad(i + 1)}</span>
                  <h3 className="ab-step-name">{step.title}</h3>
                  <p className="ab-step-text">{step.description}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </LiveSection>
      ) : null}

      {about.reasons.length ? (
        <LiveSection className="ab-diff ground ground-carbon" data-ground="carbon" aria-labelledby="ab-diff-title">
          <div className="wrap">
            <div className="sec-head">
              <Chan num={next()}>The difference</Chan>
              <h2 className="sec-title" id="ab-diff-title">
                <span className="q">Why teams</span> choose Mark UI.
              </h2>
            </div>
            <ul className="ab-rows">
              {about.reasons.map((reason, i) => (
                <li className="ab-row" key={`${reason.title}-${i}`}>
                  <span className="ab-row-num">{pad(i + 1)}</span>
                  <h3 className="ab-row-title">{reason.title}</h3>
                  <p className="ab-row-text">{reason.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </LiveSection>
      ) : null}

      {about.values.length ? (
        <LiveSection className="ab-values ground ground-signal" data-ground="signal" aria-labelledby="ab-values-title">
          <div className="wrap">
            <div className="sec-head">
              <Chan num={next()}>What guides us</Chan>
              <h2 className="sec-title" id="ab-values-title">
                <span className="q">The values we</span> work by.
              </h2>
            </div>
            <ul className="ab-values-grid" style={{ "--cols": Math.min(4, about.values.length) } as CSSProperties}>
              {about.values.map((value, i) => (
                <Reveal as="li" className="ab-value" key={`${value.title}-${i}`} delay={i}>
                  <span className="ab-value-num">{pad(i + 1)}</span>
                  <h3 className="ab-value-title">{value.title}</h3>
                  <p className="ab-value-text">{value.description}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </LiveSection>
      ) : null}

      {about.expertise.length ? (
        <LiveSection className="ab-expertise ground ground-carbon" data-ground="carbon" aria-labelledby="ab-expertise-title">
          <div className="wrap">
            <Chan num={next()}>
              <span id="ab-expertise-title">Our expertise</span>
            </Chan>
            <ul className="ch-rows">
              {about.expertise.map((item, i) => (
                <li key={`${item.href}-${i}`}>
                  <Link className="ch-row" href={item.href}>
                    <span className="ch-row-num">CH {pad(i + 1)}</span>
                    <span className="ch-row-name">{item.title}</span>
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </LiveSection>
      ) : null}

      <LiveSection className="ab-team ground ground-carbon" data-ground="carbon" aria-labelledby="ab-team-title">
        <div className="wrap ab-team-grid">
          <Chan num={next()}>The team</Chan>
          <p className="ab-team-mark" aria-hidden="true">
            M<b>/</b>UI
          </p>
          <Reveal className="ab-team-side">
            <h2 id="ab-team-title">Meet the people behind the work.</h2>
            <p>
              Team profiles are being prepared. In the meantime, get in touch and meet the designers, developers and
              producers who&apos;ll work on your project.
            </p>
            <Link className="btn-line" href="/contact">
              Start a conversation <Arrow />
            </Link>
          </Reveal>
        </div>
      </LiveSection>

      <ClosingCta
        quiet={cta.quiet}
        loud={cta.loud}
        text={about.ctaText}
        primary={{ href: "/contact", label: "Contact us" }}
      />
    </SitePage>
  );
}
