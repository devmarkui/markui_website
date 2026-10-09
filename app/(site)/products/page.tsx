import type { Metadata } from "next";

import ProductsList from "@/components/sections/products/ProductsList";
import { getProducts, getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Products · Mark UI",
  description:
    "Digital products and software solutions built by Mark UI — with screenshots and demos of each.",
};

export default async function ProductsPage() {
  const [products, { content }] = await Promise.all([getProducts(), getSettings()]);

  return <ProductsList products={products} copy={content.pages.products} />;
}
