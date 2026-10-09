import type { Metadata } from "next";
import Link from "next/link";

import NewVaultProject from "@/components/admin/vault/NewVaultProject";
import { requireAdmin } from "@/lib/auth";
import { getProjects, getServices } from "@/lib/db";

export const metadata: Metadata = { title: "New Vault project · Admin · Mark UI" };

export default async function NewVaultProjectPage() {
  await requireAdmin("/admin/vault/new");
  const [services, projects] = await Promise.all([
    getServices({ includeInactive: true }),
    getProjects({ includeInactive: true }),
  ]);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <Link className="vx-back" href="/admin/vault">
            ← Creative Vault
          </Link>
          <h1 className="ad-title">New project</h1>
          <p className="ad-subtitle">It starts as a draft. Fill it in, preview it, then publish.</p>
        </div>
      </div>
      <NewVaultProject
        services={services.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
        mainProjects={projects.map((p) => ({
          id: p.id,
          title: p.title,
          client: p.client,
          serviceId: p.serviceIds?.[0],
          linked: Boolean(p.vaultProjectId),
        }))}
      />
    </>
  );
}
