import SocialLinksForm from "@/components/admin/SocialLinksForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminFooterPage() {
  await requireAdmin("/admin/footer");
  const { socialLinks } = await getSettings();
  return <SocialLinksForm links={socialLinks} />;
}
