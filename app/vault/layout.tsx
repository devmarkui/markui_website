import "@/styles/vault/vault.css";

import type { Metadata } from "next";

import SignalCursor from "@/components/site/SignalCursor";
import { vaultOrigin } from "@/lib/vault/links";

export const metadata: Metadata = {
  metadataBase: new URL(vaultOrigin()),
  title: { default: "Creative Vault · Mark UI", template: "%s · Creative Vault · Mark UI" },
  description:
    "The full portfolio of Mark UI: websites, software, campaigns, films, photography and events, each with everything we made for it.",
};

/**
 * The Creative Vault (creative.markui.lk, rewritten here by next.config.ts).
 * No navigation bar and no site footer: each page brings its own corner mark
 * and ending. The cursor is the site's.
 */
export default function VaultLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a className="skip-link sx" href="#main">
        Skip to content
      </a>
      {children}
      <SignalCursor />
    </>
  );
}
