import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /* Turbopack FS caching for faster dev restarts */
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
