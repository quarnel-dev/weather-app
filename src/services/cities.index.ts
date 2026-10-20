import cities from '../data/cities.json'
import { toSlug } from '../utils/slug'
import type { City } from '../types/City.type'

const citiesArray = cities as City[]

export const citiesBySlug = new Map<string, City[]>()
export const cityById = new Map<number, City>()


for (const city of citiesArray) {
  const key = `${toSlug(city.country)}-${toSlug(city.name)}`
  if (!citiesBySlug.has(key)) citiesBySlug.set(key, [])
  citiesBySlug.get(key)!.push(city)
  cityById.set(city.id, city)

}
