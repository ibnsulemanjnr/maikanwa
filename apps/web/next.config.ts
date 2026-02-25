// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ✅ keep (only if you intentionally render SVGs via <Image/>)
    dangerouslyAllowSVG: true,

    // ✅ must be inline for <Image/> rendering (avoid download/attachment behavior)
    contentDispositionType: "inline",

    // ✅ keep CSP (note: this is for the Next.js Image Optimization response)
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    remotePatterns: [
      // Placeholders
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },

      // YouTube thumbnails
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

      // ✅ Google Drive / Googleusercontent (temporary image hosting)
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // some Drive links resolve to googleusercontent subdomains
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },

      // ✅ When you move to real storage (R2/S3), add it here:
      // {
      //   protocol: "https",
      //   hostname: "cdn.maikanwa.store",
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
