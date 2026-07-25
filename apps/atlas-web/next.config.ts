import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@atlas/contracts"],
};

export default nextConfig;
