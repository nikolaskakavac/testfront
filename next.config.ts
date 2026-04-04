import path from "node:path";
import type { NextConfig } from "next";

const backendRemotePatterns = (() => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_API_BASE_URL;

  if (!baseUrl) {
    return [];
  }

  try {
    const parsed = new URL(baseUrl);
    return [
      {
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        port: parsed.port || undefined,
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    localPatterns: [
      {
        pathname: "/api/users/avatar/**",
      },
      {
        pathname: "/api/posts/image/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.onrender.com",
      },
      ...backendRemotePatterns,
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
