import 'server-only'

import { cache } from 'react'
import { getForecast } from '@/services/weather.service'
import type { City } from '@/types/City.type'

export const readForecast = cache(async (city: City) => {
  const forecast = await getForecast(city)
  return { forecast, now: Date.now() }
})
