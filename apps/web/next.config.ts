// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },

      // ✅ When you move to real storage (R2/S3), add it here:
      // {
      //   protocol: "https",
      //   hostname: "your-public-r2-domain.com",
      //   pathname: "/**",
      // },
      // {
      //   protocol: "https",
      //   hostname: "your-s3-bucket.s3.amazonaws.com",
      //   pathname: "/**",
      // },
    ],
  },
};

export default nextConfig;
