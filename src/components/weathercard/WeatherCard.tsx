'use client'

import { Weather } from '@/types/Weather.type'

export function WeatherCard({ res }: { res: Weather }) {
  const data = res

  return (
    <div>
      <div>{data.city}</div>
      <div>{data.temp}°C</div>
      <div>{data.description}</div>
      <div>{data.icon}</div>
    </div>
  )
}
