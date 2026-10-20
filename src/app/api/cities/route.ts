import { searchCityResults } from '@/services/citySearch.server'
import { MAX_SEARCH_LENGTH, MIN_SEARCH_LENGTH } from '@/services/search.constants'
import { normalize } from '@/utils/normalize'

export async function GET(request: Request) {
  const queries = new URL(request.url).searchParams.getAll('q')
  const query = normalize(queries[0] ?? '')

  if (queries.length > 1 || query.length > MAX_SEARCH_LENGTH) {
    return Response.json({ error: `Provide one query of up to ${MAX_SEARCH_LENGTH} characters.` }, { status: 400 })
  }

  const results = query.length < MIN_SEARCH_LENGTH ? [] : searchCityResults(query)

  return Response.json({ results }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } })
}
