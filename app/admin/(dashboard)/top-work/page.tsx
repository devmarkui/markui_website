import TopWorkManager from "@/components/admin/TopWorkManager";
import { requireAdmin } from "@/lib/auth";
import { getProjects, getServices, getTopWork } from "@/lib/db";

export default async function AdminTopWorkPage(
  props: PageProps<"/admin/top-work">,
) {
  await requireAdmin("/admin/top-work");

  const params = await props.searchParams;
  const service = params.service;

  const [services, topWork, projects] = await Promise.all([
    getServices({ includeInactive: true }),
    getTopWork(),
    getProjects({ includeInactive: true }),
  ]);

  return (
    <TopWorkManager
      services={services}
      topWork={topWork}
      // Only the fields the picker needs — keeps the client payload small.
      projects={projects.map(({ id, title, category, image, description }) => ({
        id,
        title,
        category,
        image,
        description,
      }))}
      initialServiceId={typeof service === "string" ? service : undefined}
    />
  );
}
