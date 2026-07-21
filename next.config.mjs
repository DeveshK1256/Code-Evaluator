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
    serverComponentsExternalPackages: ["inngest"],
  },
};

export default nextConfig;
