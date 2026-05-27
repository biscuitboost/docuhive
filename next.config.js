// Next.js configuration for DocuHive application
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.clerk.com"],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
