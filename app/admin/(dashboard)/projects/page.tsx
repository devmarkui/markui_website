import ProjectManager from "@/components/admin/ProjectManager";
import { requireAdmin } from "@/lib/auth";
import { getProjects, getServices } from "@/lib/db";

export default async function AdminProjectsPage() {
  await requireAdmin("/admin/projects");
  // Hidden projects must stay listed here so they can be switched back on.
  const [projects, services] = await Promise.all([
    getProjects({ includeInactive: true }),
    getServices({ includeInactive: true }),
  ]);

  return <ProjectManager projects={projects} services={services} />;
}
