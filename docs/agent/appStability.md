# App stability working notes

Work stays on `feat/app-stability` and Draft PR #6. The lead explicitly authorized implementation after the scope-only preparation commit. README changes are reserved for later work with the lead. New states use text and existing styles.

## Development checkpoints

- `8642cef`: known weather service failures map to safe messages and an explicit retry policy. Refreshing weather preserves the surrounding page and search component. Configuration/invalid-location failures offer search rather than an ineffective retry.
- `1b46a3e`: unexpected weather errors have a local client boundary. New server children reset that boundary after refresh. The route-level fallback and 404 page also provide search and recovery navigation.
- Browser regression work exposed a Tab-navigation defect: popup links could receive focus just as blur made the popup inert, leaving focus on the document body. Popup links now leave sequential tab navigation to the combobox and page controls, while arrows/Enter and mouse selection remain available.

Each checked increment is committed and pushed before beginning the next one. Later discoveries receive follow-up fixes rather than rewriting completed work.

## Persistent browser tests

Playwright 1.64.1 runs against an isolated production build in `.next-e2e/`, using `tsconfig.e2e.json`. Normal development and production still use `.next/` and `tsconfig.json`. The test build disables the in-process data-cache memory layer so each test can reset its isolated filesystem cache reliably.

The provider adapter is loaded only by Playwright's private server command. It requires `E2E_TEST_MODE=1`, installs a synthetic credential in that process, intercepts OpenWeather calls before network access, and exposes its control interface only on loopback port 3101. It is not imported by application code and adds no application route or production endpoint. The app test server uses port 3100 and refuses to reuse an existing server.

The provider supports controlled successes, HTTP failures, invalid data, network failures, stalled headers/body, and a deliberate unexpected failure. Tests observe only endpoint paths, coordinates, modes, abort state, and completion state. No real provider credential is needed. Tests are serialized so control state and cache reset do not race across workers; each test gets a fresh browser context.

Commands:

```sh
npm ci
npx playwright install chromium
npm run build:e2e
npm run test:e2e
```

On a fresh Linux CI runner, install browser system dependencies with `npx playwright install --with-deps chromium`. A local preinstalled Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed. HTML reports and failed-test traces/screenshots go into ignored `playwright-report/` and `test-results/` directories.

The recovery suite passes 28 production browser checks across desktop and mobile Chromium. It covers preserved search text and Tab access during retry, real 404 recovery, network/invalid-data/rate-limit failures, actual 10-second header/body timeouts and aborts, configuration privacy, unexpected server exceptions contained by the local boundary, repeated failures, validated-cache reuse, and sharing concurrent cold requests. Document markers verify retries do not reload the page.

Connected navigation adds 20 desktop/mobile checks: distinct same-name selections, keyboard and pointer/touch navigation, secure cookie migration, invalid preferences, canonical redirects, slow-request navigation, and browser Back/Forward with matching remembered IDs. All passed.

Geolocation adds 14 desktop/mobile checks: exact coordinate identity for both Suzhou records, denied/unsupported browsers, no nearby settlement, the real five-second browser watchdog, and the ten-second action deadline. Manual city navigation completes while the old location action remains blocked; releasing its response cannot replace the chosen city. All passed.

CI now keeps the existing Project checks job and adds Browser checks on a separate runner. The browser job installs Chromium with Linux dependencies, builds the isolated application, runs both device projects without real secrets, and uploads the HTML report and failure details for seven days, including failed runs. GitHub branch protection can require the new Browser checks status after the lead reviews it.

Final-review regression: the Skopje result with the long legacy Macedonia country name overflowed its link on mobile Chromium. The new browser assertion failed before the change and passed afterward. Result labels now wrap within their flex columns; colors, spacing, and controls stay unchanged. Both that country name and the longest database city name pass desktop/mobile layout checks.

Search recovery adds eight passing desktop/mobile checks for HTTP failure with refocus retry, rejected external/malformed result links, the actual ten-second request deadline with a released stale response, empty results, and Escape. These use the production search component and API with controlled browser transport failures.

## Final application review

Reviewed city indexes and canonical routes, API ranking and DTO validation, browser search state and request cancellation, geolocation deadlines and cookie restoration/persistence, weather transport and payload validation, cache/in-flight behavior, error boundaries, accessible recovery controls, build separation, lockfile changes, and CI execution. Follow-up fixes have their own checked commits; existing design and README content are preserved.

Final local verification on Node 24.19.0 and bundled Chromium 156.0.8078.4:

- Formatting, ESLint, explicit TypeScript checking, normal production build, and isolated browser-test build passed.
- Vitest: **285 tests in 18 files passed** in 105.31 seconds, including exhaustive URL round trips over all 177,738 city records. Test execution took 3.64 seconds; importing the large JSON remains the main startup cost.
- Playwright: **74 checks passed** in 2.8 minutes, comprising 37 scenarios on each of desktop Chromium and mobile Chromium. No browser page errors were recorded. Expected synthetic server failures appear in test logs and are intentional.
- A separate normal production process, without the adapter, rendered Moscow weather through the real configured OpenWeather binding with HTTP 200, a remembered ID cookie, no browser page errors, and no horizontal overflow at 393 px. It used the inherited cloud proxy and verified TLS settings.
- Desktop/mobile screenshots of long search results and the 404 recovery page were inspected, along with the live mobile weather page. Temporary inspection artifacts remain outside the repository under `/tmp/weather-*.png`.
- Both builds contain ten client JavaScript chunks. Provider-host, synthetic-credential, private-provider-response, and selected database-record markers are absent from those chunks. The normal server output does not contain the browser adapter. Server-only import boundaries remain enforced by the successful builds.
- Git author and committer metadata, subject-only commit messages, branch identity, unchanged README, and whitespace were checked. All work stays on `feat/app-stability`; the lead's PR #6 remains a draft.
- GitHub Actions confirmed both Project checks and Browser checks passed for code checkpoint `c0cf00e` in [run 39663902058](https://github.com/quarnel-dev/weather-app/actions/runs/39663902058). Browser installation, the isolated build, all 74 checks, and report upload succeeded on the clean runner. The final documentation commit triggers the same jobs again.

## Limits and remaining decisions

- Browser coverage is Chromium desktop plus mobile emulation, not real mobile hardware or Firefox/WebKit. Geolocation uses browser-supplied coordinates, not hardware GPS. Native bfcache restoration remains outside the verified browser scope; lifecycle handling has its existing simulated Vitest coverage.
- Expected weather failures and an actual unexpected weather server exception are covered in production browsers. The outer route-error component's reset wiring is covered by component tests; no production-only route was added to force unrelated page crashes.
- Persistent CI tests use controlled provider responses. The separate live smoke check confirms the current binding works, but does not cover every provider schema, account plan, or weather condition. The existing 600-second stale-while-revalidate policy is unchanged; tests verify fresh hits and rejected failures without waiting ten minutes for expiry.
- `npm audit --omit=dev` reports **zero vulnerabilities**. The full audit retains the pre-existing `braces` stack-exhaustion advisory GHSA-vfj7-8cjw-p6xm through the ESLint/fast-glob/micromatch development chain (five affected package entries). The registry's latest braces release is 3.0.3; audit suggests downgrading eslint-config-next to 14.2.35 rather than a compatible patched fix. No forced downgrade or unrelated dependency rewrite was applied.
- The lead can require the new Browser checks status in branch protection after review. README writing, new visual design, PR readiness, and merging remain with the lead.
