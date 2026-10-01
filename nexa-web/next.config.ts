import type { NextConfig } from "next";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.16.133"],
};

export default nextConfig;
