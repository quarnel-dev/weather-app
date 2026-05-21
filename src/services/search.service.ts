import countries from '@/data/countries.json'

import { cityBySlug, cityNameIndex, countryNameIndex } from './cities.index'

import { normalize } from '@/utils/normalize'

import { City } from '@/types/City.type'
import { Country } from '@/types/Country.type'

export const countryMap = new Map<string, string>((countries as Country[]).map(({ code, name }) => [code, name]))

export function searchCities(query: string): City[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const result: City[] = []
  const seen = new Set<string>()

  for (const [key, cities] of cityNameIndex) {
    if (key.includes(q)) {
      for (const city of cities) {
        const id = `${city.country}-${city.name}`
        if (seen.has(id)) continue
        seen.add(id)
        result.push(city)
      }
    }
  }

  for (const [key, cities] of countryNameIndex) {
    if (key.includes(q)) {
      for (const city of cities) {
        const id = `${city.country}-${city.name}`
        if (seen.has(id)) continue
        seen.add(id)
        result.push(city)
      }
    }
  }

  return result.sort((a, b) => Number(b.pop) - Number(a.pop)).slice(0, 8)
}

export function findCity(country: string, city: string): City | undefined {
  return cityBySlug.get(`${country}-${city}`)
}
