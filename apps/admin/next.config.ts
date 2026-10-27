import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@almosafar/shared", "@almosafar/ui"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
