'use server'

interface GeoRes {
  country: string
  city: string
}

export async function reverseGeo(lat: number, lon: number): Promise<GeoRes | null> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.WEATHER_API_KEY}`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null

    return {
      country: data[0].country?.toLowerCase(),
      city: data[0].name?.toLowerCase(),
    }
  } catch {
    return null
  }
}
