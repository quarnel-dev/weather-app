import 'server-only'

import { cityById } from '@/services/cities.index'
import type { City } from '@/types/City.type'

const EARTH_RADIUS_KM = 6371
const MAX_DISTANCE_KM = 50
const TO_RADIANS = Math.PI / 180
const MAX_LATITUDE_DELTA = MAX_DISTANCE_KM / EARTH_RADIUS_KM
const MAX_HAVERSINE = Math.sin(MAX_LATITUDE_DELTA / 2) ** 2

export function findNearestCity(lat: number, lon: number): City | null {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null

  const latitude = lat * TO_RADIANS
  const longitude = lon * TO_RADIANS
  let nearest: City | null = null
  let shortest = MAX_HAVERSINE

  for (const city of cityById.values()) {
    const cityLatitude = Number(city.lat) * TO_RADIANS
    const latitudeDelta = cityLatitude - latitude
    if (Math.abs(latitudeDelta) > MAX_LATITUDE_DELTA) continue

    const longitudeDelta = Number(city.lon) * TO_RADIANS - longitude
    const distance = Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(latitude) * Math.cos(cityLatitude) * Math.sin(longitudeDelta / 2) ** 2

    if (distance < shortest || (distance === shortest && (!nearest || city.id < nearest.id))) {
      shortest = distance
      nearest = city
    }
  }

  return nearest
}
