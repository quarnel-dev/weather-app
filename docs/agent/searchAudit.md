# Follow-up search audit

Date: 2026-10-20. Scope: PR #2 and its dependency, browser, and test boundaries. Tasks 3–5 were not started. The PR was temporarily converted to Draft while fixes were prepared; its title and bracketed attribution paragraph were preserved.

## Defects reproduced and fixed

| Defect | Evidence before the fix | Correction |
| --- | --- | --- |
| Selecting the current city left native input focus out of sync with hook state | Chromium retained focus but subsequent input produced no search request; the new DOM regression test failed | A shared selection handler closes the search and releases native focus, allowing the next focus/input cycle to start normally |
| Countries absent from the old name map could not be searched reliably | New API tests failed for `xk`, `Kosovo`, and `Serbia`; nine country codes in the city data were absent from `countries.json` | Missing names are supplemented with English `Intl.DisplayNames`, preserving the JSON files and their existing names |
| IME keys were interpreted as search navigation | Chromium navigated on an Enter event marked as composing; regression tests also failed | Keyboard handling ignores composition events and legacy IME key code 229 |
| A request that never completed left an endless loading state | A fake-timer test remained in `loading` after ten seconds | Requests time out after ten seconds, abort, and show the existing plain-text error state; late responses and aborted timeouts cannot replace newer results |
| Suggestions remained interactive while their exit animation ran | A real mouse click on an outgoing item navigated to its stale city after the input changed | The animated result component uses presence state to become inert and hidden from accessibility navigation, and rejects outgoing clicks while preserving the existing animation |

Each correction has focused Vitest coverage. Additional tests compare search ranking against an independent full scan and cover delayed response bodies, stale timeout callbacks, and recovery after failures.

## Verification

- A clean `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` succeeded with the final lockfile.
- `npm test`: **55 passed**, zero failed/skipped, across five files. The original complete URL/ID round-trip check for all 177,738 city records is retained.
- `npm run lint` passed.
- `npm run build` passed with TypeScript, using Next.js 16.4.2. The existing middleware naming deprecation is still reported; migration is outside this task.
- All city records were checked for positive integer IDs, nonempty names, valid country codes, finite/nonnegative populations, and coordinates within geographic bounds. No invalid records were found for these fields.
- The generated client JavaScript has no database marker strings (Shenzhen, Kinshasa, Guangzhou). The build contains 12 client JS files totalling 707,290 bytes, with a largest file of 229,818 bytes and 220,784 bytes summed after individual gzip compression. These are artifact sizes, not browser transfer measurements.
- New commits use `codex <codex@openai.com>` for author and committer, with subject-only messages and no co-author trailers. No source credentials were added.

## Real-browser checks

Twelve scenarios passed against the production build in Chromium 154.0.8037.57, controlled with a temporary Playwright Core installation outside the checkout. This browser harness is an audit tool, not part of `npm test` and not a new project dependency.

1. Real search API results and keyboard selection of an unambiguous city URL.
2. Selecting the already-open city and successfully starting a second search.
3. Selecting with the mouse and verifying native focus is released.
4. Preserving Enter/Escape/arrow events marked as IME composition. Native composition flags were simulated; a hardware IME was not tested.
5. Sending no request for a one-character query and debouncing rapid typing to one request.
6. Ignoring a late response from an aborted query after fresh results arrive.
7. Preventing navigation through outgoing animated suggestions.
8. Showing HTTP/malformed-response errors and recovering by refocusing.
9. Timing out a genuinely stalled browser request after ten seconds and successfully retrying.
10. Real API checks for short/unknown queries, missing-country metadata, and overlong input.
11. A 375-pixel mobile viewport with touch-enabled selection and no horizontal page overflow.
12. Showing the homepage search after geolocation permission is denied.

There were **zero browser page errors**. Network failure cases were intentionally injected; ordinary API results and navigation used the running application. A mobile screenshot was inspected. Existing visual design was preserved; the lead's design review remains outstanding.

## Dependency audit

The original PR dependency tree reported one critical, two high, and one moderate runtime findings. The `main` baseline was also affected. These were existing dependency advisories, not evidence that the application had been exploited.

Next.js and its matching ESLint config were upgraded from 16.2.6 to 16.4.2. Compatible transitive security updates were applied without forcing versions, downgrading the framework, or disabling integrity/TLS checks. Clean installation, tests, TypeScript, lint, production build, and browser checks were rerun.

- `npm audit --omit=dev`: **zero reported vulnerabilities** at audit time.
- Full `npm audit`: **five high-severity entries remain**, all arising from the development-only chain `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces@3.0.3`.
- The underlying advisory is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), stack exhaustion from deeply nested glob patterns. The advisory lists no patched version, and the registry's latest braces version was 3.0.3. These entries are not five independent runtime flaws. Linting malicious repository patterns remains a tooling risk.
- npm's suggested major downgrade of the Next ESLint config was not applied. The remaining tooling advisory is disclosed rather than hidden with an override or a disabled check.

## Handoff

Review the focused follow-up commits and the visible plain-text states before merging. Geolocation/cookie migration remains task 3, and weather-service/page error handling remains tasks 4–5. The browser permission-denial smoke check does not claim those later tasks are implemented.
