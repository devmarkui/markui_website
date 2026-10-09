import type { Metadata } from "next";

import ServicesList from "@/components/sections/services/ServicesList";
import { getServicesWithTopWork, getSettings } from "@/lib/db";
import { applyVaultLinks, servicePortfolioUrl } from "@/lib/vault/main-site";

export const metadata: Metadata = {
  title: "Services · Mark UI",
  description:
    "Digital marketing, multimedia production, graphic design, photography, web development, software and event services from Mark UI.",
};

export default async function ServicesPage() {
  const [rows, settings] = await Promise.all([
    getServicesWithTopWork(),
    getSettings(),
  ]);
  // Top Work from a project with a Creative Vault page opens that page.
  const [services, portfolioUrl] = await Promise.all([
    Promise.all(rows.map(async (row) => ({ ...row, topWork: await applyVaultLinks(row.topWork) }))),
    servicePortfolioUrl(settings.portfolioUrl),
  ]);

  return (
    <ServicesList
      services={services}
      portfolioUrl={portfolioUrl}
      copy={settings.content.pages.services}
    />
  );
}
