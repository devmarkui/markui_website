import type { MetadataRoute } from "next";

import { getProjects, getServices } from "@/lib/db";
import { projectCover } from "@/lib/projects";

const SITE = "https://markui.lk";

/** Hourly, so services and projects added in the admin appear without a deploy. */
export const revalidate = 3600;

/**
 * The pages the site links to. /proposal, /careers and /insights are left out
 * while they are still placeholders.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects] = await Promise.all([getServices(), getProjects()]);

  return [
    { url: `${SITE}/`, priority: 1 },
    ...["/services", "/projects", "/products", "/about", "/contact"].map((path) => ({
      url: `${SITE}${path}`,
      priority: 0.8,
    })),
    ...services.map((service) => ({
      url: `${SITE}/services/${service.slug}`,
      lastModified: service.updatedAt,
      priority: 0.7,
    })),
    // Only the projects the Projects page actually lists.
    ...projects
      .filter((project) => projectCover(project))
      .map((project) => ({
        url: `${SITE}/projects/${project.slug}`,
        lastModified: project.updatedAt,
        priority: 0.6,
      })),
  ];
}
