'use server'

import { WeatherCard } from './WeatherCard'

import { getWeather, getForecast } from '@/services/weather.service'

export async function WeatherCardServer({ city }: { city: string }) {
  const data = await getWeather(city)
  console.log(await getForecast(city))
  return <WeatherCard res={data} />
}
