import type { WeatherIcon } from './WeatherIcon.type'

export interface Weather {
  city: string
  country: string

  temp: number
  tempMin: number
  tempMax: number
  feelsLike: number

  description: string
  main: string
  icon: WeatherIcon

  humidity: number

  windSpeed: number
  windDeg: number | null

  clouds: number

  sunrise: number | null
  sunset: number | null

  coord: {
    lat: number
    lon: number
  }
}

