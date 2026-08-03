import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Fixture JPEGs are served from /public; next/image optional later
    unoptimized: true,
  },
};

export default nextConfig;
