import { vaultOrigin } from "@/lib/vault/links";

export const dynamic = "force-static";

/** creative.markui.lk/robots.txt (rewritten here). Previews stay out of search. */
export function GET() {
  const body = ["User-agent: *", "Allow: /", "Disallow: /preview/", "", `Sitemap: ${vaultOrigin()}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
