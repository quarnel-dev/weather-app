# Project instructions

## Working documentation

Keep plans, implementation notes, and validation results in [`docs/agent/`](docs/agent/).
Before starting work, read [`docs/agent/devPlan.md`](docs/agent/devPlan.md) for agreed tasks, decisions, and current status.
Update existing documents as work progresses; create new ones only when needed. Never store API key values, tokens, or other secrets in documentation.

## Working with the user

- The user acts as lead developer: they set direction, oversee design, and accept changes.
- Stay within the agreed task. Discuss substantial design changes, API changes, and new dependencies with the user first.
- State problems and tradeoffs directly; explain when you disagree with a proposal.
- Reuse existing components and styles unless a redesign has been agreed.
- Do not create commits or push changes to GitHub without the user's instruction.
- The user creates pull requests. Do not open one unless they explicitly request it.
- Use `codex <codex@openai.com>` as both author and committer. Verify the local Git configuration before committing.
- Keep commits focused on one change. Commit messages must contain only a subject, without a body or co-author trailers.
- Commit and push each completed, checked increment during development. Do not postpone all commits until the end or reconstruct the history afterward.
- Avoid explanatory code comments. Use existing designs; show new loading, empty, or error states as plain text until their design is agreed.

## Validation

- Run relevant tests when changing logic. Final project checks are `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Browser checks use `npm run build:e2e` followed by `npm run test:e2e`. Rebuild after application changes; the runner starts the isolated production server itself. Install Chromium first with `npx playwright install chromium` (add `--with-deps` on a fresh Linux runner). See [`docs/agent/appStability.md`](docs/agent/appStability.md) for isolation, reports, and limitations.
- Verify affected user flows. Distinguish automated tests, HTTP checks, and visual browser checks; do not present one as another.
- In the Codex cloud environment, use `NODE_USE_ENV_PROXY=1` and the supplied TLS settings for Node.js requests to external APIs. Do not disable certificate verification. This setting may not be needed on the user's local machine.
