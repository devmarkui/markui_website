import type { Metadata } from "next";

import "@/styles/admin.css";

export const metadata: Metadata = {
  title: "Admin · Mark UI",
  // The dashboard should never show up in search results.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="ad-root">{children}</div>;
}
