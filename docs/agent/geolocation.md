# Geolocation and remembered city

Task 3 runs on `feat/geolocation-remembered-city`, based on `origin/main` at `9125908`. This includes the lead's two explicit city-data typing fixes and the 4 GB Node heap setting for builds. The lead approved the file-level plan and local nearest-settlement lookup. The lead creates the pull request.

## Behavior

- The server-rendered homepage reads `lastCity`. An existing database ID redirects with HTTP 307 to its canonical URL before browser geolocation runs.
- Legacy JSON cookies containing `country` and `city` are accepted only when they resolve to exactly one database record. Normalized names and explicit-ID slugs are supported. Ambiguous, malformed, oversized, unknown, or invalid preferences are ignored.
- Without a usable preference, the existing browser geolocation flow runs. The server selects the nearest database settlement within 50 km and returns its canonical URL. The reverse-geocoding request and its process-local cache are removed.
- Opening a concrete canonical city page saves its ID after hydration. This covers search, geolocation, and directly entered URLs. Ambiguous choice pages, 404s, and speculative HTTP fetches do not save a city.
- An accepted legacy preference is replaced by the numeric ID when its city page mounts. The cookie is HTTP-only, uses `SameSite=Lax`, applies to `/`, expires after 30 days, and is secure in production. Saving the same ID again skips the write, so expiry is not renewed on every visit.
- Denied, unsupported, failed, or unavailable geolocation leads to the existing search UI. No new styles or dependencies are introduced.

## Implementation

The old middleware is removed. Homepage restoration now belongs to the server page, where the city database and canonical URL helper are available. Its client UI moves to `components/home/Home.tsx` and retains the existing animation and styles.

`nearestCity.server.ts` validates finite numeric coordinates and latitude/longitude bounds. It uses a spherical Haversine comparison with an initial latitude filter. Equal-distance candidates are resolved by database ID. It handles the antimeridian and high latitudes. Lookup scans the existing server index without constructing another copy of the database or sending it to the browser.

`resolveLocation.action.ts` exposes coordinate resolution as a server action. `rememberedCity.server.ts` validates preferences; `rememberCity.action.ts` validates IDs again before writing a cookie. The invisible `RememberCity` client component invokes persistence on actual page mounts and city-ID changes. Storage failures do not block the page.

The browser helper preserves the existing accuracy and 60-second position-cache settings, with a separate 5-second watchdog in case no callback arrives. The homepage caps the whole detection flow at 10 seconds. It ignores late results after that deadline, unmounting, or a full-page navigation. A persisted `pageshow` displays search without repeating detection. Browser callbacks and already-running server actions are not physically cancelled.

## Validation

- `npm test`: **146 tests passed across 10 files**, including the existing 55 tests. Cloud duration was 97.10 seconds, with 3.58 seconds executing tests. Large JSON/module imports remain the main startup cost.
- New automated coverage includes geographic boundaries, antimeridian/polar cases, equal-distance ties, invalid coordinates, browser denial and missing callbacks, malformed and legacy cookies, secure cookie options, canonical homepage redirects, real-database resolution for Moscow and both Suzhou records, late responses, unmounting, simulated bfcache events, React Strict Mode, and preference updates after client navigation.
- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript, with the lead's 4 GB heap limit. Next.js 16.4.2 no longer reports the middleware naming deprecation.
- A production server was started with `NODE_USE_ENV_PROXY=1`. A temporary Playwright runner outside the checkout used system Chromium 154.0.8037.57. All **13 scenarios passed**, with no JavaScript page errors.
- Browser checks covered preference priority; real browser geolocation with supplied coordinates for both Suzhou records; cookie attributes, expiry, and HTTP-only access; permission-denied manual keyboard selection; restoration and migration; invalid preferences; ocean coordinates; an actual 5-second callback timeout; a delayed server response after manual navigation; unchanged preferences on ambiguity/404/plain HTTP fetches; and touch selection at a 375 px viewport. Existing weather content rendered on the selected city pages.
- Six additional direct HTTP checks confirmed canonical 307 redirects, safe 200 fallbacks, and `no-store` cache control. An untrusted cookie could not produce an external redirect.
- The production client output contains nine JavaScript chunks, 707,598 raw bytes and 221,569 bytes with each chunk gzipped. The database marker checks used in the previous audit remain absent; the server-only build boundary also passes.
- The mobile screenshot was inspected for viewport fit. The browser runner, results, and screenshot are temporary artifacts under `/tmp/weather-geo-audit/`; no browser-testing dependency was added to the project.

## Limits and review points

- Nearest means geographic proximity to a database settlement, not an administrative jurisdiction or the largest nearby city. A result near a national border can be across that border. The database's coverage determines whether a point has a match within 50 km.
- Production preference cookies require HTTPS, with the browser's loopback exception used by the local production checks. Persistence requires hydration and an available server action; a blocked or failed save leaves navigation usable but cannot remember the new choice.
- Invalid preferences remain ignored until overwritten or expired. An ambiguous legacy cookie never selects a candidate by itself; a fresh successful geolocation can independently find a nearby record.
- Browser geolocation coordinates were supplied through browser automation; hardware GPS was not tested. Bfcache lifecycle handling was covered with simulated events in Vitest, not a verified native bfcache restoration.
- The lead should review location-selection policy, the server/client homepage split, and remembered-city behavior before merging. Weather payload validation and weather-page error handling remain tasks 4 and 5.
