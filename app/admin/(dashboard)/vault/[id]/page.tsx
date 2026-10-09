import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import VaultEditor from "@/components/admin/vault/VaultEditor";
import { requireAdmin } from "@/lib/auth";
import { getProjects, getServices } from "@/lib/db";
import { vaultOrigin } from "@/lib/vault/links";
import { getVaultProject } from "@/lib/vault/store";
import { albumsFor } from "@/lib/vault/sync";
import { STATUS_LABELS } from "@/lib/vault/types";

export const metadata: Metadata = { title: "Edit Vault project · Admin · Mark UI" };

export default async function EditVaultProjectPage({ params }: PageProps<"/admin/vault/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/vault/${id}`);
  const project = await getVaultProject(id);
  if (!project) notFound();
  const [albums, services, mainProjects] = await Promise.all([
    albumsFor(project),
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
          <h1 className="ad-title">{project.title}</h1>
          <p className="ad-subtitle">
            {STATUS_LABELS[project.status]} · {project.blocks.length} section{project.blocks.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <VaultEditor
        // Keyed on the id, so a refresh after saving keeps the editor (and
        // anything typed since) and only switching projects remounts it.
        key={project.id}
        initial={project}
        albums={albums}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
        mainProjects={mainProjects.map((p) => ({ id: p.id, name: p.title, vaultProjectId: p.vaultProjectId }))}
        vaultOrigin={vaultOrigin()}
      />
    </>
  );
}
