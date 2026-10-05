import type { Metadata } from "next";

import ContactPage from "@/components/sections/contact/ContactPage";
import { getServices, getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contact · Mark UI",
  description:
    "Talk to Mark UI about a website, app, campaign or production. Send an enquiry and we will get back to you.",
};

export default async function ContactRoute() {
  // The same social links and contact details the footer shows, managed in
  // the dashboard.
  const [{ socialLinks, contact, content }, services] = await Promise.all([getSettings(), getServices()]);

  return (
    <ContactPage
      socialLinks={socialLinks}
      contact={contact}
      // The form asks which of the live services the visitor needs.
      services={services.map((service) => service.name)}
      copy={content.pages.contact}
    />
  );
}
