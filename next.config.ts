import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "piyuonyccqwneuxshmet.supabase.co",
      },
    ],
  },
};

export default nextConfig;