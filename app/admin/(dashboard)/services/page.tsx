import ServiceManager from "@/components/admin/ServiceManager";
import { requireAdmin } from "@/lib/auth";
import { getServices, getTopWork } from "@/lib/db";

export default async function AdminServicesPage() {
  await requireAdmin("/admin/services");

  const [services, topWork] = await Promise.all([
    // Inactive services must stay visible here so they can be switched back on.
    getServices({ includeInactive: true }),
    getTopWork(),
  ]);

  const topWorkCounts: Record<string, number> = {};
  for (const item of topWork) {
    topWorkCounts[item.serviceId] = (topWorkCounts[item.serviceId] ?? 0) + 1;
  }

  return <ServiceManager services={services} topWorkCounts={topWorkCounts} />;
}
