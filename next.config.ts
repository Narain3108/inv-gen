import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a fully static exportable site (output -> `out/` via `next export`).
  output: 'export',
  reactCompiler: true,
  images: {
    // For static exported sites disable Next/Image optimization so files remain static.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/dvwu6jtfm/**',
      },
    ],
  },
};

export default nextConfig;
