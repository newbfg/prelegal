import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit /route/index.html instead of /route.html so a bare static file
  // server (FastAPI's StaticFiles, in html mode) can resolve "/route" via
  // its directory + index.html lookup without custom rewrite rules.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
