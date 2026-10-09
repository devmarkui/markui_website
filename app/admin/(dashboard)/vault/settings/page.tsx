import type { Metadata } from "next";

import VaultSettingsForm from "@/components/admin/vault/VaultSettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getVaultSettings } from "@/lib/vault/store";

export const metadata: Metadata = { title: "Vault page · Admin · Mark UI" };

export default async function VaultSettingsPage() {
  await requireAdmin("/admin/vault/settings");
  const settings = await getVaultSettings();

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Vault page</h1>
          <p className="ad-subtitle">
            The text on the Vault&rsquo;s front page and what search engines and link previews show.
          </p>
        </div>
      </div>
      <VaultSettingsForm initial={settings} />
    </>
  );
}
