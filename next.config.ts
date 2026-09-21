import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin project uploads (images and short videos) go through Server
      // Actions; the 1MB default is far too small for them.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
