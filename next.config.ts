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
      // Nightscout-driven pages: no CDN cache — freshness handled by "use cache" in actions.ts
      source: "/(|diabetes)",
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
