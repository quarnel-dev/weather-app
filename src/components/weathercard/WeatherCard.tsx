import type { ReactNode } from 'react'
import type { Weather } from '@/types/Weather.type'
import type { City } from '@/types/City.type'
import s from './WeatherCard.module.css'

interface Props {
  weather: Weather
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
      <i className={`i-weather-${weather.icon} ${s.weatherIcon}`} aria-hidden="true" />
      <div className={s.conditions}>
        <p className={s.temperature} aria-label={`${weather.temp} degrees Celsius`}>
          {weather.temp}
          <span className={s.unit}>°C</span>
        </p>
        <p className={s.description}>{weather.description}</p>
        <p className={s.feelsLike}>Feels like {weather.feelsLike}°</p>
      </div>
      <section className={s.forecast} aria-label="Three-hour forecast">
        {children}
      </section>
    </section>
  )
}
