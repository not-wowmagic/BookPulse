create extension if not exists pgcrypto;

create table if not exists ingest_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  status text not null check (status in ('running', 'completed', 'partial_failed', 'failed')),
  required_sources text[] not null default '{}',
  successful_sources text[] not null default '{}',
  failed_sources jsonb not null default '{}'::jsonb,
  error_count integer not null default 0 check (error_count >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  title text not null,
  author text not null,
  cover_url text,
  published_year integer,
  latest_mentions_24h integer not null default 0 check (latest_mentions_24h >= 0),
  trend_score integer not null default 0 check (trend_score between 0 and 100),
  source_count integer not null default 0 check (source_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists source_mentions (
  id bigint generated always as identity primary key,
  run_id uuid not null references ingest_runs(id) on delete cascade,
  canonical_key text not null references books(canonical_key) on delete cascade,
  source text not null,
  mentions_24h integer not null check (mentions_24h >= 0),
  captured_at timestamptz not null default timezone('utc', now()),
  unique (run_id, canonical_key, source)
);

create table if not exists read_models (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ingest_runs_started_at on ingest_runs (started_at desc);
create index if not exists idx_books_trend_score on books (trend_score desc);
create index if not exists idx_source_mentions_run_id on source_mentions (run_id);
create index if not exists idx_read_models_updated_at on read_models (updated_at desc);
