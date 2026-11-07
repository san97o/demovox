import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: no API routes, no server, nothing that can spend the deployer's money.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
