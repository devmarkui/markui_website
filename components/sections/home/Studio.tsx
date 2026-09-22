import StudioSection from "@/components/sections/home/StudioSection";
import { getStudioItems } from "@/lib/db";

/**
 * Home-page "Latest From Our Studio". Posts are managed in the admin dashboard;
 * with none shown the section is left out rather than rendered empty.
 */
export default async function Studio() {
  const items = await getStudioItems();
  if (items.length === 0) return null;

  return <StudioSection items={items} />;
}
