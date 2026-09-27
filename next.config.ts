import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  headers: async () => [
    {
      // Health/Finch data is personal health information: never publicly CDN-cache it.
      source: "/(finch|health)",
      headers: [
        {
          key: "CDN-Cache-Control",
          value: "private, no-store",
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
