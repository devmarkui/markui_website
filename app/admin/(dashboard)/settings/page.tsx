import SettingsForm from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");
  const settings = await getSettings();

  return <SettingsForm settings={settings} />;
}
