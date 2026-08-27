# BookPulse revival execution log

Operational record for the revival program. UTC is used unless noted.

## Phase 2 — Production Pipeline Validation

- **Status:** partially completed (local gate completed; deployed validation blocked)
- **Audit findings:** Migration filenames are unique and ordered. The original retry-safe index could fail on existing duplicate observation identities, so a non-destructive preflight now reports the duplicate row and identity counts before index creation. The deterministic retention proposal, if duplicates are reported, is to retain the lowest `source_mentions.id` for each `(canonical_key, source, captured_at)` identity and discard only later identical-identity rows after explicit approval. Cleanup would remove redundant run associations, so no cleanup was performed. RLS is enabled on all application tables; only `ingest_runs` and `read_models` receive public read policies, while writes remain behind the server-side service role.
- **Files changed:** `supabase/migrations/202608270000_observation_identity_preflight.sql`, `supabase/migrations/202608270002_public_read_boundaries.sql`, this log.
- **Migrations added or applied:** Two migrations added. Not applied: no Supabase project credentials or CLI project link are available in this environment.
- **Tests run:** `npm run test:backend`, `npm run lint`, and `npm run build`.
- **Deployment checks:** Local contracts and static secret-boundary review completed. Controlled production ingestion, duplicate query results, deployed endpoints, and applied migration state are blocked on Supabase/Vercel access.
- **Commit:** `chore: validate production trend pipeline` (hash recorded at the next checkpoint).
- **Pushed branch:** `work` (push result recorded after commit).
- **Deferred work:** Run the duplicate audit query in the target database, apply migrations with the established Supabase workflow, invoke the protected cron once, then inspect `ingest_runs`, `source_mentions`, `books`, `read_models`, `/api/trending`, and `/api/health`.
- **Blockers:** Supabase database credentials/project link and Vercel deployment access are unavailable. No secret values are recorded here.

### Non-secret deployment procedure

1. Link the intended project with `npx supabase link --project-ref <project-ref>`.
2. Before pushing migrations, run the duplicate-group query from the preflight migration in the Supabase SQL editor. If it returns rows, stop and review; do not delete data without approval.
3. Apply in filename order with `npx supabase db push`.
4. Configure server-only variables from `.env.example` in Vercel. Never prefix service-role or provider credentials with `VITE_`.
5. Invoke `POST /api/cron/ingest` with `Authorization: Bearer <cron-secret>`.
6. Verify the finalized run and persisted snapshot in Supabase, replay the controlled provider fixture, and confirm the observation count is unchanged.
7. Exercise one provider failure and confirm `trending:latest` retains its previous `updated_at` and payload.

## Contract Gate — Observation and API Semantics

- **Status:** completed locally
- **Audit findings:** Frozen `observation.v1` distinguishes interval mentions, discussions, reviews, engagement, and rank rather than treating them as equivalent. Trending, history, and source-health response semantics now define missing-data, freshness, error, and demo behavior.
- **Files changed:** `docs/contracts.md`, `backend/tests/fixtures/contracts.v1.json`, `backend/tests/contractsFixture.test.js`, this log.
- **Migrations added or applied:** None.
- **Tests run:** Contract fixture tests; the complete suite remains subject to the dependency-install environment limitation recorded in Phase 2.
- **Deployment checks:** Documentation and fixture validation only; no deployed environment is accessible.
- **Commit:** `docs: define trend observation and api contracts` (hash recorded at the next checkpoint).
- **Pushed branch:** `work` (remote availability recorded after commit).
- **Deferred work:** Version the contract if provider-authorized semantics require a breaking change.
- **Blockers:** None for the local contract gate.

## Subsequent workstreams and integration checkpoint

- **Status:** partially completed
- **Completed commits:** source health `cdfe3df`; feasibility `16b85ea`; Reddit `c135260`; persisted history `4678146`; integration fixes `c9f6198`.
- **Audit findings:** Reddit now uses explicit cumulative discussion semantics and cannot silently use demo data in production. History is bounded and sparse. Goodreads and TikTok remain honestly unavailable without authorization. Source health contains no provider diagnostics.
- **Migrations added or applied:** `202608270003_history_access_path.sql` added; none applied.
- **Tests run:** `node --test backend/tests/contractsFixture.test.js` (2 passed), `node --test backend/tests/sourceHealth.test.js` (2 passed), and `node --test backend/tests/historyRepository.test.js` (8 passed). Full tests/lint/build remain blocked by dependency installation failures.
- **Deployment checks:** `git push -u origin work` failed through the outbound proxy with HTTP 403. Supabase/Vercel checks remain blocked by absent access.
- **Deferred work:** Phase 3C frontend, source-health frontend, Phases 4–8, and deployed validation.
- **Blockers:** npm dependency installation/registry policy, GitHub proxy access, provider credentials, and deployment/database access.

