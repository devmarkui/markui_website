"use client";

import { usePathname } from "next/navigation";

import SignalCursor from "@/components/site/SignalCursor";
import type { SocialLink } from "@/lib/types";

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

export function SiteHeader({ socialLinks }: { socialLinks: SocialLink[] }) {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return (
    <>
      <Navbar socialLinks={socialLinks} />
      <SignalCursor />
    </>
  );
}

export function SiteFooter({
  socialLinks,
  services,
}: {
  socialLinks: SocialLink[];
  services: FooterService[];
}) {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return <Footer socialLinks={socialLinks} services={services} />;
}
