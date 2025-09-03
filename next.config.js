/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev'],
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
}

module.exports = nextConfig
