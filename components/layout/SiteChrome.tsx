import SignalCursor from "@/components/site/SignalCursor";
import type { ContactDetails, SocialLink } from "@/lib/types";

import Footer, { type FooterService } from "./Footer";
import Navbar from "./Navbar";

/**
 * The marketing site's nav, cursor and footer. Only app/(site)/layout.tsx and
 * the site-wide 404 render them; the dashboard and the Creative Vault sit
 * outside that layout and bring their own chrome.
 */
export function SiteHeader({
  socialLinks,
  contact,
}: {
  socialLinks: SocialLink[];
  contact: ContactDetails;
}) {
  return (
    <>
      <Navbar socialLinks={socialLinks} contact={contact} />
      <SignalCursor />
    </>
  );
}

export function SiteFooter({
  socialLinks,
  contact,
  services,
  note,
}: {
  socialLinks: SocialLink[];
  contact: ContactDetails;
  services: FooterService[];
  note: string;
}) {
  return <Footer socialLinks={socialLinks} contact={contact} services={services} note={note} />;
}
