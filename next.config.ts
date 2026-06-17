import type { NextConfig } from "next";
import { withEve } from "eve/next";

// Security headers applied to every route. HTTPS is enforced by Vercel; HSTS
// hardens it, the rest mitigate clickjacking, MIME sniffing, and referrer leak.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// withEve mounts the Eve agent (agent/) same-origin: in dev it auto-starts
// `eve dev` and proxies /eve/v1/*, so useEveAgent() works out of the box. In
// production the eve service from vercel.json serves it.
export default withEve(nextConfig);
