import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  typescript: {
    // We'll handle this in CI — don't fail builds during development
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
