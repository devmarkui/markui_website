import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getServices, getSettings } from "@/lib/db";

/** The marketing site's chrome: the nav, the cursor and the footer. */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Social links and contact details are managed in the dashboard (Footer &
  // Social, Contact Details); the footer lists every active service.
  const [{ socialLinks, contact, content }, services] = await Promise.all([getSettings(), getServices()]);

  return (
    <>
      <SiteHeader socialLinks={socialLinks} contact={contact} />
      {children}
      <SiteFooter
        socialLinks={socialLinks}
        contact={contact}
        services={services.map(({ name, slug }) => ({ name, slug }))}
        note={content.footerNote}
      />
    </>
  );
}
