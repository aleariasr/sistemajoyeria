/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // All images are served directly from Cloudinary (res.cloudinary.com).
    // Vercel's /_next/image proxy is disabled to prevent double-processing.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', '@tanstack/react-query'],
  },
};

module.exports = nextConfig;
