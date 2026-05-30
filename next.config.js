// Next.js configuration for DocuHive application
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.clerk.com"],
  },
  transpilePackages: ["docx"],
}

module.exports = nextConfig
