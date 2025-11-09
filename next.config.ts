import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure API routes work correctly on Vercel
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Optimize for production
  reactStrictMode: true,
  // Handle images if needed
  images: {
    domains: [],
  },
};

export default nextConfig;
