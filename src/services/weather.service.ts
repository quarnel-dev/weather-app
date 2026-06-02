'use server'

import type { Weather } from '@/types/Weather.type'
import type { Forecast } from '@/types/Forecast.type'
import type { WeatherIcon } from '@/types/WeatherIcon.type'

const key = process.env.WEATHER_API_KEY

export async function getWeather(city: string): Promise<Weather> {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric&lang=en`, {
    next: { revalidate: 600 },
  })

  if (!res.ok) {
    throw new Error('City not found')
  }

  const data = await res.json()

  const result: Weather = {
    city: data.name,
    country: data.sys.country,

    temp: Math.round(data.main.temp),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    feelsLike: Math.round(data.main.feels_like),

    description: data.weather?.[0]?.description ?? '',
    main: data.weather?.[0]?.main ?? '',
    icon: mapWeatherIcon(data.weather?.[0]?.icon ?? ''),

    humidity: data.main.humidity,

    windSpeed: data.wind.speed,
    windDeg: data.wind.deg,

    clouds: data.clouds.all,

    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,

    coord: {
      lat: data.coord.lat,
      lon: data.coord.lon,
    },
  }

  return result
}

export async function getForecast(city: string) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}&units=metric&lang=en`, {
    next: { revalidate: 600 },
  })

  if (!res.ok) {
    throw new Error('City not found')
  }

  const data = await res.json()

  const daily = data.list.filter((item: any) => item.dt_txt.includes('12:00:00'))

  const result: Forecast[] = daily.map((item: any) => ({
    date: item.dt_txt,
    temp: Math.round(item.main.temp),
    tempMin: Math.round(item.main.temp_min),
    tempMax: Math.round(item.main.temp_max),
    description: item.weather?.[0]?.description ?? '',
    icon: mapWeatherIcon(item.weather?.[0]?.icon ?? ''),
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
  }))

  return result
}

function mapWeatherIcon(icon: string): WeatherIcon {
  if (icon.startsWith('01')) {
    return icon.endsWith('d') ? 'clearDay' : 'clearNight'
  }

  if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04')) {
    return 'clouds'
  }

  if (icon.startsWith('09') || icon.startsWith('10')) {
    return 'rain'
  }

  if (icon.startsWith('11')) {
    return 'storm'
  }

  if (icon.startsWith('13')) {
    return 'snow'
  }

  if (icon.startsWith('50')) {
    return 'mist'
  }

  return 'unknown'
}
