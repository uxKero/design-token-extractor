import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {};

// withEve mounts the Eve agent (agent/) same-origin: in dev it auto-starts
// `eve dev` and proxies /eve/v1/*, so useEveAgent() works out of the box. In
// production the eve service from vercel.json serves it.
export default withEve(nextConfig);
