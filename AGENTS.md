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
- Use the repository's Git identity for commits: `quarnel-dev <quarnel.dev@gmail.com>`. Verify the local Git configuration before committing.

## Validation

- Run relevant tests when changing logic; project commands are `npm test`, `npm run lint`, and `npm run build`.
- Verify affected user flows. Distinguish automated tests, HTTP checks, and visual browser checks; do not present one as another.
- In the Codex cloud environment, use `NODE_USE_ENV_PROXY=1` and the supplied TLS settings for Node.js requests to external APIs. Do not disable certificate verification. This setting may not be needed on the user's local machine.
