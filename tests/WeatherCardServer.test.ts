import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import { WeatherCardServer } from '@/components/weathercard/WeatherCard.server'
import { parseWeather } from '@/services/weather/payload.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherPayload } from './fixtures/weather'
import type { City } from '@/types/City.type'

const { getWeather, getForecast } = vi.hoisted(() => ({ getWeather: vi.fn(), getForecast: vi.fn() }))
vi.mock('@/services/weather.service', () => ({ getWeather, getForecast }))
const city: City = { id: 1886760, name: 'Suzhou', country: 'CN', admin1: 'Jiangsu', lat: '31.30408', lon: '120.59538', pop: '1' }

beforeEach(() => {
  getWeather.mockReset().mockResolvedValue(parseWeather(weatherPayload()))
  getForecast.mockReset().mockRejectedValue(new Error('Forecast must not be requested'))
})

test('renders current weather without requesting a forecast or writing a log', async () => {
  const log = vi.spyOn(console, 'log')
  const markup = renderToStaticMarkup(await WeatherCardServer({ city }))
  expect(markup).toContain('Suzhou')
  expect(markup).toContain('20°C')
  expect(getWeather).toHaveBeenCalledWith(city)
  expect(getForecast).not.toHaveBeenCalled()
  expect(log).not.toHaveBeenCalled()
})

test('preserves typed failures for the page error-handling task', async () => {
  const failure = new WeatherServiceError('timeout')
  getWeather.mockRejectedValue(failure)
  await expect(WeatherCardServer({ city })).rejects.toBe(failure)
  expect(getForecast).not.toHaveBeenCalled()
})
