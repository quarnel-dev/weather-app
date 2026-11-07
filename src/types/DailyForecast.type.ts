import type { WeatherIcon } from './WeatherIcon.type'

export interface DailyForecast {
  date: string
  tempMin: number
  tempMax: number
  description: string
  icon: WeatherIcon
}
