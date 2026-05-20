import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
    ],
  },
  serverExternalPackages: ["better-auth", "better-sqlite3"],
};

export default nextConfig;
