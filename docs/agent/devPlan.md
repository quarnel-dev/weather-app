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

The lead authorized task 5 after reviewing task 4, with atomic commits and pushes during development. Work proceeds one task at a time, with the result shown before taking on the next task. The lead exclusively creates and manages the PR; do not edit its title, description, comments, or status.

Agreed tasks:

1. **Page data — completed and accepted by the lead.** Preserve pressure, visibility, and the city's UTC offset; retain the three-hour forecast points and group them by local date for daily temperature ranges.
2. **Current-weather card — completed and accepted by the lead.** Build from the supplied screenshots: city, temperature, conditions, feels-like value, weather icon, and gradient background.
3. **Forecast timeline — completed and accepted by the lead.** Add within that card, with horizontal scrolling on small screens.
4. **Weather details — completed and accepted by the lead.** Add metric cards and sunrise/sunset using the appropriate units and city-local times.
5. **Daily forecast — completed; spacing correction delivered for lead review.** Add the daily forecast with conditions, icons, and temperature ranges.
6. Review the complete responsive page, spacing, loading, and recovery states with the lead.

Use the existing OpenWeather access: five-day forecasts at three-hour intervals. One Call access returned HTTP 401 and requires a separate subscription; do not promise hourly or seven-day data. Reuse existing global styles, fonts, search, and CSS Modules. Adapt each block as it is built.

This project targets one release. Keep functions and components readable and relatively small, avoid speculative abstractions and new infrastructure, and add tests only for meaningful changed logic or confirmed regressions. Preserve incremental, subject-only commits with Codex as author and committer. README remains reserved for joint work with the lead at the end.

### Task 1 delivery

Three checked increments were committed and pushed during implementation:

- `944d3f1`: current weather preserves pressure in hPa, visibility in metres, and the signed UTC offset in seconds. Missing values stay null; malformed present values fail existing payload validation. Relevant parser/service/component tests (96), lint, and explicit typechecking passed before this commit.
- `73da7bf`: the forecast parser retains every point in provider order and returns explicit UTC ISO dates, for example `2026-11-04T18:00:00Z`. Parser/service tests (93), ESLint, and explicit typechecking passed before this commit. Both changed cache namespaces are v2, preventing old cached objects and noon-only arrays from being reused.
- `a3dee79`: `groupForecastByDay` groups validated points by local calendar date, returns sorted daily temperature ranges, and selects conditions from the point closest to local noon. Equal-distance ties use the earlier point. Seven focused tests passed in both the default process timezone and `Pacific/Honolulu`, along with ESLint and typechecking, before this commit.

Grouping preserves partial first/last days and all available dates; 40 three-hour points can span six local dates. It does not pad days or decide the eventual UI row count. Missing timezone metadata yields no daily summaries while leaving the original points available. The provider's fixed UTC offset is used; it does not supply the IANA timezone rules needed to infer offset changes during future daylight-saving transitions.

Final local verification: formatting, lint, explicit TypeScript checking, all **307 Vitest tests in 19 files**, and the production build passed. An additional live check ran the actual request helper, parsers, and grouping function through the existing Vite loader against OpenWeather: Moscow returned valid new metrics, all 40 forecast points with UTC timestamps, and six local dates including partial days. Credentials and raw request URLs were not logged. Existing CI checks run on the pushed commits; no new browser tests, dependencies, UI, or README changes were added. Stop here for lead review before task 2, and leave PR management to the lead.

CI follow-up: run `41875199394` reproduced the known hidden-streaming-duplicate selector failure in the mobile cache-reuse test (73 other checks passed). The remaining weather-text assertions in geolocation, navigation, and recovery now scope to the accessible main content, matching the lead's earlier fix. The cache scenario passed ten repeated desktop/mobile checks after the change; the isolated production build, affected ESLint checks, and typechecking also passed. This is a separate `fix(e2e)` increment, with no added browser scenarios or application changes.

### Task 2 progress

Use the supplied screenshots as the visual reference for the upper current-weather card. The search stays above it; the timeline remains task 3. New color tokens belong in `main.global.css`, as explicitly requested by the lead. The first increment adds the blue/navy/purple palette and eight weather masks plus a location pin using the existing SVG-mask mechanism. The eight weather states were visually inspected in Chromium; formatting and whitespace checks passed before committing. No icon dependency was added.

