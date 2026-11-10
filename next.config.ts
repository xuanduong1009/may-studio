import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // pin the project root (a stray package-lock.json in the home folder confuses auto-detection)
  turbopack: { root: process.cwd() },
  // native SQLite driver used for local development
  serverExternalPackages: ["@libsql/client", "libsql"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  poweredByHeader: false,
  // "npm run share" serves the local build through a Cloudflare tunnel; let server actions accept that origin
  // (local only: Vercel deployments keep the strict same-origin check)
  experimental: {
    serverActions: { allowedOrigins: process.env.VERCEL ? [] : ["*.trycloudflare.com"] },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
