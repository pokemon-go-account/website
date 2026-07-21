import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allowedDevOrigins: ["192.168.29.55"],
  compress: true, // Gzip and Brotli compression for static and dynamic files
  poweredByHeader: false, // Security and bundle header optimization
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb", // Reduced payload limit from 10mb since uploads are client-direct
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
