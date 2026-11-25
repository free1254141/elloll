import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir:
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_APP_MODE === "admin"
      ? ".next-admin"
      : ".next",
};

export default nextConfig;
