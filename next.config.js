/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev'],
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
