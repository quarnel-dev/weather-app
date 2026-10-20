import cities from '../data/cities.json'
import { toSlug } from '../utils/slug'
import type { City } from '../types/City.type'

import { normalize } from '../utils/normalize'

const citiesArray = cities as City[]

export const citiesBySlug = new Map<string, City[]>()
export const cityById = new Map<number, City>()

export const cityNameIndex = new Map<string, City[]>()

export const countryNameIndex = new Map<string, City[]>()


for (const city of citiesArray) {
  const key = `${toSlug(city.country)}-${toSlug(city.name)}`
  if (!citiesBySlug.has(key)) citiesBySlug.set(key, [])
  citiesBySlug.get(key)!.push(city)
  cityById.set(city.id, city)

  const cityKey = normalize(city.name)
  const countryKey = normalize(city.country)

  if (!cityNameIndex.has(cityKey)) cityNameIndex.set(cityKey, [])
  cityNameIndex.get(cityKey)!.push(city)

  if (!countryNameIndex.has(countryKey)) countryNameIndex.set(countryKey, [])
  countryNameIndex.get(countryKey)!.push(city)
}
