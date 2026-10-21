import 'server-only'

import { WeatherCard } from './WeatherCard'

import { getWeather } from '@/services/weather.service'
import type { City } from '@/types/City.type'

export async function WeatherCardServer({ city }: { city: City }) {
  const data = await getWeather(city)
  return <WeatherCard res={data} />
}
