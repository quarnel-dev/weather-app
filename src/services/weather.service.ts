import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Weather } from '@/types/Weather.type'
import type { Forecast } from '@/types/Forecast.type'
import type { City } from '@/types/City.type'
import { requestWeather, validateWeatherRequest } from './weather/request.server'
import { parseWeather, parseForecast } from './weather/payload.server'

const loadWeather = unstable_cache(
  async (lat: string, lon: string) => parseWeather(await requestWeather('weather', { lat, lon })),
  ['weather-current-v1'],
  { revalidate: 600 },
)

const loadForecast = unstable_cache(
  async (lat: string, lon: string) => parseForecast(await requestWeather('forecast', { lat, lon })),
  ['weather-forecast-v1'],
  { revalidate: 600 },
)

export async function getWeather(city: Pick<City, 'lat' | 'lon'>): Promise<Weather> {
  validateWeatherRequest(city)
  return loadWeather(city.lat, city.lon)
}

export async function getForecast(city: Pick<City, 'lat' | 'lon'>): Promise<Forecast[]> {
  validateWeatherRequest(city)
  return loadForecast(city.lat, city.lon)
}
