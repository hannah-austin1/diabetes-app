import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  headers: async () => [
    {
      // Health/FInch page responses must not be publicly CDN cached.
      source: "/(finch|health)",
      headers: [
        {
          key: "CDN-Cache-Control",
          value: "private, no-store",
        },
      ],
    },
    {
      // Nightscout responses are always fetched fresh in lib/nightscout.ts.
      source: "/diabetes",
      headers: [
        {
          key: "CDN-Cache-Control",
          value: "no-store",
        },
      ],
    },
  ],
};

export default nextConfig;
