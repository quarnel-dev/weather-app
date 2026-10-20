import { expect, test, vi } from 'vitest'
import { fetchCityResults } from '@/services/citySearch.client'

const city = { id: 524901, name: 'Moscow', admin1: 'Moscow', country: 'RU', countryName: 'Russia', url: '/ru/moscow' }

test('encodes the query and forwards the cancellation signal', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [city] }) })
  vi.stubGlobal('fetch', fetch)
  const controller = new AbortController()

  expect(await fetchCityResults('São Paulo & region', controller.signal)).toEqual([city])
  expect(fetch).toHaveBeenCalledWith('/api/cities?q=S%C3%A3o+Paulo+%26+region', { signal: controller.signal })
})

test('rejects HTTP errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  await expect(fetchCityResults('Moscow', new AbortController().signal)).rejects.toThrow('City search failed')
})

test.each([
  null,
  {},
  { results: 'invalid' },
  { results: [{}] },
  { results: [{ ...city, url: 'https://example.com' }] },
  { results: Array(9).fill(city) },
])('rejects malformed results: %j', async (payload) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }))
  await expect(fetchCityResults('Moscow', new AbortController().signal)).rejects.toThrow('Invalid city search response')
})
