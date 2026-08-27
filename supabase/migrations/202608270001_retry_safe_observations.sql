-- A provider observation is immutable at its capture time. A retry may attach it
-- to a later run, but must not create a second historical data point.
create unique index if not exists source_mentions_observation_identity_idx
  on source_mentions (canonical_key, source, captured_at);

create index if not exists source_mentions_history_idx
  on source_mentions (canonical_key, captured_at desc);
