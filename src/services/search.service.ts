import countries from '../data/countries.json'

import { cityById, citiesBySlug, cityNameIndex, countryNameIndex } from './cities.index'

import { normalize } from '../utils/normalize'
import { toSlug } from '../utils/slug'

import { City } from '@/types/City.type'
import { Country } from '@/types/Country.type'

export const countryMap = new Map<string, string>((countries as Country[]).map(({ code, name }) => [code, name]))

export function searchCities(query: string): City[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const result: City[] = []
  const seen = new Set<number>()

  for (const [key, cities] of cityNameIndex) {
    if (key.includes(q)) {
      for (const city of cities) {
        const id = city.id
        if (seen.has(id)) continue
        seen.add(id)
        result.push(city)
      }
    }
  }

  for (const [key, cities] of countryNameIndex) {
    if (key.includes(q)) {
      for (const city of cities) {
        const id = city.id
        if (seen.has(id)) continue
        seen.add(id)
        result.push(city)
      }
    }
  }

  return result.sort((a, b) => Number(b.pop) - Number(a.pop)).slice(0, 8)
}

export function findCities(country: string, slug: string): City[] {
  const matches = citiesBySlug.get(`${country}-${slug}`)
  if (matches) return [...matches].sort((a, b) => Number(b.pop) - Number(a.pop))

  const match = /^(.*)-(\d+)$/.exec(slug)
  if (!match) return []

  const city = cityById.get(Number(match[2]))
  if (!city || toSlug(city.country) !== country || (toSlug(city.name) || 'city') !== match[1]) return []

  return [city]
}
