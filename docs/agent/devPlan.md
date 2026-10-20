# Development plan

Agent working documents live in this directory; repository instructions are in [`../../AGENTS.md`](../../AGENTS.md).

The user acts as lead developer and reviews scope and design. Do not commit or push without their instruction.

1. **City identity and routes — completed and accepted by the lead.** Keep `/country/city` for unique slugs within a country. When slugs collide, use `/country/city-ID`; the short address shows a choice of locations, never silently selects one. Match collisions after slug normalization. Request weather and forecast using the selected record's coordinates. Reuse existing components and styles.
2. **Server-side search — implemented, awaiting lead review.** Remove the city database from the browser bundle, debounce searches and ignore stale responses. Keep JSON on the server; add Vitest and preserve the current design, using plain text for new states. Decisions and checks: [`serverSearch.md`](serverSearch.md).
3. **Geolocation and remembered city.** Resolve coordinates to a database record, use canonical URLs, validate cookies and provide search fallback.
4. **Weather service reliability.** Validate API payloads, distinguish failures, add timeouts and remove the unused forecast log/request.
5. **Page error handling.** Keep search available during API failures and provide retry behavior.
6. **Validation and documentation.** Cover core flows and document setup. Add relevant tests alongside each earlier task.

## Task 1 decisions

- The unique database ID selects the record; its latitude/longitude select the weather location.
- Exact short slugs are resolved before interpreting an ID suffix, including names that already end in numbers.
- Explicit ID URLs for otherwise unique cities redirect to the short canonical URL.
- Wrong country, unknown ID or mismatched name/ID combinations return 404.
- Empty slugs use `city-ID`, since some names are entirely removed by the current slug function.
- A future database refresh must preserve previous canonical routes as aliases if new collisions appear. No database refresh is included here.
- Geolocation/cookie migration remains task 3; it is not fixed by the route changes alone.

## Task 1 validation

- `npm test`: seven tests, including unique URL/ID round trips for all 177,738 database records and mocked coordinate-based weather/forecast requests. Uses Node 24's built-in test runner and the existing TypeScript compiler; no new dependencies.
- `npm run lint` and `npm run build`: passed (build includes TypeScript).
- Production server HTTP checks: `/cn/suzhou` lists Jiangsu and Anhui with distinct links; `/ru/moscow-524901` redirects with HTTP 308 to `/ru/moscow`; unknown/mismatched city IDs return 404.
- Live weather checks: `/ru/moscow`, `/cn/suzhou-1886760` and `/cn/suzhou-1793743` return HTTP 200 with rendered temperatures. These checks require the existing WEATHER_API_KEY binding and, in the Codex cloud environment, `NODE_USE_ENV_PROXY=1`.
- The choice page reuses search item styles and existing theme variables. Browser appearance has not been visually reviewed.
