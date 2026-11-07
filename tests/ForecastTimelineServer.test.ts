import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import { ForecastTimelineServer } from '@/components/forecasttimeline/ForecastTimeline.server'
import { parseForecast, parseWeather } from '@/services/weather/payload.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { forecastPayload, weatherPayload } from './fixtures/weather'
import type { City } from '@/types/City.type'

const { getForecast } = vi.hoisted(() => ({ getForecast: vi.fn() }))
vi.mock('@/services/weather.service', () => ({ getForecast }))
const city: City = { id: 1886760, name: 'Suzhou', country: 'CN', admin1: 'Jiangsu', lat: '31.30408', lon: '120.59538', pop: '1' }
const weather = parseWeather(weatherPayload())

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 21, 6))
  getForecast.mockReset().mockResolvedValue(parseForecast(forecastPayload()))
})

test('loads forecast for the selected coordinates and renders city-local times', async () => {
  const markup = renderToStaticMarkup(await ForecastTimelineServer({ city, weather }))
  expect(getForecast).toHaveBeenCalledWith(city)
  expect(markup).toContain('Now')
  expect(markup).toContain('17:00')
  expect(markup).toContain('2026-10-21T09:00:00Z')
})

test('does not invent local times or request forecast when the city offset is unavailable', async () => {
  const markup = renderToStaticMarkup(await ForecastTimelineServer({ city, weather: { ...weather, timezoneOffset: null } }))
  expect(markup).toContain('Forecast times are unavailable for this location.')
  expect(getForecast).not.toHaveBeenCalled()
})

test.each([
  { status: 503, retryable: true },
  { status: 401, retryable: false },
])('offers the correct recovery policy for forecast HTTP $status', async ({ status, retryable }) => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  getForecast.mockRejectedValue(new WeatherServiceError('http', status))
  const result = await ForecastTimelineServer({ city, weather })
  expect(result.props).toEqual({ compact: true, message: 'Forecast is temporarily unavailable.', retryable })
  expect(log).toHaveBeenCalledWith('Forecast request failed', { code: 'http', status })
})

test('preserves unexpected forecast errors for the local forecast boundary', async () => {
  const failure = new Error('Private forecast failure')
  getForecast.mockRejectedValue(failure)
  await expect(ForecastTimelineServer({ city, weather })).rejects.toBe(failure)
})
