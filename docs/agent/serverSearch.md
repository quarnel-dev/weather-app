# Server-side city search

## Scope and decisions

- The JSON database stays unchanged under `src/data/`. SQLite is unnecessary for the current static lookup workload.
- City routing, URL generation, and indexes are protected with `server-only`. The browser receives compact search results, not records from the full database.
- The server builds a normalized, population-sorted index once per module instance. Search stops at eight matches, with ID as the tie-breaker for equal populations.
- Substring search supports city names, country codes, and country names. Query whitespace and case are normalized.
- The UI keeps the existing components and CSS. Loading, empty results, and failures use plain text. Link prefetching is disabled for suggestions to avoid fetching weather for every visible result.
- Client requests wait 250 ms after input. Query changes, blur, Escape, and unmount cancel requests; late responses from cancelled requests cannot replace current results.
- The real data contains 312 null regions. The API normalizes them to empty strings and the City type now reflects the nullable source field.
- New commits use only `codex <codex@openai.com>` for author and committer, with subject-only messages and no co-author trailers.

## API

`GET /api/cities?q=Suzhou` returns `{ results: [...] }`. Each result contains `id`, `name`, `admin1`, `country`, `countryName`, and the canonical `url`.

Queries shorter than two normalized characters return an empty list. More than 80 normalized characters or repeated `q` parameters return HTTP 400. A valid request returns at most eight results, with `Cache-Control: public, max-age=60, s-maxage=300`.

## Validation

- `npm test`: 41 tests pass using Vitest 4. Test projects separate Node tests (`--project server`) from React/jsdom tests (`--project react`). The previous seven city checks are retained.
- Tests cover API validation, compact results, population order, same-name locations, nullable regions, response validation, debounce, cancellation, stale responses, keyboard navigation, refocus/retry, unmount, and rendered status messages.
- `npm run lint` and `npm run build` passed; build includes TypeScript. Next.js still reports the existing middleware naming deprecation.
- Production HTTP checks passed for empty, short, unknown, ambiguous, country-name, null-region, overlong, and repeated-parameter queries. Suzhou returned two distinct links in a 239-byte response.
- Twenty warm local API requests across five query patterns had a median of 4.2 ms and a maximum of 13.1 ms. These are measurements from this cloud instance, not a production latency guarantee.
- The production build contains 898,564 bytes of client JavaScript across 14 files (275,936 bytes summed after individual gzip compression). Its largest file is 227,535 bytes; the previous build had database-bearing files of 26,505,194 bytes. These are artifact measurements, not browser transfer measurements.
- No database marker strings (Shenzhen, Kinshasa, Guangzhou) were present in the generated client JavaScript. The successful build also validates the server-only import boundaries.
- The homepage, ambiguous city page, invalid-city 404, and live Moscow weather passed production HTTP checks.
- React/jsdom component tests validate markup and interactions. No visual browser review was performed.

## Remaining work

Geolocation and remembered-city migration remain task 3. Weather API timeouts/error handling and page retry behavior remain tasks 4 and 5. No redesign or database refresh is included here.
