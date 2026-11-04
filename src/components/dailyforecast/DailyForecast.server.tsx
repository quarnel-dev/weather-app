import 'server-only'

import { readForecast } from '@/services/weather/forecast.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherFailure } from '@/services/weather/failure.server'
import { groupForecastByDay } from '@/utils/groupForecastByDay'
import Recovery from '@/components/recovery/Recovery'
import type { City } from '@/types/City.type'
import type { Weather } from '@/types/Weather.type'
import type { Forecast } from '@/types/Forecast.type'
import { DailyForecast } from './DailyForecast'

export async function DailyForecastServer({ city, weather }: { city: City; weather: Weather }) {
  const offset = weather.timezoneOffset
  if (offset === null) return <p>Forecast dates are unavailable for this location.</p>

  let data: { forecast: Forecast[]; now: number }
  try {
    data = await readForecast(city)
  } catch (error) {
    if (!(error instanceof WeatherServiceError)) throw error
    console.error('Daily forecast request failed', { code: error.code, status: error.status })
    return <Recovery message="Daily forecast is temporarily unavailable." retryable={weatherFailure(error).retryable} />
  }

  const today = new Date(data.now + offset * 1000).toISOString().slice(0, 10)
  const days = groupForecastByDay(data.forecast, offset).filter((day) => day.date >= today)
  return <DailyForecast days={days} today={today} />
}
