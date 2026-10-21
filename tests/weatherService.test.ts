import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { getWeather, getForecast } from '@/services/weather.service'
import { weatherPayload, forecastPayload } from './fixtures/weather'

vi.mock('next/cache', () => ({ unstable_cache: (callback: unknown) => callback }))

beforeEach(() => {
  vi.stubEnv('WEATHER_API_KEY', 'test-weather-key')
})

afterEach(() => vi.unstubAllEnvs())

test('preserves the upstream HTTP status instead of claiming the city does not exist', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })))
  await expect(getWeather({ lat: '31.30408', lon: '120.59538' })).rejects.toMatchObject({ code: 'http', status: 503 })
})

test('rejects invalid temperatures instead of returning NaN', async () => {
  const payload = weatherPayload()
  const invalid = { ...payload, main: { ...payload.main, temp: 'unavailable' } }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(invalid)))
  await expect(getWeather({ lat: '31.30408', lon: '120.59538' })).rejects.toMatchObject({ code: 'invalid_response' })
})

test('returns validated weather while preserving the selected request coordinates', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(weatherPayload()))
  vi.stubGlobal('fetch', fetch)
  const result = await getWeather({ lat: '31.30408', lon: '120.59538' })
  expect(result).toMatchObject({ city: 'Suzhou', temp: 20, tempMin: 19, tempMax: 22, feelsLike: 21, icon: 'clearDay' })
  const url = new URL(fetch.mock.calls[0][0])
  expect(url.pathname).toBe('/data/2.5/weather')
  expect(url.searchParams.get('lat')).toBe('31.30408')
  expect(url.searchParams.get('lon')).toBe('120.59538')
  expect(url.searchParams.has('q')).toBe(false)
})

test('validates and maps forecast responses through the same request boundary', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(forecastPayload()))
  vi.stubGlobal('fetch', fetch)
  const result = await getForecast({ lat: '31.30408', lon: '120.59538' })
  expect(result.map(item => item.date)).toEqual(['2026-10-21 12:00:00', '2026-10-22 12:00:00'])
  expect(result.every(item => item.icon === 'rain')).toBe(true)
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/data/2.5/forecast')
})

test('rejects a malformed forecast instead of silently filtering it away', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ list: [{ dt_txt: 'not a date' }] })))
  await expect(getForecast({ lat: '31.30408', lon: '120.59538' })).rejects.toMatchObject({ code: 'invalid_response' })
})
