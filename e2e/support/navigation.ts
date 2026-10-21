import type { BrowserContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function denyGeolocation(page: Page) {
  await page.addInitScript(() => {
    const state = { calls: 0 }
    Object.defineProperty(window, 'geolocationCalls', { get: () => state.calls })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(_success: PositionCallback, failure?: PositionErrorCallback) {
          state.calls++
          failure?.({ code: 1, message: 'Denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
        },
      },
    })
  })
}

export async function rememberedCity(context: BrowserContext, id: number) {
  await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'lastCity')?.value).toBe(String(id))
  const cookie = (await context.cookies()).find((cookie) => cookie.name === 'lastCity')
  if (!cookie) throw new Error('Expected a remembered-city cookie')
  return cookie
}
