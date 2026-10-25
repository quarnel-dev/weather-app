# Development plan

Agent working documents live in this directory; repository instructions are in [`../../AGENTS.md`](../../AGENTS.md).

The user acts as lead developer and reviews scope and design. Do not commit or push without their instruction.

1. **City identity and routes — completed and accepted by the lead.** Keep `/country/city` for unique slugs within a country. When slugs collide, use `/country/city-ID`; the short address shows a choice of locations, never silently selects one. Match collisions after slug normalization. Request weather and forecast using the selected record's coordinates. Reuse existing components and styles.
2. **Server-side search — completed, accepted, and merged by the lead.** Remove the city database from the browser bundle, debounce searches and ignore stale responses. Keep JSON on the server; add Vitest and preserve the current design, using plain text for new states. Decisions and checks: [`serverSearch.md`](serverSearch.md). Follow-up defects, browser checks, and dependency findings: [`searchAudit.md`](searchAudit.md).
3. **Geolocation and remembered city — completed, accepted, and merged by the lead.** Resolve coordinates to a database record, use canonical URLs, validate cookies and provide search fallback. The lead approved selecting the nearest database settlement within 50 km without a reverse-geocoding API request. Implemented on `feat/geolocation-remembered-city`, based on the lead's merged search fixes and build-memory setting. Decisions, checks, and limitations: [`geolocation.md`](geolocation.md).
4. **Weather service reliability — completed, accepted, and merged by the lead.** Validate API payloads, distinguish failures, add timeouts and remove the unused forecast log/request. Implemented on `fix/weather-service-reliability`. Decisions and validation: [`weatherService.md`](weatherService.md).
5. **Page error handling — completed, accepted, and merged by the lead in PR #6.** Keep search available during provider failures, retry server content without losing search state, contain unexpected weather errors, and recover through search from route failures and 404s. The lead fixed the intermittent browser selector in `12d3fd4`; both CI jobs passed afterward. Decisions, discovered defects, and checks: [`appStability.md`](appStability.md).
6. **Validation and documentation — automated checks and agent instructions implemented; README deferred by agreement.** Vitest, explicit TypeScript checking, formatting, lint, production builds, and persistent desktop/mobile Playwright scenarios run in CI. Working notes live here. README and final user-facing setup documentation remain reserved for joint work with the lead.

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

## App stability scope (completed)

Branch: `feat/app-stability`, based on `main` at `1bd91d0`.

The lead approved the following scope and explicitly gave the green light to implement it in this branch:

1. Add page error handling and recovery while keeping search usable.
2. Verify connected user flows and fix confirmed problems.
3. Add persistent Playwright browser tests; the new development dependency is approved.
4. Integrate browser checks into CI and update agent working notes in this directory.
5. Review the entire application after implementation, fix discovered defects, and repeat relevant checks.

Preserve the existing design and use plain text for new states. Leave README changes for later work together with the lead. Keep commits atomic, with subject-only messages and `codex <codex@openai.com>` as author and committer. The lead creates the Draft PR and decides when to merge.

The lead created PR #6 and merged the completed work. Its development workflow remains applicable: implement and validate one coherent increment at a time, then commit and push it before continuing. Do not rewrite completed development into a batch of retrospective commits.

## Weather page scope

Branch: `feat/weather-page`, based on the updated `main` at `12d3fd4`.

The lead authorized creating and publishing the branch. Implementation has not started; work proceeds one task at a time, with the result shown before taking on the next task. The lead exclusively creates and manages the PR; do not edit its title, description, comments, or status.

Agreed tasks:

1. Prepare page data: preserve pressure, visibility, and the city's UTC offset; retain the three-hour forecast points and group them by local date for daily temperature ranges.
2. Build the current-weather card from the supplied screenshots: city, temperature, conditions, feels-like value, weather icon, and gradient background.
3. Add the forecast timeline within that card, with horizontal scrolling on small screens.
4. Add metric cards and sunrise/sunset using the appropriate units and city-local times.
5. Add the daily forecast with conditions, icons, and temperature ranges.
6. Review the complete responsive page, spacing, loading, and recovery states with the lead.

Use the existing OpenWeather access: five-day forecasts at three-hour intervals. One Call access returned HTTP 401 and requires a separate subscription; do not promise hourly or seven-day data. Reuse existing global styles, fonts, search, and CSS Modules. Adapt each block as it is built.

This project targets one release. Keep functions and components readable and relatively small, avoid speculative abstractions and new infrastructure, and add tests only for meaningful changed logic or confirmed regressions. Preserve incremental, subject-only commits with Codex as author and committer. README remains reserved for joint work with the lead at the end.
