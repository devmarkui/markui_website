import EnquiryList from "@/components/admin/EnquiryList";
import { requireAdmin } from "@/lib/auth";
import { getEnquiries } from "@/lib/enquiries";
import { enquiryRecipient, mailConfigured } from "@/lib/mailer";

export default async function AdminEnquiriesPage() {
  await requireAdmin("/admin/enquiries");
  const enquiries = await getEnquiries();

  return (
    <EnquiryList
      enquiries={enquiries}
      mailConfigured={mailConfigured()}
      recipient={enquiryRecipient()}
    />
  );
}