The card now renders the selected database city's name/country/region, current temperature, description, feels-like value, and decorative weather icon. It is a plain server-rendered component with CSS Modules. The global palette is reused; mobile outer padding is reduced at 600 px, and the temperature block spans the card below its heading/icon. The selected-city label is independent of provider station metadata. Existing identity checks now assert the full selected city/country/region heading; temperature visibility checks remain unchanged. The server-render test accounts for the smaller unit span and includes a regression for mismatched provider location names.

Before committing the card increment, all four server-component tests, 34 existing navigation/geolocation browser checks, lint, typechecking, and the isolated production build passed. Desktop (1280 px), phone (390 px), and narrow-phone (320 px) screenshots were inspected, including the longest database city name. All fit horizontally with no browser page errors. Timeline, metrics, and daily cards remain separate tasks.

Task 2 final checks: formatting, lint, explicit TypeScript checking, **308 Vitest tests in 19 files**, the normal build, the isolated build, and all **74 existing browser checks** passed locally. The additional unit test covers selected-location identity; no browser scenarios or dependencies were added. A separate normal production process used the real OpenWeather binding and passed desktop/mobile rendering with zero page errors. Visual checks also covered a negative three-digit temperature and the home/404 pages at 320 px after the shared padding change. Live screenshots are outside the repository at `/workspace/artifacts/weather-card-desktop.png` and `/workspace/artifacts/weather-card-mobile.png`.

The palette/icon increment (`b0571e3`) and the checked card increment (`ef6290f`) were committed and pushed during development. The card was delivered for lead review before separately authorized timeline work. PR management remains exclusively with the lead.

### Task 3 progress

Pulled the lead's backdrop-filter fix `5d2a92a` before starting. The supplied reference is the current card with a separator and eight forecast positions. The timeline component shows Now plus the next seven future points in time order, formats city-local 24-hour times with the provider offset, and exposes each point's local date in a native time tooltip. Empty forecasts have a plain-text fallback. The list is horizontally scrollable and keyboard focusable. Its render receives a timestamp explicitly and does not read a clock itself. Four meaningful selection/time/empty-state tests passed in the default timezone and Pacific/Honolulu, along with affected ESLint checks and typechecking, before committing the first increment. Server loading and independent error recovery follow separately.

The private browser provider now supports `/forecast` with 40 future three-hour points and city offsets, plus forecast-only delays, HTTP failures, stalls, and unexpected failures. Existing endpoint validation still rejects unrelated provider calls. A temporary contract check passed both mock responses through the actual parsers and confirmed current weather stays HTTP 200 while forecast-only failure returns 503. ESLint, typechecking, and formatting passed before this separate fixture increment.

The current card now contains a separately streamed forecast section. A server loader captures forecast points and a timestamp together; Suspense keeps current weather/search visible during loading, known failures reuse the existing retry policy with a forecast-specific message, and a nested instance of the existing boundary contains unexpected forecast exceptions. Missing timezone metadata skips the forecast request and shows plain text. Before committing the integration, 17 focused unit/component checks, 34 production browser checks (including three new forecast scenarios per device), lint, typechecking, and the isolated build passed. Cache checks now wait for the forecast section, and simultaneous-cold-request checks require exactly one call to each endpoint rather than the previous weather-only count.

Visual review found an 86 px card-height jump when the forecast finished. Reserving the row's height removes the jump; desktop and phone measurements now match before/after loading. Both production builds were repeated after this CSS change. Manual checks also confirmed no horizontal page overflow at 1280/390/320 px, native timeline scrolling, the lead's restored search blur, and an actual ten-second forecast-header timeout that aborts while preserving current weather. Final full Vitest validation passed 317 checks in 21 files; the complete browser suite follows.

Task 3 final verification: formatting, lint, explicit typechecking, **317 Vitest tests in 21 files**, both production builds, and **80 production browser checks** passed locally. The browser total adds only three forecast scenarios on each device: independent streaming/search/mobile scrolling, known-error retry with preserved current weather/input, and unexpected-error containment/recovery without a document reload. Existing weather scenarios and assertions remain, with endpoint/cache expectations updated for the newly requested forecast.

