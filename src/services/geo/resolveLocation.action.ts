'use server'

import { findNearestCity } from './nearestCity.server'
import { cityUrl } from '@/utils/cityUrl'

export async function resolveLocation(lat: number, lon: number): Promise<string | null> {
  const city = findNearestCity(lat, lon)
  return city ? cityUrl(city) : null
}
