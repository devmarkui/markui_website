import type { Metadata } from "next";

import ProductsServicesHub from "@/components/sections/products-services/ProductsServicesHub";
import { getProducts, getServices } from "@/lib/db";

export const metadata: Metadata = {
  title: "Products & Services · Mark UI",
  description:
    "Mark UI products you can buy, and professional services our team delivers — marketing, multimedia, design, web, software and events.",
};

export default async function ProductsServicesPage() {
  const [products, services] = await Promise.all([
    getProducts(),
    getServices(),
  ]);

  return (
    <main className="overflow-x-hidden">
      <ProductsServicesHub
        productCount={products.length}
        serviceCount={services.length}
        productNames={products.map((p) => p.name)}
        serviceNames={services.map((s) => s.name)}
      />
    </main>
  );
}
