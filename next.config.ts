import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  devIndicators: false,
  allowedDevOrigins: process.env.ALLOWED_ORIGINS?.split(','),
}

export default nextConfig
