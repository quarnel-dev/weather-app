import 'server-only'

import type { City } from '@/types/City.type'
import { WeatherServiceError } from './weatherError'

type Location = Pick<City, 'lat' | 'lon'>

export function validateWeatherRequest(city: Location): void {
  if (!city || typeof city.lat !== 'string' || typeof city.lon !== 'string' || !city.lat.trim() || !city.lon.trim()) {
    throw new WeatherServiceError('invalid_coordinates')
  }

  const lat = Number(city.lat)
  const lon = Number(city.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new WeatherServiceError('invalid_coordinates')
  }

  if (!process.env.WEATHER_API_KEY?.trim()) throw new WeatherServiceError('missing_api_key')
}

export async function requestWeather(endpoint: 'weather' | 'forecast', city: Location): Promise<unknown> {
  validateWeatherRequest(city)
  const params = new URLSearchParams({
    lat: city.lat, lon: city.lon, appid: process.env.WEATHER_API_KEY!, units: 'metric', lang: 'en',
  })
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined

  async function readResponse(): Promise<unknown> {
    let response: Response
    try {
      response = await fetch(`https://api.openweathermap.org/data/2.5/${endpoint}?${params}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
    } catch {
      throw new WeatherServiceError(controller.signal.aborted ? 'timeout' : 'network')
    }

    if (controller.signal.aborted || !response.ok) {
      void response.body?.cancel().catch(() => {})
      if (controller.signal.aborted) throw new WeatherServiceError('timeout')
      throw new WeatherServiceError('http', response.status)
    }

    try {
      return await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw new WeatherServiceError('timeout')
      throw new WeatherServiceError(error instanceof SyntaxError ? 'invalid_response' : 'network')
    }
  }

  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort()
      reject(new WeatherServiceError('timeout'))
    }, 10000)
  })

  try {
    return await Promise.race([readResponse(), deadline])
  } finally {
    clearTimeout(timeout)
  }
}