A normal production process also rendered real OpenWeather data on desktop and mobile with zero page errors. The browser timezone was deliberately Los Angeles; all seven future times and dates still matched Moscow's UTC+3 offset. Screenshots are at `/workspace/artifacts/forecast-timeline-desktop.png` and `/workspace/artifacts/forecast-timeline-mobile.png`, outside the repository. The timeline, fixture support, server integration, and layout correction were each committed and pushed as checked increments (`45dba8a`, `0a4e9da`, `a2b8cbf`, `aeba11f`). No dependencies or README changes were added; stop here before task 4 and leave the PR untouched.

### Task 4 progress

The lead authorized the metric and solar cards: four metric columns on desktop, two on mobile, paired solar cards on desktop and stacked on mobile. The global palette and six CSS masks were committed and pushed first in `f7054ac`, after formatting and whitespace checks.

A server-rendered WeatherDetails component reuses the already-fetched current weather. Wind is rounded to km/h; visibility is converted from metres to kilometres with one decimal when needed. Pressure stays in hPa and humidity in percent. Solar times use the city offset, with UTC datetimes and local-date tooltips; unavailable measurements, events, or timezone metadata show an em dash. No new request or dependency is introduced. Three focused component tests cover conversions, fractional offsets across midnight, zero values, and missing data; they also passed under Pacific/Honolulu.

The growing page now uses a minimum body height rather than a fixed viewport height. Home/404 containers retain viewport centering. Desktop, 390 px, and 320 px screenshots were inspected; home and 404 checks at 320 px confirmed centering and no horizontal overflow. The private browser provider now supplies pressure and visibility, without adding browser scenarios. Focused component/server checks, lint, typechecking, and the isolated production build passed before committing this increment. Full verification follows.

Task 4 final checks: formatting, lint, explicit TypeScript checking, **320 Vitest tests in 22 files**, the normal production build, the isolated production build, and all **80 existing production browser checks** passed locally. Three component tests were added; browser scenarios and their assertions were preserved. The implementation was committed and pushed as `c07163e` after focused checks, before this full validation.

A normal production server using real OpenWeather data rendered all six detail cards on desktop and mobile without page errors or horizontal overflow. With the browser timezone set to Los Angeles, both solar labels matched their UTC datetimes shifted to Moscow's UTC+3. Home and 404 layouts were checked again at 320 px after their entrance animations finished. Live screenshots are outside the repository at `/workspace/artifacts/weather-details-desktop.png` and `/workspace/artifacts/weather-details-mobile.png`. No dependencies or README changes were added. Stop before task 5 for lead review; the PR remains exclusively managed by the lead.

### Task 5 progress

Pulled `feat/weather-page` before starting; it was already current at `604b834`. The lead authorized the daily forecast only and retains exclusive PR management. The Daily Forecast block follows the supplied reference, with all actual forecast dates, representative conditions/icons, and minimum/maximum temperature bars on a shared scale. It does not pad results to seven days or promise a fixed row count. The current provider supplies three-hour forecast points across five days, which can cover six local dates including partial days.

The pure component and CSS were checked and pushed first in `ba17130`. Three component tests cover city-local Today/weekday labels, date tooltips, conditions, negative ranges, relative scale positions, equal temperatures, and empty results. They passed under both the default timezone and Pacific/Honolulu. On mobile, each row puts the temperature range below its date/icon/description. Existing global color tokens and mask icons are reused.

`6378007` connects the block below the solar cards. Both forecast blocks use a small React-cached server reader, preserving the same forecast and observation timestamp within a render. The daily loader reuses the existing grouping helper, excludes dates before city-local today, skips loading when timezone metadata is missing, and preserves existing recovery policy. Its own Suspense and error boundary keep current weather, metrics, and search usable. Five focused server checks, all existing affected component checks, lint, typechecking, and the isolated production build passed before pushing this increment.

The existing forecast browser scenarios now also check the daily block's streaming, sorted distinct dates, known-error retry, and unexpected-error containment/recovery. Eight targeted desktop/mobile browser checks passed, including the existing assertion that simultaneous cold page requests make exactly one provider request per endpoint. No browser scenarios or dependencies were added. Desktop, 390 px, and 320 px screenshots of the test-provider page were inspected without horizontal overflow.

