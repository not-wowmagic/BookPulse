alter table source_mentions
  add column if not exists signal_type text,
  add column if not exists signal_value numeric,
  add column if not exists unit text,
  add column if not exists provider_record_id text,
  add column if not exists provider_recorded_at timestamptz,
  add column if not exists provider_reference text,
  add column if not exists observation_window jsonb,
  add column if not exists raw_metadata jsonb not null default '{}'::jsonb,
  add column if not exists observation_key text;

alter table ingest_runs
  add column if not exists source_record_counts jsonb not null default '{}'::jsonb;

update source_mentions
set signal_type = coalesce(signal_type, 'interval_mention_count'),
    signal_value = coalesce(signal_value, mentions_24h),
    unit = coalesce(unit, 'mentions'),
    observation_key = coalesce(
      observation_key,
      encode(digest(canonical_key || ':' || source || ':interval_mention_count:' || captured_at::text, 'sha256'), 'hex')
    )
where signal_type is null or signal_value is null or unit is null or observation_key is null;

alter table source_mentions
  alter column signal_type set not null,
  alter column signal_value set not null,
  alter column unit set not null,
  alter column observation_key set not null;

alter table source_mentions
  add constraint source_mentions_signal_value_finite check (signal_value >= 0),
  add constraint source_mentions_window_object check (observation_window is null or jsonb_typeof(observation_window) = 'object'),
  add constraint source_mentions_raw_metadata_object check (jsonb_typeof(raw_metadata) = 'object');

drop index if exists source_mentions_observation_identity_idx;
create unique index if not exists source_mentions_observation_key_idx
  on source_mentions (observation_key);

create index if not exists source_mentions_signal_history_idx
  on source_mentions (canonical_key, source, signal_type, captured_at desc);
