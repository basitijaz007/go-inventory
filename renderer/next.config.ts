import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
