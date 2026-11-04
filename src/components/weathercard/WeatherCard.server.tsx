import 'server-only'

import { Suspense } from 'react'
import { WeatherCard } from './WeatherCard'
import WeatherBoundary from './WeatherBoundary'
import { ForecastTimelineServer } from '@/components/forecasttimeline/ForecastTimeline.server'

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
  return (
    <WeatherCard weather={data} city={city}>
      <WeatherBoundary message="Forecast could not be displayed. Try again.">
        <Suspense fallback={<p role="status">Loading forecast...</p>}>
          <ForecastTimelineServer city={city} weather={data} />
        </Suspense>
      </WeatherBoundary>
    </WeatherCard>
  )
}
