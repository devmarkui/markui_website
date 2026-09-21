import type { Metadata } from "next";

import ProjectsPortfolio from "@/components/sections/projects/ProjectsPortfolio";
import { getProjects } from "@/lib/db";
import { PROJECT_CATEGORIES, type ProjectFilter } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects · Mark UI",
  description:
    "Selected web, marketing, branding and multimedia work Mark UI has designed, built and delivered for clients.",
};

/** `?category=web` → "Web"; anything else shows every project. */
function toFilter(value: string | string[] | undefined): ProjectFilter {
  const wanted = typeof value === "string" ? value.toLowerCase() : "";
  return PROJECT_CATEGORIES.find((c) => c.toLowerCase() === wanted) ?? "All";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [projects, { category }] = await Promise.all([
    getProjects(),
    searchParams,
  ]);

  return (
    <main className="overflow-x-hidden">
      <ProjectsPortfolio projects={projects} initialFilter={toFilter(category)} />
    </main>
  );
}
