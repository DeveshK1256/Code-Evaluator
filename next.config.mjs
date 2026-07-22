/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.github.com",
      },
    ],
  },
  experimental: {
    serverExternalPackages: ["inngest"],
  },
};

export default nextConfig;
