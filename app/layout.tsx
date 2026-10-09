import "./globals.css";
import "@/styles/site/base.css";
import "@/styles/site/nav.css";
import "@/styles/site/footer.css";

import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";

/** The fallback for pages that set no title or description of their own. */
export const metadata: Metadata = {
  title: "Mark UI",
  description:
    "Mark UI is a creative technology studio in Colombo, Sri Lanka: IT solutions, digital marketing and media production under one roof.",
};

// The homepage's three families (public/landing loads the same ones). Each
// is exposed as a variable; styles/site/base.css builds its stacks on them.
const clash = localFont({
  src: "../public/fonts/ClashDisplay-Variable.ttf",
  weight: "200 700",
  variable: "--font-clash",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/**
 * The document shell every page shares: fonts and global styles only. The
 * site's nav and footer live in app/(site)/layout.tsx, the dashboard has its
 * own chrome under app/admin, and the Creative Vault (app/vault) has none.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${clash.variable} ${inter.variable} ${geistMono.variable}`}
      // The script below adds "js" before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* Scroll reveals only hide content when a script is there to show it. */}
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.add("js")' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
