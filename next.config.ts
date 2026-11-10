import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const dev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy: only this site may run scripts, load fonts, open frames or receive forms.
 * Images may come from any https host (admins can paste product photo URLs).
 * 'unsafe-inline' is needed for Next.js' inline bootstrap scripts without per-request nonces;
 * vercel.live is the comment toolbar Vercel adds to preview deployments.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://vercel.live wss://ws-us3.pusher.com${dev ? " ws:" : ""}`,
  "frame-src https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://sandbox.vnpayment.vn https://pay.vnpay.vn",
  "object-src 'none'",
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  // pin the project root (a stray package-lock.json in the home folder confuses auto-detection)
  turbopack: { root: process.cwd() },
  // native SQLite driver used for local development
  serverExternalPackages: ["@libsql/client", "libsql"],
  images: {
    // only our own files and Pexels go through the image optimizer (no open proxy for other hosts)
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
    // product photos never change under the same name: keep optimized copies for a month
    minimumCacheTTL: 2_678_400,
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
          { key: "Content-Security-Policy", value: csp },
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
