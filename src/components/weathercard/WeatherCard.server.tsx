import 'server-only'

import { Suspense } from 'react'
import { ForecastTimelineSkeleton, DailyForecastSkeleton } from '@/components/weatherskeleton/WeatherSkeleton'
import { WeatherCard } from './WeatherCard'
import WeatherBoundary from './WeatherBoundary'
import { ForecastTimelineServer } from '@/components/forecasttimeline/ForecastTimeline.server'

import { getWeather } from '@/services/weather.service'
import type { City } from '@/types/City.type'
import type { Weather } from '@/types/Weather.type'
import { WeatherServiceError } from '@/services/weather/weatherError'
import { weatherFailure } from '@/services/weather/failure.server'
import Recovery from '@/components/recovery/Recovery'
import { DailyForecastServer } from '@/components/dailyforecast/DailyForecast.server'
import dailyStyles from '@/components/dailyforecast/DailyForecast.module.css'
import { WeatherDetails } from '@/components/weatherdetails/WeatherDetails'

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
    <>
      <WeatherCard weather={data} city={city}>
        <WeatherBoundary message="Forecast could not be displayed. Try again.">
          <Suspense fallback={<ForecastTimelineSkeleton />}>
            <ForecastTimelineServer city={city} weather={data} />
          </Suspense>
        </WeatherBoundary>
      </WeatherCard>
      <WeatherDetails weather={data} />
      <section className={dailyStyles.container} aria-label="Daily forecast">
        <h2 className={dailyStyles.heading}>Daily Forecast</h2>
        <WeatherBoundary message="Daily forecast could not be displayed. Try again.">
          <Suspense fallback={<DailyForecastSkeleton />}>
            <DailyForecastServer city={city} weather={data} />
          </Suspense>
        </WeatherBoundary>
      </section>
    </>
  )
}
