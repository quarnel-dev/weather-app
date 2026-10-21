import type { CitySearchResult } from '@/types/CitySearchResult.type'
import { SEARCH_RESULT_LIMIT } from './search.constants'

function isSearchResult(value: unknown): value is CitySearchResult {
  if (!value || typeof value !== 'object') return false
  const city = value as Record<string, unknown>

  return Number.isSafeInteger(city.id) &&
    typeof city.name === 'string' &&
    typeof city.admin1 === 'string' &&
    typeof city.country === 'string' &&
    typeof city.countryName === 'string' &&
    typeof city.url === 'string' && /^\/[a-z]{2}\/[\w-]+$/.test(city.url)
}

export async function fetchCityResults(query: string, signal: AbortSignal): Promise<CitySearchResult[]> {
  const response = await fetch(`/api/cities?${new URLSearchParams({ q: query })}`, { signal })
  if (!response.ok) throw new Error('City search failed')

  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object' || !('results' in payload) ||
    !Array.isArray(payload.results) || payload.results.length > SEARCH_RESULT_LIMIT ||
    !payload.results.every(isSearchResult)) {
    throw new Error('Invalid city search response')
  }

  return payload.results
}
