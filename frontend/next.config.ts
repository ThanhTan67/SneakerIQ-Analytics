import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '**.nike.com' },
      { protocol: 'https', hostname: '**.adidas.com' },
      { protocol: 'https', hostname: '**.adidas.com.vn' },
      { protocol: 'https', hostname: '**.puma.com' },
      { protocol: 'https', hostname: '**.newbalance.com' },
      { protocol: 'https', hostname: '**.converse.com' },
      { protocol: 'https', hostname: '**.converse.com.vn' },
      { protocol: 'https', hostname: '**.vans.com' },
      { protocol: 'https', hostname: '**.vans.com.vn' },
      { protocol: 'https', hostname: '**.thesneakerdatabase.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;
