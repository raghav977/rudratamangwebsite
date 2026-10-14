import type { NextConfig } from "next";

// Trailing slashes would turn "/api" into "//api", which the backend doesn't route.
const API = (process.env.API_URL?.trim() || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Bake the build-time value into the server code too, so page rendering
  // always talks to the same backend as the /api rewrites below — even when
  // the host (e.g. Vercel) doesn't pass API_URL to the running functions.
  env: { API_URL: API },
  // The browser only ever talks to this origin; API calls and uploaded files
  // are forwarded to the backend so the session cookie stays first-party.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
