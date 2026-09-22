import AboutForm from "@/components/admin/AboutForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminAboutPage() {
  await requireAdmin("/admin/about");
  const { about } = await getSettings();
  return <AboutForm about={about} />;
}
