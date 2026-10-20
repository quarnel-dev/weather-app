import type { City } from '@/types/City.type'
import { toSlug } from './slug'
import { citiesBySlug } from '../services/cities.index'

export function cityUrl({ country, name, id }: City) {
  const countrySlug = toSlug(country)
  const nameSlug = toSlug(name)
  const matches = citiesBySlug.get(`${countrySlug}-${nameSlug}`)
  const needsId = !nameSlug || (matches?.length ?? 0) > 1

  return `/${countrySlug}/${needsId ? `${nameSlug || 'city'}-${id}` : nameSlug}`
}
