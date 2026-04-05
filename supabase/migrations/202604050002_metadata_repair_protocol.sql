create table if not exists missing_metadata_log (
  id bigint generated always as identity primary key,
  canonical_key text not null,
  title text not null,
  author text not null,
  status text not null check (status in ('success', 'failed', 'manual_override')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  author_similarity numeric(5,2),
  verification_source text not null,
  cover_url text,
  details jsonb not null default '{}'::jsonb,
  requires_manual_override boolean not null default false,
  resolved boolean not null default false,
  verified_at_utc timestamptz not null default timezone('utc', now()),
  verified_at_pht text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_missing_metadata_log_canonical_key on missing_metadata_log (canonical_key);
create index if not exists idx_missing_metadata_log_status on missing_metadata_log (status);
create index if not exists idx_missing_metadata_log_verified_at_utc on missing_metadata_log (verified_at_utc desc);

create table if not exists cover_overrides (
  canonical_key text primary key,
  title text not null,
  author text not null,
  cover_url text not null,
  notes text,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
