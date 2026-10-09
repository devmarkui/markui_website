import ProjectManager from "@/components/admin/ProjectManager";
import { requireAdmin } from "@/lib/auth";
import { getProjects, getServices } from "@/lib/db";
import { listVaultProjects } from "@/lib/vault/store";

export default async function AdminProjectsPage() {
  await requireAdmin("/admin/projects");
  // Hidden projects must stay listed here so they can be switched back on.
  const [projects, services, vault] = await Promise.all([
    getProjects({ includeInactive: true }),
    getServices({ includeInactive: true }),
    listVaultProjects(),
  ]);

  return (
    <ProjectManager
      projects={projects}
      services={services}
      vaultProjects={vault.map((p) => ({ id: p.id, title: p.title, status: p.status }))}
    />
  );
}
