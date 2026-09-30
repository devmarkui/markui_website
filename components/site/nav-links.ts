/**
 * The site's six channels, in order. The nav, the menu drawer, the footer
 * and each page's tuning scale all read this list, so the numbering (Home
 * 01 … Contact 06) is the same everywhere.
 */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type Station = (typeof NAV_LINKS)[number]["label"];

/** "02" for Projects. */
export function stationNumber(label: Station) {
  return String(NAV_LINKS.findIndex((link) => link.label === label) + 1).padStart(2, "0");
}

/** A link stays active on its nested pages too (e.g. /services/[slug]). */
export function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
