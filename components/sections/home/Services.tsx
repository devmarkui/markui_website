import ServicesAccordion from "@/components/sections/home/ServicesAccordion";
import { getServices } from "@/lib/db";

/**
 * Home-page services section. Reads from the store so the dashboard controls
 * which services appear here, what they say and in what order.
 */
export default async function Services() {
  const services = await getServices();

  return <ServicesAccordion services={services} />;
}
