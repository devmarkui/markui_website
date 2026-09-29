import type { MetadataRoute } from "next";

/**
 * /landing/ must stay crawlable: the homepage's styles, scripts and images
 * live there, and Google renders the page with them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: "https://markui.lk/sitemap.xml",
  };
}
