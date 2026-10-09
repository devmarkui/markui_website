import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import Chan from "@/components/site/Chan";
import { Arrow } from "@/components/site/icons";
import SitePage from "@/components/site/SitePage";
import { getServices, getSettings } from "@/lib/db";

/**
 * The site-wide 404. It sits above app/(site)/layout.tsx, so it brings the
 * nav and footer itself.
 */
export default async function NotFound() {
  const [{ socialLinks, contact, content }, services] = await Promise.all([getSettings(), getServices()]);

  return (
    <>
      <SiteHeader socialLinks={socialLinks} contact={contact} />
      <SitePage>
        <section className="mast ground ground-carbon" data-mast data-ground="carbon" aria-labelledby="nf-title">
          <div className="wrap mast-inner">
            <Chan num="404" className="is-live">
              Not found
            </Chan>
            <h1 className="mast-title" id="nf-title">
              <span className="mast-q">Lost the</span>{" "}
              <span className="mast-l">
                signal<span className="mast-stop">.</span>
              </span>
            </h1>
            <div className="mast-foot">
              <div className="mast-lede">
                <p>This page could not be found. It may have moved, or the link may be mistyped.</p>
              </div>
              <div className="btn-row">
                <Link className="btn-signal" href="/">
                  Back to home <Arrow />
                </Link>
                <Link className="btn-line" href="/projects">
                  See our projects <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SitePage>
      <SiteFooter
        socialLinks={socialLinks}
        contact={contact}
        services={services.map(({ name, slug }) => ({ name, slug }))}
        note={content.footerNote}
      />
    </>
  );
}
