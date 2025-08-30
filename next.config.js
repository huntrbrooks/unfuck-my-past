/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev'],
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
  // Suppress environment reload logging in development
  experimental: {
    suppressEnvReloadLog: true,
  },
}

module.exports = nextConfig