Task 5 final validation: formatting, lint, explicit TypeScript checking, **328 Vitest tests in 24 files**, both production builds, and all **80 production browser checks** passed locally. The eight additional unit/component checks exercise the new daily UI and loader. Existing browser tests retain their original assertions and also cover the daily block; no scenarios were removed.

A normal production server using the real provider rendered five available dates at 1280, 390, and 320 px. Visual inspection and browser assertions confirmed city-local Today/weekday labels with a Los Angeles browser timezone, temperature segments fitting their tracks, no horizontal page overflow, and no page errors. Full-page screenshots are outside the repository at `/workspace/artifacts/daily-forecast-desktop.png`, `/workspace/artifacts/daily-forecast-mobile.png`, and `/workspace/artifacts/daily-forecast-small.png`. No new dependencies, global color tokens, or README changes were needed. Both feature increments were checked and pushed during implementation. Stop here before task 6 for lead review; the PR was not modified.

Task 5 spacing correction requested by the lead: maximum-temperature labels were right-aligned inside their fixed-width columns, adding unused column width to the gap after each track. Maximum labels now align left, while minimum labels stay right-aligned. The shared grid gaps remain 16 px on desktop and 10 px on mobile. No forecast logic or tests were changed.

Spacing correction validation: formatting, lint, typechecking, all 328 unit tests, and both production builds passed. Direct browser text-bound measurements across all six rendered rows confirmed equal 16 px gaps at 1280 px and equal 10 px gaps at 390/320 px, without page overflow. No new tests were added for this CSS alignment fix; the complete browser suite was not repeated. Screenshots are outside the repository at `/workspace/artifacts/daily-spacing-desktop.png`, `/workspace/artifacts/daily-spacing-mobile.png`, and `/workspace/artifacts/daily-spacing-small.png`.

### Search feedback UI

The lead approved a separate search UI task before the final page review: put loading, empty results, errors, and the defensive query-length message into the existing dropdown surface; add a retry button without changing the query; preserve keyboard interaction, focus, and accessibility announcements. No README or PR changes are authorized.

`d56c387` adds an explicit retry attempt to the existing debounced/cancellable search effect. Refocusing within the active widget does not reset it. Its new hook test confirms the same normalized query is retried and the typed text is preserved; 26 affected checks, lint, and typechecking passed before the increment was pushed.

Feedback now sits inside the positioned search wrapper and reuses the dropdown surface, blur, global palette, and existing masks. Loading uses the existing spinner; empty results add a short city/country hint; errors have a concise message and a keyboard-accessible retry action. Only actual suggestions form the listbox. The wrapper closes only when focus leaves the whole widget; retry restores input focus, and Escape also releases focus from the retry button. Two additional component checks cover that focus behavior.

All 32 affected search/navigation/layout production browser checks passed, including keyboard retry, mobile touch retry, unchanged query, empty-state dismissal, and existing late-response protection. The browser scenarios were extended rather than replaced. Manual production-browser checks on both home and city pages at 1280/390/320 px confirmed every feedback state, fixed input/weather positions, no horizontal overflow or page errors, and closure when tabbing away from retry. Screenshots are outside the repository at `/workspace/artifacts/search-{loading,empty,error}-{desktop,mobile}.png`, with `-home` variants for the homepage.

Formatting, lint, typechecking, all **331 Vitest tests in 24 files**, and both production builds passed locally. The full browser suite follows after this checked UI increment. No dependencies, new global colors, explanatory source comments, or README changes were added.

Search feedback final verification: the remaining 48 forecast/geolocation/recovery browser checks passed, completing all **80 browser checks across two complementary runs (32 + 48)**. The isolated production build was refreshed before the second run and manual visual review after removing a redundant JSX fragment; rendered DOM and behavior were unchanged. Three meaningful tests were added in total: same-query retry, input/button focus on retry, and Escape from the retry button. The existing error/empty assertions were updated for the agreed text, preserving malformed-response, timeout, cancellation, and keyboard checks. All local validation is complete; stop here for lead review before task 6. The PR remains untouched.

