import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'qbuvksyitnabsqzhbpvj.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  allowedDevOrigins: ['nodical-frowstily-jacques.ngrok-free.dev'],
};

export default nextConfig;
