import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  json: { stringify: true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    maxWorkers: 2,
    projects: [
      { extends: true, test: { name: 'server', environment: 'node', include: ['tests/**/*.test.ts'] } },
      { extends: true, test: { name: 'react', environment: 'jsdom', include: ['tests/**/*.test.tsx'] } },
    ],
  },
})
