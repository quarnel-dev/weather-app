import cities from '@/data/cities.json'
import countries from '@/data/countries.json'

import { toSlug } from '@/utils/slug'

import { City } from '@/types/City.type'
import { Country } from '@/types/Country.type'

export const countryMap = new Map<string, string>((countries as Country[]).map(({ code, name }) => [code, name]))

const MAX_RESULTS = 8
const SCAN_LIMIT = MAX_RESULTS * 4

function normalise(str: string) {
  return str.toLowerCase().trim()
}

export function searchCities(query: string): City[] {
  const q = normalise(query)
  if (q.length < 2) return []

  const byCity: City[] = []
  const byCountry: City[] = []

  for (const city of cities as City[]) {
    if (byCity.length + byCountry.length >= SCAN_LIMIT) break

    if (normalise(city.name).includes(q)) {
      byCity.push(city)
    } else if (normalise(countryMap.get(city.country) ?? '').includes(q)) {
      byCountry.push(city)
    }
  }

  return [...byCity, ...byCountry].sort((a, b) => Number(b.pop) - Number(a.pop)).slice(0, MAX_RESULTS)
}

export function findCity(country: string, city: string): City | undefined {
  return (cities as City[]).find((c) => toSlug(c.country) === country && toSlug(c.name) === city)
}
