import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProjectDetail from "@/components/sections/projects/ProjectDetail";
import { getProjectBySlug, getProjects, getServices } from "@/lib/db";
import { projectCover, projectGallery } from "@/lib/projects";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/** Hidden projects 404 exactly like missing ones. */
async function findProject(slug: string) {
  const project = await getProjectBySlug(slug);
  return project && project.active !== false ? project : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) return { title: "Project not found · Mark UI" };

  return {
    title: `${project.title} · Projects · Mark UI`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) notFound();

  const [projects, services] = await Promise.all([getProjects(), getServices()]);

  // "Next project" follows the Projects page order and skips anything the
  // page itself would not show.
  const listed = projects.filter((p) => projectCover(p));
  const at = listed.findIndex((p) => p.id === project.id);
  const next =
    listed.length > 1
      ? listed[(at === -1 ? 0 : at + 1) % listed.length]
      : null;

  // The cover already fills the hero, so don't repeat it in the gallery.
  const cover = projectCover(project);
  const gallery = projectGallery(project).filter(
    (item) => !(item.type === "image" && cover && item.image === cover.image),
  );

  const linkedServices = services.filter((s) =>
    project.serviceIds?.includes(s.id),
  );

  return (
    <main className="overflow-x-hidden">
      <ProjectDetail
        project={project}
        cover={cover}
        gallery={gallery}
        services={linkedServices.map((s) => ({ name: s.name, slug: s.slug }))}
        next={
          next && next.id !== project.id
            ? {
                slug: next.slug,
                title: next.title,
                category: next.category,
                image: next.image,
              }
            : null
        }
      />
    </main>
  );
}
