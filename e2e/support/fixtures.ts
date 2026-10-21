import { test as base, expect } from '@playwright/test'

type Mode =
  | 'valid'
  | 'http-400'
  | 'http-401'
  | 'http-404'
  | 'http-429'
  | 'http-503'
  | 'invalid'
  | 'network'
  | 'headers'
  | 'body'
  | 'unexpected'
  | 'missing-key'
interface ProviderState {
  requests: { endpoint: string; lat: string; lon: string; mode: Mode; aborted: boolean; completed: boolean }[]
}
interface Provider {
  mode: (mode: Mode, delayMs?: number) => Promise<void>
  state: () => Promise<ProviderState>
}

export const test = base.extend<{ provider: Provider; pageErrors: void }>({
  provider: async ({ request }, provide) => {
    const control = 'http://127.0.0.1:3101'
    const reset = await request.post(`${control}/reset`, { data: { mode: 'valid' } })
    expect(reset.ok()).toBeTruthy()
    await provide({
      mode: async (mode, delayMs = 0) => {
        const response = await request.post(`${control}/mode`, { data: { mode, delayMs } })
        expect(response.ok()).toBeTruthy()
      },
      state: async () => {
        const response = await request.get(`${control}/state`)
        expect(response.ok()).toBeTruthy()
        return response.json()
      },
    })
  },
  pageErrors: [
    async ({ page, provider }, provide) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await provide()
      expect(errors).toEqual([])
      expect((await provider.state()).requests.every((request) => request.endpoint === '/data/2.5/weather')).toBe(true)
    },
    { auto: true },
  ],
})

export { expect }