## Phase 7 — Methodology and Trust

- **Status:** partially completed (implementation complete; full lint/build gate pending)
- **Audit findings:** The methodology now distinguishes observed attention from sales or population-wide readership, states the scheduled rather than instantaneous collection cadence, defines source-specific signals, and explains canonical identity, missing data, deterministic scoring, confidence, demo isolation, and latest-known-good behavior. Unsupported providers are identified rather than presented as live coverage.
- **Files changed:** `src/components/Methodology.jsx`, this log.
- **Migrations added or applied:** None.
- **Tests run:** `git diff --check` passed. Direct ESLint execution remains blocked by the incomplete local `@eslint/js` installation.
- **Deployment checks:** The standalone component was prepared for root-layout integration; no deployed UI was accessible for browser verification.
- **Commit:** Pending integration commit.
- **Pushed branch:** Pending integration and remote access.
- **Deferred work:** Integrate the component into `src/App.jsx`, run the repository verification suite, and inspect the rendered responsive view.
- **Blockers:** Local dependency installation and deployed browser access.

## Phase 8 — README and Portfolio Quality

- **Status:** partially completed (documentation complete; verified screenshots and full build gate pending)
- **Audit findings:** The stock Vite README was replaced with an implementation-specific product summary, Mermaid architecture/data-flow diagrams, honest provider availability, observation/scoring semantics, failure behavior, demo/production boundaries, repository map, setup, environment, Supabase migration, ingestion, verification, deployment, security, limitations, and future work. Commands and scripts match `package.json`. Screenshots were deliberately not fabricated or copied from stale mock output.
- **Files changed:** `README.md`, this log.
- **Migrations added or applied:** None.
- **Tests run:** Documentation paths and package scripts were inspected; `git diff --check` passed. Full lint/build remains subject to the dependency blocker above.
- **Deployment checks:** No deployment was accessible and no verified current-product screenshot could be captured.
- **Commit:** Pending integration commit.
- **Pushed branch:** Pending integration and remote access.
- **Deferred work:** Generate and embed current screenshots after a successful runnable build, then verify every clean-clone instruction in an environment with registry and Supabase/Vercel access.
- **Blockers:** Incomplete local dependencies, unavailable deployment, and outbound registry/remote restrictions.

## Phases 3C–5 — Historical experience, source health, scoring, and Breakout Radar

- **Status:** completed locally; external verification blocked
- **Audit findings:** Book rows are keyboard-selectable; the detail drawer renders only persisted sparse points and labels snapshot movement. Source health derives public states from persisted runs and formats display time in PHT. Signal-aware historical features, explanations, confidence, and classifications are deterministic. Breakout Radar uses a distinct growth/acceleration question and excludes insufficient history. Unlike chart units are independently scaled and explicitly not compared.
- **Files changed:** history/source-health/breakout APIs and repositories, `backend/core/trendScorer.js`, explicit observation migration, frontend detail/health/radar components, API client, `src/App.jsx`, `src/components/TrendingBoard.jsx`, and `src/index.css`.
- **Migrations added or applied:** `202608270004_explicit_observation_contract.sql` added; not applied because no Supabase project is linked.
- **Tests run:** `npm run test:backend` passed all 45 tests; `git diff --check` passed. `npm run lint` and `npm run build` were attempted but unavailable dependencies could not be downloaded through the HTTP 403 proxy.
- **Deployment checks:** None claimed. Production data volume, controlled ingestion/replay, deployed APIs, responsive browser inspection, and screenshots require external access.
- **Commits:** `8fdebad`, `e2eaea2`, `6fbcf94`, `9269563`.
- **Pushed branch:** pending; outbound GitHub access is blocked.
- **Deferred work:** empirical scoring calibration only after sufficient genuine history; approved additional providers only after authorization.
- **Blockers:** Supabase/Vercel/provider credentials, GitHub/registry proxy access, and a runnable deployed browser target.

## Phases 7–9 — Trust, portfolio documentation, and final audit

- **Status:** completed locally; external gates blocked
- **Audit findings:** Public methodology and README match implemented behavior and limitations. Repository scans found no production engine import, generated historical points, or random scoring. Randomness exists only as retry backoff jitter in `backend/core/http.js`, not data identity or analytics.
- **Tests run:** full backend suite passed; migration filenames are unique; production integrity scan and `git diff --check` passed.
- **Deployment checks:** lint/build/screenshot/deployed endpoint checks remain blocked as described above.
- **Commits:** `f7ccbff` plus the final audit commit.
- **Blockers:** external access only; no additional credential-independent implementation is deferred.
