import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // temporarily disable for testing in development
});

const nextConfig: NextConfig = {
  turbopack: {},
  // Disabled `output: 'export'` to allow dynamic routes and server-side rendering
  // (was used for fully static export; removing avoids needing generateStaticParams for dynamic routes)
  reactCompiler: true,
  images: {
    // For static exported sites disable Next/Image optimization so files remain static.
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

export default withPWA(nextConfig);
