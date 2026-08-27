const STATES = new Set(["healthy", "delayed", "stale", "failing", "not_configured", "never_run"]);

export function deriveSourceHealth({ source, configured, runs = [], nowUtc = new Date(), freshSeconds = 21600, staleSeconds = 259200 }) {
  if (!configured) return { source, configured: false, state: "not_configured", lastAttemptAtUtc: null, lastSuccessAtUtc: null, lastFailureAtUtc: null, latestRecordCount: null, freshnessSeconds: null, consecutiveFailures: 0 };
  const ordered = [...runs].sort((a, b) => new Date(b.startedAtUtc) - new Date(a.startedAtUtc));
  if (!ordered.length) return { source, configured: true, state: "never_run", lastAttemptAtUtc: null, lastSuccessAtUtc: null, lastFailureAtUtc: null, latestRecordCount: null, freshnessSeconds: null, consecutiveFailures: 0 };
  const success = ordered.find((run) => run.successfulSources?.includes(source));
  const failure = ordered.find((run) => run.failedSources && Object.hasOwn(run.failedSources, source));
  let consecutiveFailures = 0;
  for (const run of ordered) {
    if (run.successfulSources?.includes(source)) break;
    if (run.failedSources && Object.hasOwn(run.failedSources, source)) consecutiveFailures += 1;
  }
  const freshnessSeconds = success ? Math.max(0, Math.floor((nowUtc - new Date(success.completedAtUtc || success.startedAtUtc)) / 1000)) : null;
  let state = consecutiveFailures > 0 ? "failing" : "healthy";
  if (!success && consecutiveFailures === 0) state = "never_run";
  else if (consecutiveFailures === 0 && freshnessSeconds > staleSeconds) state = "stale";
  else if (consecutiveFailures === 0 && freshnessSeconds > freshSeconds) state = "delayed";
  const result = { source, configured: true, state, lastAttemptAtUtc: ordered[0].startedAtUtc, lastSuccessAtUtc: success?.completedAtUtc || success?.startedAtUtc || null, lastFailureAtUtc: failure?.completedAtUtc || failure?.startedAtUtc || null, latestRecordCount: success?.sourceRecordCounts?.[source] ?? null, freshnessSeconds, consecutiveFailures };
  if (!STATES.has(result.state)) throw new Error("Invalid source health state");
  return result;
}
