import type { ReactNode } from 'react'
import type { Weather } from '@/types/Weather.type'
import type { City } from '@/types/City.type'
import s from './WeatherCard.module.css'
import skeleton from '@/components/weatherskeleton/WeatherSkeleton.module.css'
import { SkeletonValue } from '@/components/weatherskeleton/SkeletonValue'

interface Props {
  weather?: Weather
  city: Pick<City, 'name' | 'country' | 'admin1'>
  children: ReactNode
}

export function WeatherCard({ weather, city, children }: Props) {
  return (
    <section className={s.card} aria-label="Current weather">
      <div className={s.location}>
        <i className={`i-location ${s.locationIcon}`} aria-hidden="true" />
        <h1 className={s.city}>
          <span>{city.name}</span>, {city.country}
          {city.admin1 && city.admin1 !== city.name && <span> · {city.admin1}</span>}
        </h1>
      </div>
      {weather ? (
        <i className={`i-weather-${weather.icon} ${s.weatherIcon} ${skeleton.reveal}`} aria-hidden="true" />
      ) : (
        <span className={`${s.weatherIcon} ${skeleton.icon}`} aria-hidden="true" />
      )}
      <div className={`${s.conditions} ${weather ? skeleton.reveal : ''}`}>
        <p
          className={s.temperature}
          aria-label={weather ? `${weather ? weather.temp : <SkeletonValue width="2ch" />} degrees Celsius` : undefined}
        >
          {weather ? weather.temp : <SkeletonValue width="2ch" />}
          <span className={s.unit}>°C</span>
        </p>
        <p className={s.description}>{weather ? weather.description : <SkeletonValue width="12ch" />}</p>
        <p className={s.feelsLike}>Feels like {weather ? weather.feelsLike : <SkeletonValue width="2ch" />}°</p>
      </div>
      <section className={s.forecast} aria-label="Three-hour forecast">
        {children}
      </section>
    </section>
  )
}
