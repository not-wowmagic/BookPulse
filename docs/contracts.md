# BookPulse persisted data contracts

Version 1 freezes the meanings shared by ingestion, persistence, APIs, and the browser. All machine timestamps are ISO 8601 UTC. Missing values are `null` or absent; they are never coerced to zero.

## Normalized observation (`observation.v1`)

| Field | Type | Meaning |
| --- | --- | --- |
| `canonicalKey` | string | Stable key derived from normalized title and author. |
| `source` | enum | Provider boundary, currently `reddit`, `tiktok`, or `goodreads`. |
| `signalType` | enum/string | Explicit semantic, such as `interval_mention_count`, `discussion_count`, `review_count`, `engagement_count`, or `ranking_position`. |
| `value` | finite number | Observed value. Unlike signal types are not summed or compared as equivalent units. |
| `unit` | string | Human-readable unit matching the signal, e.g. `mentions`, `comments`, `reviews`, or `rank`. |
| `capturedAtUtc` | UTC string | When BookPulse captured the observation. |
| `providerRecordedAtUtc` | UTC string/null | Provider event timestamp when one exists. |
| `providerRecordId` | string/null | Stable provider identifier; required for record-level sources when available. |
| `providerReference` | URL/string/null | Non-sensitive public URL or reference. |
| `window` | object/null | `{ startAtUtc, endAtUtc, durationSeconds }` for interval values. |
| `rawMetadata` | object | Allowlisted source facts required to reproduce normalization; never secrets or unrestricted payloads. |
| `ingestionRunId` | UUID | Run that first persisted the observation. A replay does not create a second historical point. |

The legacy `source_mentions.mentions_24h` column represents `interval_mention_count` in a 24-hour window only when a provider supplies that semantic. Adapters must not place comments, reviews, cumulative totals, scores, or ranks into that field. New persistence uses explicit signal fields.

## `GET /api/trending`

Returns the persisted `trending:latest` snapshot only. Status is `ok` or `stale` with HTTP 200, `warming` with HTTP 503 when no snapshot exists, or `error`. Top-level fields are `status`, `mode`, `generatedAtUtc`, `lastUpdatedPht`, `requiredSources`, `successfulSources`, `sourceFailures`, and ranked `books`. Each book includes stable identity, metadata, current and previous score/rank values, snapshot-to-snapshot changes, source provenance, freshness, and optional score explanation. `mode: demo` must remain visible.

## `GET /api/books/:canonicalKey/history`

Accepts a URL-encoded canonical key and bounded `days` query (default 30). Returns `canonicalKey`, bibliographic `metadata`, a `current` score/rank object, `firstSeenAtUtc`, `peakScore`, `peakRank`, `sufficientHistory`, grouped `series`, and `sourceFreshness`. A series contains one `source`, one `signalType`, one `unit`, and persisted points. Points are never generated to fill gaps. Unknown books return 404; malformed keys/windows return 400.

## `GET /api/source-health`

Returns `generatedAtUtc`, snapshot availability, and one entry per supported source. Public fields are `source`, `configured`, `state`, `lastAttemptAtUtc`, `lastSuccessAtUtc`, `lastFailureAtUtc`, `latestRecordCount`, `freshnessSeconds`, and `consecutiveFailures`. State is one of `healthy`, `delayed`, `stale`, `failing`, `not_configured`, or `never_run`. Diagnostics, tokens, endpoints, stack traces, and raw payloads are excluded. A source outage explicitly preserves the last known-good ranking.
