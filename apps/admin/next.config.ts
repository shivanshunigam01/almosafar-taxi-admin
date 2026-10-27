import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@almosafar/shared", "@almosafar/ui"],
  reactStrictMode: true,
};

export default nextConfig;
