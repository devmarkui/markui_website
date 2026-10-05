"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSeen } from "@/components/site/hooks";
import { Arrow } from "@/components/site/icons";
import { NAV_LINKS, isActive } from "@/components/site/nav-links";
import { BOOK_CALL_HREF, mailHref, phoneLines, telHref } from "@/lib/contact-details";
import type { ContactDetails, SocialLink } from "@/lib/types";

export interface FooterService {
  name: string;
  slug: string;
}

/**
 * The homepage's footer on every page (styles/site/footer.css): the brand
 * and the call, navigation, services, contact and social, then the finale —
 * "Less Noise. More Impact" — which docks its full stop as it comes into view.
 */
export default function Footer({
  socialLinks,
  contact,
  services,
  note,
}: {
  socialLinks: SocialLink[];
  /** Managed in the dashboard (Contact Details). */
  contact: ContactDetails;
  services: FooterService[];
  /** The sentence under the logo, managed in the dashboard (Page Text). */
  note: string;
}) {
  const pathname = usePathname();
  const [finaleRef, docked] = useSeen<HTMLParagraphElement>("0px 0px -20% 0px");
  const year = new Date().getFullYear();

  return (
    <footer className="footer sx">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="footer-logo" href="/" aria-label="Mark UI home">
              <Image src="/brand/markui-logo-white.png" alt="Mark UI" width={1600} height={319} sizes="140px" />
            </Link>
            <p className="footer-note">{note}</p>
            <Link className="btn-signal" href={BOOK_CALL_HREF}>
              Book a Call <Arrow />
            </Link>
          </div>

          <nav className="footer-col footer-col-nav" aria-labelledby="footer-nav-title">
            <p className="footer-title" id="footer-nav-title">
              Navigate
            </p>
            <ul className="footer-list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    className="footer-link"
                    href={href}
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {services.length ? (
            <nav className="footer-col footer-col-services" aria-labelledby="footer-services-title">
              <p className="footer-title" id="footer-services-title">
                Services
              </p>
              <ul className="footer-list">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link className="footer-link" href={`/services/${service.slug}`}>
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="footer-col footer-col-contact">
            <p className="footer-title">Contact</p>
            <ul className="footer-list">
              {phoneLines(contact).map((line) => (
                <li key={line.tel}>
                  <a className="footer-link" href={telHref(line)}>
                    {line.label}
                  </a>
                </li>
              ))}
              <li>
                <a className="footer-link" href={mailHref(contact.email)}>
                  {contact.email}
                </a>
              </li>
              <li>
                <span className="footer-plain">{contact.location}</span>
              </li>
            </ul>
            {socialLinks.length ? (
              <>
                <p className="footer-title">Follow</p>
                <ul className="footer-list">
                  {socialLinks.map((s) => (
                    <li key={`${s.label}-${s.url}`}>
                      <a className="footer-link" href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>

        <p className={docked ? "finale is-docked" : "finale"} ref={finaleRef}>
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
          <p>Colombo · Since 2023</p>
          <a className="footer-top-link" href="#main">
            Back to top <Arrow className="btn-arrow footer-up" />
          </a>
        </div>
      </div>
    </footer>
  );
}
