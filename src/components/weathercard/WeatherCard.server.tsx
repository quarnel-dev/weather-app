'use server'

import { WeatherCard } from './WeatherCard'

import { getWeather, getForecast } from '@/services/weather.service'
import type { City } from '@/types/City.type'

export async function WeatherCardServer({ city }: { city: City }) {
  const data = await getWeather(city)
  console.log(await getForecast(city))
  return <WeatherCard res={data} />
}
