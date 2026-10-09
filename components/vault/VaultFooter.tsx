"use client";

import Link from "next/link";

import { useSeen } from "@/components/site/hooks";
import { Arrow } from "@/components/site/icons";

/**
 * The Vault's quiet ending: the way in to a new project, back to markui.lk,
 * and the site's finale line, which docks its full stop as it arrives
 * (styles/site/footer.css).
 */
export default function VaultFooter({ siteOrigin, cta }: { siteOrigin: string; cta: { label: string; url: string } }) {
  const [ref, docked] = useSeen<HTMLParagraphElement>("0px 0px -20% 0px");
  const year = new Date().getFullYear();
  return (
    <footer className="footer sx vt-footer">
      <div className="footer-inner">
        <div className="vt-footer-top">
          <p className="vt-footer-line">
            <span className="q">Like what you see?</span> Let&rsquo;s make yours<span className="stop">.</span>
          </p>
          <div className="btn-row">
            <a className="btn-signal" href={cta.url}>
              {cta.label} <Arrow />
            </a>
            <a className="btn-line" href={siteOrigin}>
              markui.lk <Arrow />
            </a>
          </div>
        </div>

        <p className={docked ? "finale is-docked" : "finale"} ref={ref}>
          <span className="finale-kicker" aria-hidden="true">
            <span className="finale-led" />
            Signal received
          </span>
          <span className="finale-q">
            Less Noise<span className="finale-q-stop">.</span>
          </span>{" "}
          <span className="finale-l">
            <span className="finale-word">More Impact</span>
            <span className="finale-stop" aria-hidden="true" />
            <span className="sr-only">.</span>
          </span>
        </p>

        <div className="footer-bottom">
          <p>© {year} Mark UI. All rights reserved.</p>
          <Link href="/">Creative Vault</Link>
          <a className="footer-top-link" href="#main">
            Back to top <Arrow className="btn-arrow footer-up" />
          </a>
        </div>
      </div>
    </footer>
  );
}
