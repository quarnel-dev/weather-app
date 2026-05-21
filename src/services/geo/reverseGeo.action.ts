'use server'

interface GeoRes {
  country: string
  city: string
}

const geoCache = new Map<string, GeoRes>()

export async function reverseGeo(lat: number, lon: number): Promise<GeoRes | null> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`

  if (geoCache.has(key)) {
    return geoCache.get(key)!
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.WEATHER_API_KEY}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    if (!data?.[0]) return null

    const result = {
      country: data[0].country?.toLowerCase(),
      city: data[0].name?.toLowerCase(),
    }

    geoCache.set(key, result)

    return result
  } catch {
    return null
  }
}
