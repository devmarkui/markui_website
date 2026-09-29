import type { Metadata } from "next";

import ContactPage from "@/components/sections/contact/ContactPage";
import { getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contact · Mark UI",
  description:
    "Talk to Mark UI about a website, app, campaign or production. Send an enquiry and we will get back to you.",
};

export default async function ContactRoute() {
  // The same social links the footer shows, managed in the dashboard.
  const { socialLinks } = await getSettings();

  return <ContactPage socialLinks={socialLinks} />;
}
