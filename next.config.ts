import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {}
};

if (process.env.NODE_ENV === 'development') {
  nextConfig.experimental?.serverActions?.allowedOrigins.push("*.app.github.dev")
  nextConfig.allowedDevOrigins?.push("*.app.github.dev")
}

export default nextConfig;
