import { beforeEach, expect, test, vi } from 'vitest'
import { DailyForecastServer } from '@/components/dailyforecast/DailyForecast.server'
import { parseForecast, parseWeather } from '@/services/weather/payload.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { forecastPayload, weatherPayload } from './fixtures/weather'
import type { City } from '@/types/City.type'

const { getForecast } = vi.hoisted(() => ({ getForecast: vi.fn() }))
vi.mock('@/services/weather.service', () => ({ getForecast }))
const city: City = { id: 1886760, name: 'Suzhou', country: 'CN', admin1: 'Jiangsu', lat: '31.30408', lon: '120.59538', pop: '1' }
const weather = parseWeather(weatherPayload())

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 21, 18))
  getForecast.mockReset().mockResolvedValue(parseForecast(forecastPayload()))
})

test('groups the selected city forecast and excludes dates before city-local today', async () => {
  const result = await DailyForecastServer({ city, weather })
  expect(getForecast).toHaveBeenCalledWith(city)
  expect(result.props.today).toBe('2026-10-22')
  expect(result.props.days.map((day: { date: string }) => day.date)).toEqual(['2026-10-22'])
})

test('does not request or fabricate daily dates without timezone metadata', async () => {
  const result = await DailyForecastServer({ city, weather: { ...weather, timezoneOffset: null } })
  expect(result.props.children).toBe('Forecast dates are unavailable for this location.')
  expect(getForecast).not.toHaveBeenCalled()
})

test.each([
  { status: 503, retryable: true },
  { status: 401, retryable: false },
])('keeps the existing recovery policy for daily forecast HTTP $status', async ({ status, retryable }) => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  getForecast.mockRejectedValue(new WeatherServiceError('http', status))
  const result = await DailyForecastServer({ city, weather })
  expect(result.props).toEqual({ message: 'Daily forecast is temporarily unavailable.', retryable })
})

test('passes unexpected failures to the daily block boundary', async () => {
  const failure = new Error('Private failure')
  getForecast.mockRejectedValue(failure)
  await expect(DailyForecastServer({ city, weather })).rejects.toBe(failure)
})
