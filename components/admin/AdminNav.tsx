"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "",
    links: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/services", label: "Services" },
      { href: "/admin/top-work", label: "Service Top Work" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/settings", label: "Portfolio Settings" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="ad-side" aria-label="Admin sections">
      {GROUPS.map((group, i) => (
        <div className="ad-side-group" key={group.label || `group-${i}`}>
          {group.label ? (
            <span className="ad-side-label">{group.label}</span>
          ) : null}

          {group.links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="ad-side-link"
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
