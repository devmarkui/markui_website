import HeroServicesManager from "@/components/admin/HeroServicesManager";
import HomeForm from "@/components/admin/HomeForm";
import { requireAdmin } from "@/lib/auth";
import { getHeroServices, getSettings } from "@/lib/db";

export default async function AdminHomePage() {
  await requireAdmin("/admin/home");
  const [{ home }, services] = await Promise.all([
    getSettings(),
    getHeroServices({ includeInactive: true }),
  ]);

  return (
    <>
      <HomeForm home={home} />
      <HeroServicesManager
        services={services}
        panelLinks={{ it: home.itLink, marketing: home.marketingLink }}
      />
    </>
  );
}
