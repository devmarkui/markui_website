import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import ProjectView from "@/components/vault/ProjectView";
import { projectJsonLd, projectMetadata, projectPageData } from "@/lib/vault/page-data";
import { findVaultProjectBySlug } from "@/lib/vault/store";

// Built on first visit and kept; the dashboard refreshes it on every save.
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/vault/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await findVaultProjectBySlug(slug);
  return found ? projectMetadata(found.project) : {};
}

export default async function VaultProjectPage({ params }: PageProps<"/vault/[slug]">) {
  const { slug } = await params;
  const found = await findVaultProjectBySlug(slug);
  if (!found) notFound();
  // A project whose link changed: send old links to the new one.
  if (found.moved) permanentRedirect(`/${found.project.slug}`);

  const { project } = found;
  const data = await projectPageData(project);

  return (
    <>
      <script
        type="application/ld+json"
        // The object is built from sanitised fields; < is escaped so no value can close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(project, data.serviceName)).replace(/</g, "\\u003c") }}
      />
      <ProjectView project={project} {...data} />
    </>
  );
}
