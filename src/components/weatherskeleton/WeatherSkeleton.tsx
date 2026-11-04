import type { City } from '@/types/City.type'
import { WeatherCard } from '@/components/weathercard/WeatherCard'
import { WeatherDetails } from '@/components/weatherdetails/WeatherDetails'
import timeline from '@/components/forecasttimeline/ForecastTimeline.module.css'
import daily from '@/components/dailyforecast/DailyForecast.module.css'
import { SkeletonValue } from './SkeletonValue'
import s from './WeatherSkeleton.module.css'

export function ForecastTimelineSkeleton() {
  return (
    <div role="status" aria-label="Loading forecast...">
      <span className={s.message}>Loading forecast...</span>
      <div className={timeline.list} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className={timeline.item}>
            <span className={timeline.time}>
              <SkeletonValue />
            </span>
            <span className={`${timeline.icon} ${s.icon}`} />
            <span className={timeline.temperature}>
              <SkeletonValue width="2ch" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DailyForecastSkeleton() {
  return (
    <div role="status" aria-label="Loading daily forecast...">
      <span className={s.message}>Loading daily forecast...</span>
      <div className={daily.list} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className={daily.row}>
            <span className={daily.day}>
              <SkeletonValue />
            </span>
            <span className={`${daily.icon} ${s.icon}`} />
            <span className={daily.description}>
              <SkeletonValue width="12ch" />
            </span>
            <span className={daily.minimum}>
              <SkeletonValue width="2ch" />
            </span>
            <span className={daily.track}>
              <SkeletonValue width="70%" />
            </span>
            <span className={daily.maximum}>
              <SkeletonValue width="2ch" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WeatherSkeleton({ city }: { city: Pick<City, 'name' | 'country' | 'admin1'> }) {
  return (
    <div role="status" aria-label="Loading weather...">
      <span className={s.message}>Loading weather...</span>
      <div className={s.page} aria-hidden="true">
        <WeatherCard city={city}>
          <ForecastTimelineSkeleton />
        </WeatherCard>
        <WeatherDetails />
        <section className={daily.container}>
          <h2 className={daily.heading}>Daily Forecast</h2>
          <DailyForecastSkeleton />
        </section>
      </div>
    </div>
  )
}
