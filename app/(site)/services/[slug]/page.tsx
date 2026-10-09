import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ServiceDetail from "@/components/sections/services/ServiceDetail";
import {
  getResolvedTopWork,
  getServiceBySlug,
  getServices,
  getSettings,
} from "@/lib/db";
import { applyVaultLinks, servicePortfolioUrl } from "@/lib/vault/main-site";

/** Pre-renders a page per service; new ones are rendered on first request. */
export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata(
  props: PageProps<"/services/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = await getServiceBySlug(slug);

  if (!service) return { title: "Service not found · Mark UI" };

  return {
    title: `${service.name} · Mark UI`,
    description: service.shortDescription,
  };
}

export default async function ServiceDetailPage(
  props: PageProps<"/services/[slug]">,
) {
  const { slug } = await props.params;
  const service = await getServiceBySlug(slug);

  // Inactive services are hidden from visitors but kept in the database.
  if (!service || !service.active) notFound();

  const [topWork, settings, allServices] = await Promise.all([
    getResolvedTopWork(service.id),
    getSettings(),
    getServices(),
  ]);

  const [work, portfolioUrl] = await Promise.all([
    applyVaultLinks(topWork),
    servicePortfolioUrl(settings.portfolioUrl, service),
  ]);

  return (
    <ServiceDetail
      service={service}
      topWork={work}
      portfolioUrl={portfolioUrl}
      otherServices={allServices
        .filter((s) => s.id !== service.id)
        .map(({ id, slug: s, name }) => ({ id, slug: s, name }))}
    />
  );
}
