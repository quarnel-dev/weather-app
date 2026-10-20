import { describe, expect, test } from 'vitest'
import { GET } from '@/app/api/cities/route'
import { findCities, searchCities } from '@/services/search.service'
import type { CitySearchResult } from '@/types/CitySearchResult.type'

async function request(query = '') {
  return GET(new Request(`http://localhost/api/cities${query}`))
}

describe('city search API', () => {
  test.each(['', '?q=', '?q=a', '?q=%20%20'])('returns no results for a short query: %s', async (query) => {
    const response = await request(query)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ results: [] })
  })

  test('normalizes query case and whitespace', async () => {
    const first = await request('?q=Suzhou')
    const second = await request('?q=%20SUZHOU%20')
    expect(await first.json()).toEqual(await second.json())
  })

  test('returns compact, distinct links for same-name cities', async () => {
    const response = await request('?q=Suzhou')
    const { results }: { results: CitySearchResult[] } = await response.json()
    expect(results).toHaveLength(2)
    expect(results.map((city) => city.admin1)).toEqual(expect.arrayContaining(['Jiangsu', 'Anhui']))
    for (const result of results) {
      expect(Object.keys(result).sort()).toEqual(['admin1', 'country', 'countryName', 'id', 'name', 'url'])
      const [, country, slug] = result.url.split('/')
      expect(findCities(country, slug)[0].id).toBe(result.id)
    }
    expect(new Set(results.map((city) => city.url)).size).toBe(2)
  })

  test('limits broad queries to eight results', async () => {
    const response = await request('?q=in')
    const { results } = await response.json()
    expect(results).toHaveLength(8)
    expect(new Set(results.map((city: CitySearchResult) => city.id)).size).toBe(8)
    expect(response.headers.get('Cache-Control')).toContain('max-age=60')
  })

  test('returns no results for an unknown city', async () => {
    const response = await request('?q=zzzzzzzzzzzzzzzzz')
    expect(await response.json()).toEqual({ results: [] })
  })

  test('supports country names and orders results by population', async () => {
    const response = await request('?q=United%20States')
    const { results }: { results: CitySearchResult[] } = await response.json()
    expect(results).toHaveLength(8)
    expect(results.every((city) => city.country === 'US')).toBe(true)
    const populations = searchCities('United States').map((city) => Number(city.pop))
    expect(populations).toEqual([...populations].sort((a, b) => b - a))
  })

  test('normalizes missing regions to an empty string', async () => {
    const response = await request('?q=Hong%20Kong')
    const { results }: { results: CitySearchResult[] } = await response.json()
    expect(results.find((city) => city.id === 1819729)?.admin1).toBe('')
    expect(results.every((city) => typeof city.admin1 === 'string')).toBe(true)
  })

  test.each([`?q=${'x'.repeat(81)}`, '?q=London&q=Moscow'])('rejects invalid query: %s', async (query) => {
    const response = await request(query)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: expect.any(String) })
  })
})