### Weather loading UI

The lead authorized replacing the city-page loading text with soft blurred data placeholders, preserving the existing page layout and avoiding large jumps. Remain on `feat/weather-page`, keep incremental subject-only commits, and leave PR management and README changes to the lead.

`2891e44` adds a small server-rendered SkeletonValue and loading variants inside the existing WeatherCard and WeatherDetails markup. Known city labels, metric labels, and units remain visible; absent weather selects placeholders, while validated missing values still render em dashes. The shared CSS uses a global skeleton color, blur, synchronized opacity pulses, and a reduced-motion override. Existing weather/detail checks, lint, and typechecking passed before pushing the increment.

The previously unused WeatherSkeleton now composes those same cards and existing forecast row styles. It replaces the outer weather fallback; independent timeline and daily placeholders replace the two nested text fallbacks. Decorative contents are hidden from accessibility navigation while an explicit status announces loading. The implementation adds no client directive, synthetic weather data, provider requests, or dependencies.

A new browser scenario on each device measures initial, current-weather-only, and complete states and checks reduced-motion behavior. It waits for actual rendered geometry before taking the initial measurements, since streamed nodes can exist before their styles are painted. All eight forecast browser checks passed, preserving independent loading, search interaction, error retry, and unexpected-error recovery. Manual checks at 1280/390/320 px measured identical hero heights across all three stages and zero movement or resizing of metric/solar cards. No horizontal overflow or page errors were observed. Initial and forecast-only screenshots are outside the repository at `/workspace/artifacts/weather-loading-{desktop,mobile,small}.png` and `/workspace/artifacts/forecast-loading-{desktop,mobile,small}.png`.

The daily placeholder reserves five rows. A sixth actual local date can extend the bottom card by one row; it does not move the upper blocks. Longer condition descriptions and different available day counts can still affect the final bottom card height. Error-state redesign remains separate. Full project checks and the remaining browser suites follow this checked integration increment.

Weather loading final verification: formatting, lint, explicit typechecking, all **331 Vitest checks in 24 files**, both production builds, and all **82 browser checks across complementary runs (8 forecast + 74 remaining)** passed locally. The new two device checks cover layout stability and reduced motion; existing error, navigation, search, cancellation, and request-count assertions remain. A separate normal production process using real OpenWeather data also rendered desktop/mobile with no page errors or horizontal overflow. Its hero heights exactly matched the loading measurements: 441.796875 px at 1280 px and 434.1875 px at 390 px. Ready-state screenshots are at `/workspace/artifacts/weather-ready-desktop.png` and `/workspace/artifacts/weather-ready-mobile.png`. Both implementation increments were checked and pushed during development. Stop for lead review; the PR and README remain untouched.

### Weather data reveal

The lead approved softening the transition from placeholders to real data with blur. A shared 320 ms CSS animation changes only opacity and filter on current conditions, the weather icon, metric/solar values, and both forecast lists. Card surfaces, labels, dimensions, and grid positions remain stable. Reduced-motion mode disables the reveal and immediately shows clear, fully opaque values. No client component, dependency, request, or synthetic delay was added.

Manual Chromium checks on desktop/mobile observed the actual animationstart/animationend events and computed styles, including both separately streamed forecast lists: each started visibly blurred/translucent and ended fully clear/opaque. Ten data areas revealed per page. Short recordings are outside the repository at `/workspace/artifacts/weather-reveal-desktop.webm` and `/workspace/artifacts/weather-reveal-mobile.webm`. All eight forecast browser checks passed, with the existing layout/reduced-motion test extended to check the loaded forecast animation is disabled. Formatting, lint, typechecking, and the isolated build passed before committing this increment. Remaining project checks follow.

Reveal final validation: formatting, lint, explicit typechecking, all **331 Vitest checks**, both production builds, and **40 affected browser checks (8 forecast + 32 navigation/search/layout)** passed. The existing test was extended; no new scenarios or test infrastructure were added for this CSS-only enhancement. The full 82-case browser suite was not repeated locally for this change; CI runs it on the branch. Implementation was pushed as `e7de17d` before the remaining checks finished. PR and README were not modified; stop for lead review.
