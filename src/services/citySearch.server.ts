import type { CitySearchResult } from '@/types/CitySearchResult.type'
import { cityUrl } from '@/utils/cityUrl'
import { countryMap, searchCities } from './search.service'

export function searchCityResults(query: string): CitySearchResult[] {
  return searchCities(query).map((city) => ({
    id: city.id,
    name: city.name,
    admin1: city.admin1,
    country: city.country,
    countryName: countryMap.get(city.country) ?? city.country,
    url: cityUrl(city),
  }))
}
