import HeroView from "@/components/sections/home/HeroView";
import { getSettings } from "@/lib/db";

/**
 * Home-page hero. The headline, the call to action and the three things we do
 * are edited in the admin dashboard (Home Page), so this reads them from the
 * store on each render.
 */
export default async function Hero() {
  const { home } = await getSettings();

  return <HeroView content={home} />;
}
