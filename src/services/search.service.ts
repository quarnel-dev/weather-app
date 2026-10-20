import 'server-only'

import countries from '../data/countries.json'

import { cityById, citiesBySlug } from './cities.index'
import { MAX_SEARCH_LENGTH, MIN_SEARCH_LENGTH, SEARCH_RESULT_LIMIT } from './search.constants'

import { normalize } from '../utils/normalize'
import { toSlug } from '../utils/slug'

import { City } from '@/types/City.type'
import { Country } from '@/types/Country.type'

export const countryMap = new Map<string, string>((countries as Country[]).map(({ code, name }) => [code, name]))

const searchIndex = [...cityById.values()]
  .sort((a, b) => Number(b.pop) - Number(a.pop) || a.id - b.id)
  .map((city) => ({ city, name: normalize(city.name) }))

export function searchCities(query: string): City[] {
  const q = normalize(query)
  if (q.length < MIN_SEARCH_LENGTH || q.length > MAX_SEARCH_LENGTH) return []

  const result: City[] = []
  const matchingCountries = new Set(
    [...countryMap].filter(([code, name]) => normalize(code).includes(q) || normalize(name).includes(q)).map(([code]) => code),
  )

  for (const { city, name } of searchIndex) {
    if (name.includes(q) || matchingCountries.has(city.country)) {
      result.push(city)
      if (result.length === SEARCH_RESULT_LIMIT) break
    }
  }

  return result
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
