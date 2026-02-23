// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "youtu.be",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
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
