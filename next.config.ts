import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled `output: 'export'` to allow dynamic routes and server-side rendering
  // (was used for fully static export; removing avoids needing generateStaticParams for dynamic routes)
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
