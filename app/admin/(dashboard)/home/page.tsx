import HomeForm from "@/components/admin/HomeForm";
import HomeSectionsForm from "@/components/admin/HomeSectionsForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminHomePage() {
  await requireAdmin("/admin/home");
  const { home, content } = await getSettings();

  return (
    <>
      <HomeForm home={home} />
      <HomeSectionsForm home={content.home} />
    </>
  );
}
