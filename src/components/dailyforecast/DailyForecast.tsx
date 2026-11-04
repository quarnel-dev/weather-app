import feedback from '@/components/recovery/Recovery.module.css'
import skeleton from '@/components/weatherskeleton/WeatherSkeleton.module.css'
import type { CSSProperties } from 'react'
import type { DailyForecast as Day } from '@/types/DailyForecast.type'
import s from './DailyForecast.module.css'

export function DailyForecast({ days, today }: { days: Day[]; today: string }) {
  if (days.length === 0)
    return (
      <p className={feedback.empty} role="status">
        No daily forecast is available.
      </p>
    )

  const minimum = Math.min(...days.map((day) => day.tempMin))
  const maximum = Math.max(...days.map((day) => day.tempMax))
  const span = maximum - minimum
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' })

  return (
    <ul className={`${s.list} ${skeleton.reveal}`} aria-label="Daily forecast">
      {days.map((day) => (
        <li key={day.date} className={s.row}>
          <time className={s.day} dateTime={day.date} title={day.date}>
            {day.date === today ? 'Today' : weekday.format(new Date(`${day.date}T00:00:00Z`))}
          </time>
          <i className={`i-weather-${day.icon} ${s.icon}`} aria-hidden="true" />
          <span className={s.description}>{day.description}</span>
          <span className={s.minimum} aria-label={`Minimum ${Math.round(day.tempMin)} degrees Celsius`}>
            {Math.round(day.tempMin)}°
          </span>
          <span className={s.track} aria-hidden="true">
            <span
              className={s.range}
              style={
                {
                  '--range-start': `${span === 0 ? 0 : ((day.tempMin - minimum) / span) * 100}%`,
                  width: `${span === 0 ? 100 : ((day.tempMax - day.tempMin) / span) * 100}%`,
                } as CSSProperties
              }
            />
          </span>
          <span className={s.maximum} aria-label={`Maximum ${Math.round(day.tempMax)} degrees Celsius`}>
            {Math.round(day.tempMax)}°
          </span>
        </li>
      ))}
    </ul>
  )
}
