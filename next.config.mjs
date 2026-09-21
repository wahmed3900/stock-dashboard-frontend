import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination:
          "https://stock-dashboard-backend-634072894074.us-west4.run.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
