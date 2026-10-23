import type { NextConfig } from 'next'

const browserTests = process.env.E2E_TEST_MODE === '1'

const nextConfig: NextConfig = {
  distDir: browserTests ? '.next-e2e' : '.next',
  cacheMaxMemorySize: browserTests ? 0 : undefined,
  typescript: { tsconfigPath: browserTests ? 'tsconfig.e2e.json' : 'tsconfig.json' },
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  devIndicators: false,
  allowedDevOrigins: process.env.ALLOWED_ORIGINS?.split(','),
}

export default nextConfig
