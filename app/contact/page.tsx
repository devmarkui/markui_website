import ContactPage from "@/components/sections/contact/ContactPage";
import { getSettings } from "@/lib/db";

export default async function ContactRoute() {
  // The same social links the footer shows, managed in the dashboard.
  const { socialLinks } = await getSettings();

  return <ContactPage socialLinks={socialLinks} />;
}
