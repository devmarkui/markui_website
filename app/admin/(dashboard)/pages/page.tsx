import PageTextForm from "@/components/admin/PageTextForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminPageTextPage() {
  await requireAdmin("/admin/pages");
  const { content } = await getSettings();

  return <PageTextForm content={content} />;
}
