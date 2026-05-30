import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "playwright"],
  },
  webpack: (config) => {
    // Prevent bundling playwright in client chunks
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push("playwright", "pdf-parse");
    }
    return config;
  },
};

export default config;
