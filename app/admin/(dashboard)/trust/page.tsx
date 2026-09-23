import TrustForm from "@/components/admin/TrustForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminTrustPage() {
  await requireAdmin("/admin/trust");
  const { trust } = await getSettings();

  return <TrustForm trust={trust} />;
}
