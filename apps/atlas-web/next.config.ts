import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@atlas/config", "@atlas/contracts", "@atlas/database"],
};

export default nextConfig;
