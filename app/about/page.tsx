import type { Metadata } from "next";
import Link from "next/link";

import { getSettings } from "@/lib/db";
import type { AboutItem } from "@/lib/types";

import "./about.css";

export const metadata: Metadata = {
  title: "About · Mark UI",
  description:
    "Meet Mark UI — a creative technology company bringing design, technology, marketing and multimedia together.",
};

const number = (index: number) => String(index + 1).padStart(2, "0");

function ItemGrid({
  items,
  layout = "grid",
}: {
  items: AboutItem[];
  /** "row" lays the items out side by side, e.g. the steps of a process. */
  layout?: "grid" | "row";
}) {
  return (
    <div className="ab-item-grid" data-layout={layout}>
      {items.map((item, index) => (
        <article className="ab-item" key={`${item.title}-${index}`}>
          <span className="ab-number">{number(index)}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function AboutPage() {
  const { about } = await getSettings();

  return (
    <main className="ab-page">
      <section className="ab-hero" aria-labelledby="about-heading">
        <div className="ab-wrap ab-hero-inner">
          <p className="ab-kicker">About Mark UI</p>
          <h1 id="about-heading">
            {about.heroHeading.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <div className="ab-hero-foot">
            <span className="ab-scroll" aria-hidden="true">Scroll to discover ↓</span>
            <p>{about.introduction}</p>
          </div>
        </div>
      </section>

      <section className="ab-section ab-who" aria-labelledby="who-heading">
        <div className="ab-wrap ab-split">
          <div className="ab-section-head">
            <h2 id="who-heading" className="ab-kicker">Our story</h2>
          </div>
          <div className="ab-prose">
            {about.whoWeAre.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="ab-section" aria-labelledby="work-heading">
        <div className="ab-wrap">
          <div className="ab-title-row">
            <div>
              <h2 id="work-heading" className="ab-kicker">Our approach</h2>
            </div>
            <p>A clear process keeps the work focused, collaborative and useful.</p>
          </div>
          <ItemGrid items={about.approach} layout="row" />
        </div>
      </section>

      <section className="ab-section ab-soft" aria-labelledby="why-heading">
        <div className="ab-wrap ab-split">
          <div className="ab-section-head">
            <h2 id="why-heading" className="ab-kicker">The difference</h2>
          </div>
          <ItemGrid items={about.reasons} />
        </div>
      </section>

      <section className="ab-section" aria-labelledby="values-heading">
        <div className="ab-wrap">
          <div className="ab-title-row">
            <div><h2 id="values-heading" className="ab-kicker">What guides us</h2></div>
          </div>
          <ItemGrid items={about.values} />
        </div>
      </section>

      <section className="ab-section ab-team" aria-labelledby="team-heading">
        <div className="ab-wrap ab-split">
          <div className="ab-section-head">
            <h2 id="team-heading">Meet{" "}<br />the team</h2>
          </div>
          <div className="ab-team-empty">
            <span aria-hidden="true">M/UI</span>
            <p>Team profiles are being prepared. In the meantime, get in touch to meet the people behind the work.</p>
            <Link className="ab-text-link" href="/contact">Start a conversation <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="ab-cta" aria-labelledby="cta-heading">
        <div className="ab-wrap ab-cta-inner">
          <p className="ab-kicker">Start a project</p>
          <h2 id="cta-heading">{about.ctaHeading}</h2>
          <div>
            <p>{about.ctaText}</p>
            <Link href="/contact">Contact us <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
