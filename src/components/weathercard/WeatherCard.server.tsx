import 'server-only'

import { WeatherCard } from './WeatherCard'

import { getWeather } from '@/services/weather.service'
import type { City } from '@/types/City.type'
import type { Weather } from '@/types/Weather.type'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherFailure } from '@/services/weather/failure.server'
import Recovery from '@/components/recovery/Recovery'

export async function WeatherCardServer({ city }: { city: City }) {
  let data: Weather
  try {
    data = await getWeather(city)
  } catch (error) {
    if (!(error instanceof WeatherServiceError)) throw error
    console.error('Weather request failed', { code: error.code, status: error.status })
    return <Recovery {...weatherFailure(error)} />
  }
  return <WeatherCard res={data} />
}
