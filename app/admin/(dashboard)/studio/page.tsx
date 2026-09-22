import StudioManager from "@/components/admin/StudioManager";
import { requireAdmin } from "@/lib/auth";
import { getStudioItems } from "@/lib/db";

export default async function AdminStudioPage() {
  await requireAdmin("/admin/studio");
  const items = await getStudioItems({ includeInactive: true });
  return <StudioManager items={items} />;
}
