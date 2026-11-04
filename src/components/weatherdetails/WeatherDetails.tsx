import type { Weather } from '@/types/Weather.type'
import s from './WeatherDetails.module.css'
import { SkeletonValue } from '@/components/weatherskeleton/SkeletonValue'

export function WeatherDetails({ weather }: { weather?: Weather }) {
  const metrics = [
    { name: 'Wind', icon: 'wind', value: weather ? Math.round(weather.windSpeed * 3.6) : null, unit: 'km/h', color: 'blue' },
    { name: 'Humidity', icon: 'humidity', value: weather?.humidity, unit: '%', color: 'cyan' },
    { name: 'Pressure', icon: 'pressure', value: weather?.pressure, unit: 'hPa', color: 'violet' },
    {
      name: 'Visibility',
      icon: 'visibility',
      value: weather?.visibility == null ? null : Number((weather.visibility / 1000).toFixed(1)),
      unit: 'km',
      color: 'indigo',
    },
  ]
  const solar = [
    { name: 'Sunrise', icon: 'sunrise', timestamp: weather?.sunrise },
    { name: 'Sunset', icon: 'sunset', timestamp: weather?.sunset },
  ]

  return (
    <section className={s.details} aria-label="Weather details">
      <div className={s.metrics}>
        {metrics.map((metric) => (
          <section key={metric.name} className={`${s.card} ${s[metric.color]}`} aria-label={metric.name}>
            <h2 className={s.label}>
              <i className={`i-${metric.icon}`} aria-hidden="true" />
              {metric.name}
            </h2>
            <p className={s.value}>{weather ? (metric.value ?? '—') : <SkeletonValue width="3ch" />}</p>
            <p className={s.unit}>{metric.unit}</p>
          </section>
        ))}
      </div>
      <div className={s.solar}>
        {solar.map((event) => {
          const local =
            event.timestamp == null || weather?.timezoneOffset == null
              ? null
              : new Date((event.timestamp + weather.timezoneOffset) * 1000).toISOString()
          return (
            <section key={event.name} className={`${s.card} ${s[event.icon]}`} aria-label={event.name}>
              <h2 className={s.label}>
                <i className={`i-${event.icon}`} aria-hidden="true" />
                {event.name}
              </h2>
              <p className={s.value}>
                {!weather ? (
                  <SkeletonValue />
                ) : local ? (
                  <time dateTime={new Date(event.timestamp! * 1000).toISOString()} title={local.slice(0, 10)}>
                    {local.slice(11, 16)}
                  </time>
                ) : (
                  '—'
                )}
              </p>
            </section>
          )
        })}
      </div>
    </section>
  )
}
