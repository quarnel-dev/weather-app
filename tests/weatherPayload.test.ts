import { describe, expect, test } from 'vitest'
import { parseWeather } from '@/services/weather/payload.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherPayload } from './fixtures/weather'

function change(value: unknown, path: string, replacement: unknown): unknown {
  const parts = path.split('.')
  let target = value as Record<string, unknown>
  for (const key of parts.slice(0, -1)) target = target[key] as Record<string, unknown>
  target[parts[parts.length - 1]] = replacement
  return value
}

describe('current weather payload', () => {
  test('maps metric weather without leaking the provider payload', () => {
    expect(parseWeather(weatherPayload())).toEqual({
      city: 'Suzhou', country: 'CN', temp: 20, tempMin: 19, tempMax: 22, feelsLike: 21,
      description: 'clear sky', main: 'Clear', icon: 'clearDay', humidity: 50,
      windSpeed: 2.5, windDeg: 90, clouds: 0, sunrise: 1761019200, sunset: 1761060000,
      coord: { lat: 31.30408, lon: 120.59538 },
    })
  })

  test.each([
    [null], [[]], [{}], [{ cod: 401, message: 'unauthorized' }],
  ])('rejects a non-weather envelope: %j', (value) => {
    expect(() => parseWeather(value)).toThrow(WeatherServiceError)
  })

  test.each([
    ['cod', '429'], ['name', undefined], ['main', null], ['main.temp', '20'],
    ['main.temp', NaN], ['main.temp', Infinity], ['main.temp_min', undefined],
    ['main.temp_max', null], ['main.feels_like', {}], ['main.humidity', 101],
    ['main.humidity', -1], ['main.humidity', '50'], ['weather', []], ['weather.0', null],
    ['weather.0.description', 2], ['weather.0.main', undefined], ['weather.0.icon', 1],
    ['wind', undefined], ['wind.speed', -1], ['wind.deg', 361], ['wind.deg', '90'],
    ['clouds.all', 101], ['clouds.all', -1], ['coord.lat', 91], ['coord.lon', -181],
    ['sys.sunrise', -1], ['sys.sunset', 'later'], ['sys.country', 'CHINA'],
  ])('rejects an invalid field at %s: %j', (path, value) => {
    expect(() => parseWeather(change(weatherPayload(), path, value))).toThrow(WeatherServiceError)
  })

  test('represents absent polar times and wind direction without inventing values', () => {
    const data = weatherPayload()
    change(data, 'sys', { country: 'NO' })
    change(data, 'wind', { speed: 0 })
    expect(parseWeather(data)).toMatchObject({ sunrise: null, sunset: null, windDeg: null, windSpeed: 0 })
  })

  test('accepts weather without optional country or solar metadata', () => {
    const data = change(weatherPayload(), 'sys', undefined)
    expect(parseWeather(data)).toMatchObject({ country: '', sunrise: null, sunset: null })
  })

  test('preserves legitimate zero values', () => {
    const data = weatherPayload()
    change(data, 'wind', { speed: 0, deg: 0 })
    change(data, 'main', { temp: 0, temp_min: 0, temp_max: 0, feels_like: 0, humidity: 0 })
    expect(parseWeather(data)).toMatchObject({ temp: 0, humidity: 0, windSpeed: 0, windDeg: 0, clouds: 0 })
  })

  test.each([
    ['01d', 'clearDay'], ['01n', 'clearNight'], ['02d', 'clouds'], ['02n', 'clouds'],
    ['03d', 'clouds'], ['04n', 'clouds'], ['09d', 'rain'], ['10n', 'rain'],
    ['11d', 'storm'], ['13n', 'snow'], ['50d', 'mist'], ['50n', 'mist'],
    ['unknown', 'unknown'], ['019', 'unknown'], ['01x', 'unknown'], ['', 'unknown'], [undefined, 'unknown'],
  ])('maps icon %s to %s', (code, expected) => {
    expect(parseWeather(change(weatherPayload(), 'weather.0.icon', code)).icon).toBe(expected)
  })
})
