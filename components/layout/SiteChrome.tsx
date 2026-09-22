"use client";

import { usePathname } from "next/navigation";

import type { SocialLink } from "@/lib/types";

import Footer from "./Footer";
import Navbar from "./Navbar";

/**
 * The admin dashboard has its own header and needs the full viewport, so the
 * marketing navbar and footer step aside on `/admin` routes. Every other page
 * is unchanged.
 */
function isAdminRoute(pathname: string | null) {
  return Boolean(pathname && pathname.startsWith("/admin"));
}

export function SiteHeader() {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return <Navbar />;
}

export function SiteFooter({ socialLinks }: { socialLinks: SocialLink[] }) {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return <Footer socialLinks={socialLinks} />;
}
