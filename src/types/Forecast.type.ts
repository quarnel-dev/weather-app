import type { WeatherIcon } from './WeatherIcon.type'

export interface Forecast {
  date: string

  temp: number
  tempMin: number
  tempMax: number

  description: string

  icon: WeatherIcon

  humidity: number

  windSpeed: number
}
