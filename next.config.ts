import type { NextConfig } from "next";

/**
 * The Creative Vault (app/vault) is served on its own host,
 * creative.markui.lk, by this same app: requests for that host are rewritten
 * into /vault. `creative.localhost` does the same in development.
 */
const VAULT_HOSTS = [process.env.VAULT_HOST, "creative.markui.lk", "creative.localhost"]
  .filter((host): host is string => Boolean(host))
  .map((host) => host.trim().toLowerCase().replace(/[.]/g, "\\."));
const onVault = [{ type: "host" as const, value: `(?:${[...new Set(VAULT_HOSTS)].join("|")})` }];
const VAULT_ORIGIN = (process.env.VAULT_ORIGIN || "https://creative.markui.lk").replace(/\/+$/, "");
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://markui.lk").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin project uploads (images and short videos) go through Server
      // Actions; the 1MB default is far too small for them.
      bodySizeLimit: "25mb",
    },
    // Every upload is posted to an `/admin/*` route, which `proxy.ts` matches,
    // and Next buffers the body of a proxied request so it can be read twice.
    // That buffer defaults to 10MB and silently truncates anything larger, so
    // it has to match the Server Action limit above or a 20MB video arrives
    // half-written with only a warning in the server log.
    proxyClientMaxBodySize: "25mb",
  },
  async redirects() {
    return [
      // "Book a Call" used to point at /proposal, which was never built.
      // Old links and anything saved in the dashboard land on the contact
      // page with the call chooser open.
      { source: "/proposal", destination: "/contact?call=1", permanent: false },

      // The Vault's pages have one address: its own host.
      { source: "/vault", missing: onVault, destination: VAULT_ORIGIN, permanent: false },
      { source: "/vault/:path*", missing: onVault, destination: `${VAULT_ORIGIN}/:path*`, permanent: false },
      // The old Vercel build of the Vault kept projects under /projects/.
      { source: "/projects/:slug([a-z0-9-]+)", has: onVault, destination: "/:slug", permanent: true },
      // The dashboard is on the main site only.
      { source: "/admin/:path*", has: onVault, destination: `${SITE_ORIGIN}/admin/vault`, permanent: false },
      { source: "/admin", has: onVault, destination: `${SITE_ORIGIN}/admin/vault`, permanent: false },
    ];
  },
  async rewrites() {
    return {
      // The homepage is the static build in public/landing/ (intro, signal
      // trace, scroll effects), served by app/landing-home/route.ts, which
      // fills in what the dashboard manages (lib/landing.ts). beforeFiles so
      // it wins over app/page.tsx, which stays in place: removing this
      // rewrite restores the old home.
      beforeFiles: [
        // The Vault host first. beforeFiles rewrites chain, so once a path
        // is under /vault the homepage rule below no longer matches it.
        // Paths with a dot (public files) and Next's own routes pass through.
        { source: "/robots.txt", has: onVault, destination: "/vault/robots.txt" },
        { source: "/sitemap.xml", has: onVault, destination: "/vault/sitemap.xml" },
        { source: "/", has: onVault, destination: "/vault" },
        {
          source: "/:path((?!_next/|api/|media/|vault(?:/|$))[^.]+)",
          has: onVault,
          destination: "/vault/:path",
        },
        { source: "/", destination: "/landing-home" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
