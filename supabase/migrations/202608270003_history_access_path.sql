-- Supports bounded per-book history reads. The covering history index created in
-- 202608270001 remains the primary access path; run lookup supports reconstructing
-- deterministic rank snapshots from observations persisted in the same run.
create index if not exists source_mentions_run_history_idx
  on source_mentions (run_id, captured_at asc, canonical_key);
