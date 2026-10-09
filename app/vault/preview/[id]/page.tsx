import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProjectView from "@/components/vault/ProjectView";
import { projectPageData } from "@/lib/vault/page-data";
import { checkPreviewToken } from "@/lib/vault/preview";
import { getVaultProject } from "@/lib/vault/store";
import { STATUS_LABELS } from "@/lib/vault/types";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * A draft (or any project) as it will look, opened from the dashboard's
 * Preview button with a signed, week-long link.
 */
export default async function VaultPreviewPage({ params, searchParams }: PageProps<"/vault/preview/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.t === "string" ? query.t : undefined;
  if (!checkPreviewToken(id, token)) notFound();
  const project = await getVaultProject(id);
  if (!project) notFound();
  const data = await projectPageData(project);

  return (
    <ProjectView
      project={project}
      {...data}
      banner={`Preview · ${STATUS_LABELS[project.status]}${project.status === "draft" ? " — only people with this link can see it" : ""}`}
    />
  );
}
