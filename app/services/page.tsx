import type { Metadata } from "next";

import ServicesList from "@/components/sections/services/ServicesList";
import { getServicesWithTopWork, getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Services · Mark UI",
  description:
    "Digital marketing, multimedia production, graphic design, photography, web development, software and event services from Mark UI.",
};

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getServicesWithTopWork(),
    getSettings(),
  ]);

  return (
    <main className="overflow-x-hidden">
      <ServicesList services={services} portfolioUrl={settings.portfolioUrl} />
    </main>
  );
}
