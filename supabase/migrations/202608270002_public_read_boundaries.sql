-- Writes remain service-role-only. Public API handlers may read only the two
-- persisted operational projections needed by /api/trending and /api/health.
alter table ingest_runs enable row level security;
alter table books enable row level security;
alter table source_mentions enable row level security;
alter table read_models enable row level security;
alter table missing_metadata_log enable row level security;
alter table cover_overrides enable row level security;

revoke all on table ingest_runs, books, source_mentions, read_models,
  missing_metadata_log, cover_overrides from anon, authenticated;

grant select on table ingest_runs, read_models to anon, authenticated;

drop policy if exists "public read ingest health" on ingest_runs;
create policy "public read ingest health"
  on ingest_runs for select to anon, authenticated using (true);

drop policy if exists "public read published models" on read_models;
create policy "public read published models"
  on read_models for select to anon, authenticated using (true);
