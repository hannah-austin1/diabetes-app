import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  headers: async () => [
    {
      // Finch-only pages: cache for 1 day at the CDN edge
      source: "/(finch|health)",
      headers: [
        {
          key: "CDN-Cache-Control",
          value: "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      ],
    },
    {
      // Nightscout-driven pages: cache for 5 min at the CDN edge
      source: "/(|diabetes)",
      headers: [
        {
          key: "CDN-Cache-Control",
          value: "public, s-maxage=300, stale-while-revalidate=60",
        },
      ],
    },
  ],
};

export default nextConfig;
