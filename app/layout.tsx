import "./globals.css";

import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getSettings } from "@/lib/db";

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
