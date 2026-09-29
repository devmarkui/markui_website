import type { NextConfig } from "next";

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
  async rewrites() {
    return {
      // The homepage is the static build in public/landing/ (intro, signal
      // trace, scroll effects). beforeFiles so it wins over app/page.tsx,
      // which stays in place: removing this rewrite restores the old home.
      beforeFiles: [{ source: "/", destination: "/landing/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
