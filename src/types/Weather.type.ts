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
  windDeg: number

  clouds: number

  sunrise: number
  sunset: number

  coord: {
    lat: number
    lon: number
  }
}

