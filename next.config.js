/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev'],
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
  // Add experimental features to help with hydration
  experimental: {
    suppressHydrationWarning: true,
  },
}

module.exports = nextConfig
