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

The provider supports controlled successes, HTTP failures, invalid data, network failures, stalled headers/body, and a deliberate unexpected failure. Tests observe only endpoint paths, coordinates, modes, and abort state. No real provider credential is needed. Tests are serialized so control state and cache reset do not race across workers; each test gets a fresh browser context.

Commands:

```sh
npm ci
npx playwright install chromium
npm run build:e2e
npm run test:e2e
```

On a fresh Linux CI runner, install browser system dependencies with `npx playwright install --with-deps chromium`. A local preinstalled Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed. HTML reports and failed-test traces/screenshots go into ignored `playwright-report/` and `test-results/` directories.

The recovery suite passes 28 production browser checks across desktop and mobile Chromium. It covers preserved search text and Tab access during retry, real 404 recovery, network/invalid-data/rate-limit failures, actual 10-second header/body timeouts and aborts, configuration privacy, unexpected server exceptions contained by the local boundary, repeated failures, validated-cache reuse, and sharing concurrent cold requests. Document markers verify retries do not reload the page. Connected user flows, CI wiring, and the final application audit follow in separate increments.

Connected navigation adds 20 desktop/mobile checks: distinct same-name selections, keyboard and pointer/touch navigation, secure cookie migration, invalid preferences, canonical redirects, slow-request navigation, and browser Back/Forward with matching remembered IDs. All passed.

Geolocation adds 14 desktop/mobile checks: exact coordinate identity for both Suzhou records, denied/unsupported browsers, no nearby settlement, the real five-second browser watchdog, and the ten-second action deadline. Manual city navigation completes while the old location action remains blocked; releasing its response cannot replace the chosen city. All passed.

CI now keeps the existing Project checks job and adds Browser checks on a separate runner. The browser job installs Chromium with Linux dependencies, builds the isolated application, runs both device projects without real secrets, and uploads the HTML report and failure details for seven days, including failed runs. GitHub branch protection can require the new Browser checks status after the lead reviews it.
