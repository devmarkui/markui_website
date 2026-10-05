import ContactDetailsForm from "@/components/admin/ContactDetailsForm";
import ContactPageForm from "@/components/admin/ContactPageForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminContactPage() {
  await requireAdmin("/admin/contact");
  const { contact, content } = await getSettings();

  return (
    <>
      <ContactDetailsForm contact={contact} />
      <ContactPageForm copy={content.pages.contact} />
    </>
  );
}
