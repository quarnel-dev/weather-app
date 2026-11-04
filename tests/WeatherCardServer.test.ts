import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import { WeatherCardServer } from '@/components/weathercard/WeatherCard.server'
import { parseWeather } from '@/services/weather/payload.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherPayload } from './fixtures/weather'
import type { City } from '@/types/City.type'

const { getWeather, forecastTimeline } = vi.hoisted(() => ({ getWeather: vi.fn(), forecastTimeline: vi.fn() }))
vi.mock('@/services/weather.service', () => ({ getWeather }))
vi.mock('@/components/forecasttimeline/ForecastTimeline.server', () => ({ ForecastTimelineServer: forecastTimeline }))
const city: City = { id: 1886760, name: 'Suzhou', country: 'CN', admin1: 'Jiangsu', lat: '31.30408', lon: '120.59538', pop: '1' }

beforeEach(() => {
  getWeather.mockReset().mockResolvedValue(parseWeather(weatherPayload()))
  forecastTimeline.mockReset().mockReturnValue(null)
})

test('renders current weather with an independent forecast section and no log', async () => {
  const log = vi.spyOn(console, 'log')
  const markup = renderToStaticMarkup(await WeatherCardServer({ city }))
  expect(markup).toContain('Suzhou')
  expect(markup).toContain('aria-label="20 degrees Celsius"')
  expect(markup).toContain('Feels like 21°')
  expect(getWeather).toHaveBeenCalledWith(city)
  expect(forecastTimeline).toHaveBeenCalledOnce()
  expect(log).not.toHaveBeenCalled()
})

test('labels weather with the selected database location instead of the provider station name', async () => {
  getWeather.mockResolvedValue({ ...parseWeather(weatherPayload()), city: 'Nearby station', country: 'XX' })
  const markup = renderToStaticMarkup(await WeatherCardServer({ city }))
  expect(markup).toContain('Suzhou')
  expect(markup).toContain('CN')
  expect(markup).toContain('Jiangsu')
  expect(markup).not.toContain('Nearby station')
  expect(markup).not.toContain('XX')
})

test('renders a safe recovery message for a known service failure', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const failure = new WeatherServiceError('timeout')
  getWeather.mockRejectedValue(failure)
  const result = await WeatherCardServer({ city })
  expect(result.props).toEqual({ message: 'The weather request timed out. Try again.', retryable: true })
  expect(log).toHaveBeenCalledWith('Weather request failed', { code: 'timeout', status: undefined })
  expect(forecastTimeline).not.toHaveBeenCalled()
})

test('preserves unexpected failures for the local error boundary', async () => {
  const failure = new Error('Unexpected internal detail')
  getWeather.mockRejectedValue(failure)
  await expect(WeatherCardServer({ city })).rejects.toBe(failure)
})
