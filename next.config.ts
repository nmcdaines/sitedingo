import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {}
};

if (process.env.NODE_ENV === 'development') {
  if (nextConfig.experimental?.serverActions?.allowedOrigins) {
    nextConfig.experimental.serverActions.allowedOrigins.push("*.app.github.dev")
  }
  if (nextConfig.allowedDevOrigins) {
    nextConfig.allowedDevOrigins.push("*.app.github.dev")
  }
}

export default nextConfig;
