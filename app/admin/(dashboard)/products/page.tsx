import ProductManager from "@/components/admin/ProductManager";
import { requireAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/db";

export default async function AdminProductsPage() {
  await requireAdmin("/admin/products");
  // Hidden products must stay listed here so they can be switched back on.
  const products = await getProducts({ includeInactive: true });

  return <ProductManager products={products} />;
}
