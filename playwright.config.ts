import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node --import ./e2e/support/weather-provider.mjs ./node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3100',
    url: 'http://127.0.0.1:3100/cn/suzhou',
    reuseExistingServer: false,
    timeout: 60000,
    env: { E2E_TEST_MODE: '1', WEATHER_API_KEY: 'browser-test-key' },
  },
})
