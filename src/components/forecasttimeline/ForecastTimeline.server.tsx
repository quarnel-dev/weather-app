import 'server-only'

import { readForecast } from '@/services/weather/forecast.server'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherFailure } from '@/services/weather/failure.server'
import Recovery from '@/components/recovery/Recovery'
import feedback from '@/components/recovery/Recovery.module.css'
import type { City } from '@/types/City.type'
import type { Weather } from '@/types/Weather.type'
import type { Forecast } from '@/types/Forecast.type'
import { ForecastTimeline } from './ForecastTimeline'

export async function ForecastTimelineServer({ city, weather }: { city: City; weather: Weather }) {
  const timezoneOffset = weather.timezoneOffset
  if (timezoneOffset === null)
    return (
      <p className={feedback.empty} role="status">
        Forecast times are unavailable for this location.
      </p>
    )

  let data: { forecast: Forecast[]; now: number }
  try {
    data = await readForecast(city)
  } catch (error) {
    if (!(error instanceof WeatherServiceError)) throw error
    console.error('Forecast request failed', { code: error.code, status: error.status })
    return <Recovery compact message="Forecast is temporarily unavailable." retryable={weatherFailure(error).retryable} />
  }

  return <ForecastTimeline forecast={data.forecast} weather={weather} timezoneOffset={timezoneOffset} now={data.now} />
}
