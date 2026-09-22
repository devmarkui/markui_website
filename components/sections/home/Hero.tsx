import HeroView from "@/components/sections/home/HeroView";
import { getHeroServices, getSettings } from "@/lib/db";

/**
 * Home-page hero. The copy, both service cards and the services each card
 * rotates through are edited in the admin dashboard (Home Page), so this reads
 * them from the store on each render.
 */
export default async function Hero() {
  const [{ home }, services] = await Promise.all([
    getSettings(),
    getHeroServices(),
  ]);

  return (
    <HeroView
      content={home}
      itServices={services.filter((s) => s.panel === "it")}
      marketingServices={services.filter((s) => s.panel === "marketing")}
    />
  );
}
