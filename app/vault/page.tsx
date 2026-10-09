import type { Metadata } from "next";

import Chan from "@/components/site/Chan";
import { Reveal } from "@/components/site/Reveal";
import VaultFooter from "@/components/vault/VaultFooter";
import VaultIndex, { type VaultCard } from "@/components/vault/VaultIndex";
import VaultTop from "@/components/vault/VaultTop";
import { siteOrigin } from "@/lib/vault/links";
import { contentsOf, publishedWithAlbums, serviceNames } from "@/lib/vault/public";
import { getVaultSettings } from "@/lib/vault/store";

// Refreshed whenever the dashboard saves (revalidatePath), and hourly anyway.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getVaultSettings();
  return {
    title: { absolute: settings.seoTitle },
    description: settings.seoDescription,
    alternates: { canonical: "/" },
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      url: "/",
      siteName: "Mark UI Creative Vault",
      images: settings.ogImage ? [settings.ogImage] : undefined,
    },
  };
}

export default async function VaultHome() {
  const [{ projects, albums }, services, settings] = await Promise.all([
    publishedWithAlbums(),
    serviceNames(),
    getVaultSettings(),
  ]);

  const cards: VaultCard[] = projects.map((p) => {
    const service = services.get(p.serviceId);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      client: p.client,
      service: service?.name ?? "",
      serviceSlug: service?.slug ?? "",
      year: p.date ? p.date.slice(0, 4) : "",
      summary: p.summary.split(/\n\s*\n/)[0] ?? "",
      cover: p.cover,
      contents: contentsOf(p, albums),
      featured: p.featured,
    };
  });

  // The tuner lists services in the order the main site does, with counts.
  const counts = new Map<string, number>();
  for (const c of cards) if (c.serviceSlug) counts.set(c.serviceSlug, (counts.get(c.serviceSlug) ?? 0) + 1);
  const tuner = [...services.values()]
    .filter((s) => counts.has(s.slug))
    .map((s) => ({ slug: s.slug, name: s.name, count: counts.get(s.slug)! }));
  const origin = siteOrigin();

  return (
    <main id="main" className="sx pg vault">
      <VaultTop siteOrigin={origin} />
      <section className="vt-mast mast ground ground-carbon" data-mast data-ground="carbon" aria-labelledby="vt-title">
        <div className="wrap mast-inner">
          <Chan num="MK" className="is-live">
            Mark UI · Creative Vault
          </Chan>
          <h1 className="mast-title" id="vt-title">
            {settings.titleQuiet ? <span className="mast-q">{settings.titleQuiet}</span> : null}{" "}
            <span className="mast-l">
              {settings.titleLoud}
              <span className="mast-stop">.</span>
            </span>
          </h1>
          <div className="mast-foot">
            {settings.intro ? (
              <Reveal className="mast-lede">
                <p>{settings.intro}</p>
              </Reveal>
            ) : null}
            <dl className="mast-read">
              <div>
                <dt>Projects</dt>
                <dd>{String(cards.length).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Services</dt>
                <dd>{String(tuner.length).padStart(2, "0")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <VaultIndex cards={cards} services={tuner} />

      <VaultFooter siteOrigin={origin} cta={{ label: settings.ctaLabel, url: settings.ctaUrl }} />
    </main>
  );
}
