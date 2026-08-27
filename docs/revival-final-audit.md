# BookPulse revival audit

**Audit date:** 2026-08-27  
**Overall status:** All credential-independent product phases are implemented locally. Database migration/application, genuine production ingestion, provider authorization, deployment verification, screenshot capture, lint, and build remain externally blocked and are not claimed complete.

## Implemented and verified locally

- Non-destructive duplicate-observation migration preflight and RLS/grant boundaries.
- Frozen observation, trending, history, and source-health contracts with fixtures.
- OAuth Reddit adapter for bounded `r/PHBookClub/new` collection, explicit `discussion_count` semantics, stable IDs, provider timestamps, pagination, retries, timeout propagation, and production/demo isolation.
- Bounded persisted book-history endpoint with sparse series, deterministic snapshot movement, first-seen and peak calculations, and a supporting history index.
- Persisted-run-derived public source health with sanitized failures.
- Official-provider feasibility record: Goodreads is not currently viable; TikTok requires provider approval or an approved compliant supplier.
- A public methodology component that explains source scope, signal meaning, deterministic processing, missing data, confidence, outage behavior, and explicit demo mode.
- An implementation-specific portfolio README with architecture and data-flow diagrams, source availability, operational setup, security boundaries, and limitations.
- Explicit observation persistence, explainable historical scoring/classification, an accessible persisted-history drawer, operational source health, and Breakout Radar.

## Migration state

Migrations are uniquely named and ordered from `202604050001` through `202608270004`. Four revival migrations are pending because this environment has no linked Supabase project. The duplicate preflight makes no changes and deliberately aborts before the identity index if conflicts exist. No historical rows were deleted. Migration `202608270004` stores explicit signal/provider semantics and a stable observation replay key.

## Source availability

| Source | State | Limitation |
| --- | --- | --- |
| Reddit | Implemented, credentials required | Production execution requires an OAuth access token and compliant user agent; external provider/deployment verification was unavailable. |
| Goodreads | Unavailable | Goodreads does not provide a supported new-key route for this use case. |
| TikTok | Not configured | Research access requires provider approval and purpose eligibility; scraping was not added. |

## Verification

- Full backend suite: 45 tests passed.
- `git diff --check`: passed during each integrated workstream.
- ESLint and the Vite production build could not run because registry access returned HTTP 403 and the environment has no complete frontend dependency installation (`@eslint/js` and `vite` are absent).
- Production deployment and ingestion: not verified. GitHub push and official provider page access were blocked by the outbound proxy (HTTP 403); Supabase/Vercel credentials and project links are absent.

## Security and integrity findings

No browser code receives service-role or provider credentials. Reddit tokens are sent only to the allowlisted OAuth hostname. Public source-health failures are generic. Production Reddit ingestion cannot use demo observations. Persisted history does not generate gap points. Missing history and provider timestamps remain missing. Partial ingestion continues to skip publication, preserving `trending:latest`.

## Deferred phases and limitations

Verified screenshots and viable additional providers were not completed. Frontend lint/build/browser gates remain unverified because the dependency tree and deployed environment are unavailable. Genuine production history was unavailable, so deterministic thresholds are conservative and no empirical calibration or statistical significance is claimed.

## Commits

- `5f6474e` — `chore: validate production trend pipeline`
- `3cd5c11` — `docs: define trend observation and api contracts`
- `cdfe3df` — `feat: expose ingestion source health`
- `16b85ea` — `docs: assess production source feasibility`
- `c135260` — `feat: ingest genuine reddit trend observations`
- `4678146` — `feat: expose persisted book trend history`
- `c9f6198` — `test: verify historical trend integration`
- `8fdebad` — `fix: persist explicit observation semantics`
- `e2eaea2` — `feat: add explainable historical trend scoring`
- `6fbcf94` — `feat: add historical intelligence experience`
- `f7ccbff` — `docs: publish methodology and platform guide`
- `9269563` — `fix: isolate server credentials and validation`

## Required operator actions

1. Install dependencies from an environment with npm registry access, then run lint and build and capture current screenshots.
2. Review duplicate identities in Supabase, obtain approval for any cleanup, and apply pending migrations.
3. Configure Reddit OAuth and Vercel server-only secrets, run controlled ingestion/replay/partial-failure checks, and verify deployed APIs.
4. Push the `work` branch from a network with GitHub access and create the pull request.
