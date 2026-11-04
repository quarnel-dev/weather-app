import feedback from '@/components/recovery/Recovery.module.css'
import skeleton from '@/components/weatherskeleton/WeatherSkeleton.module.css'
import type { Forecast } from '@/types/Forecast.type'
import type { Weather } from '@/types/Weather.type'
import s from './ForecastTimeline.module.css'

interface Props {
  forecast: Forecast[]
  weather: Pick<Weather, 'temp' | 'icon' | 'description'>
  timezoneOffset: number
  now: number
}

export function ForecastTimeline({ forecast, weather, timezoneOffset, now }: Props) {
  const upcoming = forecast
    .filter((point) => Date.parse(point.date) > now)
    .sort((first, second) => Date.parse(first.date) - Date.parse(second.date))
    .slice(0, 7)

  if (upcoming.length === 0)
    return (
      <p className={feedback.empty} role="status">
        No upcoming forecast is available.
      </p>
    )

  return (
    <ul className={`${s.list} ${skeleton.reveal}`} tabIndex={0} aria-label="Forecast timeline">
      <li className={s.item}>
        <span className={s.time}>Now</span>
        <i className={`i-weather-${weather.icon} ${s.icon}`} role="img" aria-label={weather.description} />
        <span className={s.temperature}>{weather.temp}°</span>
      </li>
      {upcoming.map((point) => {
        const local = new Date(Date.parse(point.date) + timezoneOffset * 1000).toISOString()
        return (
          <li key={point.date} className={s.item}>
            <time className={s.time} dateTime={point.date} title={local.slice(0, 10)}>
              {local.slice(11, 16)}
            </time>
            <i className={`i-weather-${point.icon} ${s.icon}`} role="img" aria-label={point.description} />
            <span className={s.temperature}>{point.temp}°</span>
          </li>
        )
      })}
    </ul>
  )
}
