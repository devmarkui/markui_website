import { renderLanding } from "@/lib/landing";

/**
 * The homepage. `/` is rewritten here (next.config.ts): the static build in
 * `public/landing/index.html`, with the parts the dashboard manages filled in
 * from the database (lib/landing.ts).
 *
 * Cached like the other public pages: rendered once, refreshed hourly, and
 * straight away when something is saved in the dashboard (revalidatePublicSite
 * in app/admin/actions.ts).
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return new Response(await renderLanding(), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
