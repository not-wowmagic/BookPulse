# BookPulse revival audit

## Current production flow

`/api/cron/ingest` acquires the ingestion lock, then `backend/pipeline/ingestRun.js` runs the TikTok, Reddit, and Goodreads adapters. Records are sanitized, matched to a canonical book key, enriched through Open Library, scored deterministically, and persisted to Supabase. A complete run publishes `read_models['trending:latest']`; a partial run records its observations and preserves the previous published snapshot. `/api/trending` reads only that snapshot, and `useBookData` now maps its contract into the three platform boards.

## Production-ready boundaries

- Ingestion runs, source failure isolation, canonical matching, metadata enrichment, deterministic scoring, persisted snapshots, edge reads, Redis locking, and demo/production environment validation are implemented.
- Source adapters share a normalized `{ title, author, mentions24h, capturedAtUtc }` contract.
- Production adapters still depend on configured provider endpoints; the repository does not contain first-party TikTok, Reddit, or Goodreads collectors.
- `src/services/engine.js` is legacy demo code. It is retained for reference but has no production import path.

## Contract

`GET /api/trending` returns `status`, `mode`, snapshot timestamps, source coverage, failures, and `books`. Each book has a stable `canonicalKey`, metadata, current score, previous score, score change, current/previous rank, rank change, source count, source list, mentions, and observation timestamp.

The response states are:

- `ok`: a snapshot within the configured fresh window.
- `stale`: a known-good snapshot older than the fresh window.
- `warming`: no snapshot has been published yet (`503`).
- `error`: the persisted read path failed.

Demo mode is explicitly returned by the API and visibly labeled in the frontend.

## Historical and retry behavior

`source_mentions` preserves source observations by timestamp. An observation is uniquely identified by canonical book, source, and capture timestamp, so replaying the same provider observation cannot add a second historical point. Duplicate records within one adapter result are consolidated before persistence. Snapshot-to-snapshot score and rank movement are computed from the previous published read model; they are intentionally not labeled as seven-day history.

## Deferred work

- Genuine provider integrations and provider-specific signal semantics.
- Time-series and book-detail endpoints.
- Seven-day charts, breakout detection, source-health UI, and richer scoring.
- Reintroducing genre, vibe, forecast, and Filipino-author views only when backed by persisted factual fields.
