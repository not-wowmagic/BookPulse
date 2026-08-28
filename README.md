# BookPulse

BookPulse is a trend-discovery app for books. It combines signals from multiple sources, normalizes book metadata, and presents a fast, filterable view of titles gaining attention.

[Open the live app](https://book-pulse-pi.vercel.app)

## Features

- Trending board with vibe filters and freshness-aware scoring
- Book-of-the-week and convergence signals across sources
- Open Library and Google Books metadata enrichment
- Demo mode for local development without external services
- Retry-safe ingestion with Supabase persistence
- Redis-backed caching and ingestion locks
- Admin cover overrides and metadata repair tools

## Architecture

- **Frontend:** React, Vite, Tailwind CSS, GSAP
- **API:** Vercel serverless functions under `api/`
- **Pipeline:** source adapters, metadata enrichment, normalization, and trend scoring under `backend/`
- **Storage:** Supabase
- **Cache and locks:** Redis or a compatible REST service
- **Validation:** Zod
- **Tests:** Node's built-in test runner

Source adapters are isolated under `backend/pipeline/sourceAdapters/`. The app can use demo data when live source integrations are unavailable.

## Local development

Requires a current Node.js LTS release.

```bash
npm ci
cp .env.example .env
npm run dev
```

The default example configuration uses development/demo mode. Never commit real service-role keys, API tokens, or admin tokens.

## Quality checks

```bash
npm run lint
npm run test:backend
npm run build
```

Run one ingestion cycle locally with:

```bash
npm run ingest:once
```

## Environment

See [`.env.example`](.env.example) for the complete configuration. Production integrations can include Supabase, Redis, Open Library, Google Books, and configured source endpoints.

## Deployment

The repository includes `vercel.json` and API routes for Vercel deployment. Configure production secrets in the deployment provider, not in the repository. Apply the migrations in `supabase/migrations/` before enabling persistent ingestion.

## Data notes

Trend signals are estimates derived from configured sources and may be incomplete, delayed, or unavailable. BookPulse keeps source adapters separate so individual integrations can be replaced without changing the read model.

## License

No reuse license has been selected yet.
