'use server'

const key = process.env.WEATHER_API_KEY

export async function getWeather(city: string) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}&units=metric&lang=en`)

  if (!res.ok) throw new Error('City not found')

  return res.json()
}

export async function getForecast(city: string) {
  return ''
}
  