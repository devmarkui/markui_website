import type { Metadata } from "next";
import Link from "next/link";

import VaultProjectList, { type ListRow } from "@/components/admin/vault/VaultProjectList";
import { requireAdmin } from "@/lib/auth";
import { getProjects, getServices } from "@/lib/db";
import { vaultOrigin, vaultUrl } from "@/lib/vault/links";
import { listVaultProjects } from "@/lib/vault/store";

export const metadata: Metadata = { title: "Creative Vault · Admin · Mark UI" };

export default async function VaultAdminPage() {
  await requireAdmin("/admin/vault");
  const [projects, services, mainProjects] = await Promise.all([
    listVaultProjects(),
    getServices({ includeInactive: true }),
    getProjects({ includeInactive: true }),
  ]);
  const serviceName = new Map(services.map((s) => [s.id, s.name]));
  const linkedFrom = new Map(mainProjects.filter((p) => p.vaultProjectId).map((p) => [p.vaultProjectId!, p.title]));
  const origin = vaultOrigin();

  const rows: ListRow[] = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    client: p.client,
    service: serviceName.get(p.serviceId) ?? "",
    serviceId: p.serviceId,
    status: p.status,
    featured: p.featured,
    sections: p.blocks.length,
    updatedAt: p.updatedAt,
    cover: p.cover?.media ?? null,
    linkedFrom: linkedFrom.get(p.id),
  }));

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Creative Vault</h1>
          <p className="ad-subtitle">
            The full portfolio at{" "}
            <a href={vaultUrl(origin)} target="_blank" rel="noopener noreferrer">
              {origin.replace(/^https?:\/\//, "")}
            </a>
            : every project with its films, posters, photos and the products themselves. Projects on markui.lk link
            here with &ldquo;Explore the full project&rdquo;.
          </p>
        </div>
        <Link className="ad-btn ad-btn--primary" href="/admin/vault/new">
          + New project
        </Link>
      </div>
      <VaultProjectList rows={rows} services={services.map((s) => ({ id: s.id, name: s.name }))} vaultOrigin={origin} />
    </>
  );
}
