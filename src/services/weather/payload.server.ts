import 'server-only'

import type { Weather } from '@/types/Weather.type'
import type { Forecast } from '@/types/Forecast.type'
import type { WeatherIcon } from '@/types/WeatherIcon.type'
import { WeatherServiceError } from './weatherError'

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WeatherServiceError('invalid_response')
  return value as Record<string, unknown>
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new WeatherServiceError('invalid_response')
  return value
}

function number(value: unknown, min = -Infinity, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new WeatherServiceError('invalid_response')
  }
  return value
}

function optionalNumber(value: unknown, min: number, max = Infinity): number | null {
  return value == null ? null : number(value, min, max)
}

function conditions(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value) || value.length === 0) throw new WeatherServiceError('invalid_response')
  return record(value[0])
}

function icon(value: unknown): WeatherIcon {
  if (value == null) return 'unknown'
  const code = text(value)
  if (!/^(01|02|03|04|09|10|11|13|50)[dn]$/.test(code)) return 'unknown'
  if (code === '01d') return 'clearDay'
  if (code === '01n') return 'clearNight'
  if (code.startsWith('02') || code.startsWith('03') || code.startsWith('04')) return 'clouds'
  if (code.startsWith('09') || code.startsWith('10')) return 'rain'
  if (code.startsWith('11')) return 'storm'
  if (code.startsWith('13')) return 'snow'
  return 'mist'
}

function envelope(value: unknown): Record<string, unknown> {
  const data = record(value)
  if (data.cod !== undefined && data.cod !== 200 && data.cod !== '200') throw new WeatherServiceError('invalid_response')
  return data
}

export function parseWeather(value: unknown): Weather {
  const data = envelope(value)
  const main = record(data.main)
  const sys = record(data.sys ?? {})
  const wind = record(data.wind)
  const clouds = record(data.clouds)
  const coord = record(data.coord)
  const condition = conditions(data.weather)
  const country = sys.country === undefined ? '' : text(sys.country)
  if (country && !/^[A-Z]{2}$/.test(country)) throw new WeatherServiceError('invalid_response')

  return {
    city: text(data.name),
    country,
    temp: Math.round(number(main.temp)),
    tempMin: Math.round(number(main.temp_min)),
    tempMax: Math.round(number(main.temp_max)),
    feelsLike: Math.round(number(main.feels_like)),
    description: text(condition.description),
    main: text(condition.main),
    icon: icon(condition.icon),
    humidity: number(main.humidity, 0, 100),
    windSpeed: number(wind.speed, 0),
    windDeg: optionalNumber(wind.deg, 0, 360),
    clouds: number(clouds.all, 0, 100),
    sunrise: optionalNumber(sys.sunrise, 0),
    sunset: optionalNumber(sys.sunset, 0),
    coord: { lat: number(coord.lat, -90, 90), lon: number(coord.lon, -180, 180) },
  }
}

function forecastDate(value: unknown): string {
  const date = text(value)
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) throw new WeatherServiceError('invalid_response')
  const timestamp = Date.parse(date.replace(' ', 'T') + 'Z')
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ') !== date) {
    throw new WeatherServiceError('invalid_response')
  }
  return date
}

export function parseForecast(value: unknown): Forecast[] {
  const data = envelope(value)
  if (!Array.isArray(data.list)) throw new WeatherServiceError('invalid_response')

  return data.list
    .map((value): Forecast => {
      const item = record(value)
      const main = record(item.main)
      const wind = record(item.wind)
      const condition = conditions(item.weather)

      return {
        date: forecastDate(item.dt_txt),
        temp: Math.round(number(main.temp)),
        tempMin: Math.round(number(main.temp_min)),
        tempMax: Math.round(number(main.temp_max)),
        description: text(condition.description),
        icon: icon(condition.icon),
        humidity: number(main.humidity, 0, 100),
        windSpeed: number(wind.speed, 0),
      }
    })
    .filter((item) => item.date.endsWith(' 12:00:00'))
}
