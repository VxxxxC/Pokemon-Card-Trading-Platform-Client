import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

/** LAN IPs for mobile / device testing (e.g. ALLOWED_DEV_ORIGINS=192.168.2.102). */
const allowedDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
      allowedOrigins: allowedDevOrigins,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "www.pokemon-card.com",
        pathname: "/assets/images/**",
      },
      {
        protocol: "https",
        hostname: "hkcardvault.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
