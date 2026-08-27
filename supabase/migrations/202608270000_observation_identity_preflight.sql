-- Fail safely before adding the retry identity index. This migration never
-- modifies historical observations; operators must review any reported rows.
do $$
declare
  duplicate_groups bigint;
  duplicate_rows bigint;
begin
  select count(*), coalesce(sum(row_count - 1), 0)
    into duplicate_groups, duplicate_rows
  from (
    select count(*) as row_count
    from source_mentions
    group by canonical_key, source, captured_at
    having count(*) > 1
  ) duplicates;

  if duplicate_groups > 0 then
    raise exception using
      message = format(
        'source_mentions contains %s duplicate rows across %s observation identities; no rows were changed',
        duplicate_rows,
        duplicate_groups
      ),
      hint = 'Inspect canonical_key, source, captured_at groups and obtain approval before deterministic cleanup.';
  end if;
end $$;
