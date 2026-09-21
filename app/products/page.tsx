import type { Metadata } from "next";

import ProductsList from "@/components/sections/products/ProductsList";
import { getProducts } from "@/lib/db";

export const metadata: Metadata = {
  title: "Products · Mark UI",
  description:
    "Digital products and software solutions built by Mark UI — with screenshots and demos of each.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="overflow-x-hidden">
      <ProductsList products={products} />
    </main>
  );
}
