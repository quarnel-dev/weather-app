import 'server-only'

import { cityById } from '@/services/cities.index'
import { findCities } from '@/services/search.service'
import { toSlug } from '@/utils/slug'
import type { City } from '@/types/City.type'

export const REMEMBERED_CITY_COOKIE = 'lastCity'
export const REMEMBERED_CITY_MAX_AGE = 60 * 60 * 24 * 30

export function resolveRememberedCity(value: string | undefined): City | null {
  if (!value || value.length > 512) return null

  if (/^[1-9]\d{0,15}$/.test(value)) {
    const id = Number(value)
    return Number.isSafeInteger(id) ? (cityById.get(id) ?? null) : null
  }

  try {
    const legacy: unknown = JSON.parse(value)
    if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return null
    if (!('country' in legacy) || !('city' in legacy)) return null
    if (typeof legacy.country !== 'string' || !/^[a-z]{2}$/i.test(legacy.country)) return null
    if (typeof legacy.city !== 'string' || !legacy.city.trim() || /[/\\?#%\u0000-\u001f]/.test(legacy.city)) return null

    const matches = findCities(legacy.country.toLowerCase(), toSlug(legacy.city))
    return matches.length === 1 ? matches[0] : null
  } catch {
    return null
  }
}
