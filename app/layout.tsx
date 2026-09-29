import "./globals.css";

import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getSettings } from "@/lib/db";

/** The fallback for pages that set no title or description of their own. */
export const metadata: Metadata = {
  title: "Mark UI",
  description:
    "Mark UI is a creative technology studio in Colombo, Sri Lanka: IT solutions, digital marketing and media production under one roof.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Social links are managed in the dashboard (Footer & Social).
  const { socialLinks } = await getSettings();

  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter socialLinks={socialLinks} />
      </body>
    </html>
  );
}
