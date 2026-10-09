import type { Metadata } from "next";

import VaultMediaLibrary from "@/components/admin/vault/VaultMediaLibrary";
import { requireAdmin } from "@/lib/auth";
import { diskUsage, maxUploadBytes } from "@/lib/vault/files";
import { formatBytes } from "@/lib/vault/media-types";
import { listVaultMedia } from "@/lib/vault/store";

export const metadata: Metadata = { title: "Vault media · Admin · Mark UI" };

export default async function VaultMediaPage() {
  await requireAdmin("/admin/vault/media");
  const [media, usage] = await Promise.all([listVaultMedia(), diskUsage()]);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Vault media</h1>
          <p className="ad-subtitle">
            Everything uploaded for the Vault: photos, video, PDFs and source files, up to {formatBytes(maxUploadBytes())}{" "}
            each. Photos get a web-sized copy automatically; HEIC and TIFF are converted so every browser can show them.
          </p>
        </div>
      </div>
      <VaultMediaLibrary media={media} usage={usage} />
    </>
  );
}
