import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita embutir parsers pesados no bundle de toda function.
  serverExternalPackages: ["music-metadata", "@prisma/client", "prisma"],
  experimental: {
    // Tree-shake ícones Lucide no client bundle.
    optimizePackageImports: ["lucide-react"],
  },
  // Não embalar lixo local / apps desktop / engines Windows nas Serverless Functions.
  outputFileTracingExcludes: {
    "*": [
      "apps/downloader/**",
      "apps/downloader/src-tauri/**",
      "node_modules/.prisma/client/query_engine-windows.dll.node",
      "node_modules/.prisma/client/query_engine-windows.dll.node.tmp*",
      "node_modules/.prisma/client/*.tmp*",
      "node_modules/@prisma/engines/query_engine-windows*",
      "node_modules/@prisma/engines/*.tmp*",
      "public/downloads/**",
      "**/*.exe",
      "**/*.pdb",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/downloads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
          { key: "Content-Disposition", value: "attachment" },
        ],
      },
    ];
  },
};

export default nextConfig;
