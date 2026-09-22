import ProjectsShowcase from "@/components/sections/projects/ProjectsShowcase";
import { getProjects } from "@/lib/db";

/**
 * Home-page "Our Projects" section. Reads straight from the store so whatever
 * the admin publishes appears here; the grid itself is a Client Component so
 * category filtering happens without a page reload, and the categories step
 * through on a timer until the visitor picks one.
 */
export default async function FeaturedProjects() {
  const projects = await getProjects();

  return <ProjectsShowcase projects={projects} limit={6} autoCycle />;
}
