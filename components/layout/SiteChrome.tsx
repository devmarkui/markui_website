"use client";

import { usePathname } from "next/navigation";

import SignalCursor from "@/components/site/SignalCursor";
import type { ContactDetails, SocialLink } from "@/lib/types";

import Footer, { type FooterService } from "./Footer";
import Navbar from "./Navbar";

/**
 * The admin dashboard has its own header and needs the full viewport, so the
 * marketing navbar, footer and cursor step aside on `/admin` routes. Every
 * other page gets them.
 */
function isAdminRoute(pathname: string | null) {
  return Boolean(pathname && pathname.startsWith("/admin"));
}

export function SiteHeader({
  socialLinks,
  contact,
}: {
  socialLinks: SocialLink[];
  contact: ContactDetails;
}) {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
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
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return <Footer socialLinks={socialLinks} contact={contact} services={services} note={note} />;
}
