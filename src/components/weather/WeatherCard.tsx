'use client'

import { useEffect, useState } from 'react'
import { getWeather } from '@/services/weather.service'

export function WeatherCard({ city }: { city: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const weather = await getWeather(city)
      setData(weather)
    }

    load()
  }, [city])

  if (!data) return <div>Loading...</div>

  return (
    <div>
      <div>{data.city.name}</div>
      <div>{data.list[0].main.temp}°C</div>
    </div>
  )
}
