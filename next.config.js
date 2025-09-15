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
  // Optimize and transpile lucide-react to avoid missing vendor chunk issues
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  transpilePackages: ['lucide-react'],
}

module.exports = nextConfig
