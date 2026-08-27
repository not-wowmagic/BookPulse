import test from "node:test";
import assert from "node:assert/strict";
import { deriveSourceHealth } from "../core/sourceHealth.js";

const now = new Date("2026-08-27T12:00:00.000Z");
const run = (overrides = {}) => ({ startedAtUtc: "2026-08-27T11:00:00.000Z", completedAtUtc: "2026-08-27T11:01:00.000Z", successfulSources: ["reddit"], failedSources: {}, ...overrides });

test("source health distinguishes unconfigured and never run", () => {
  assert.equal(deriveSourceHealth({ source: "reddit", configured: false }).state, "not_configured");
  assert.equal(deriveSourceHealth({ source: "reddit", configured: true }).state, "never_run");
});

test("source health derives success, staleness, failure sequence, and recovery", () => {
  assert.equal(deriveSourceHealth({ source: "reddit", configured: true, runs: [run()], nowUtc: now }).state, "healthy");
  assert.equal(deriveSourceHealth({ source: "reddit", configured: true, runs: [run({ startedAtUtc: "2026-08-20T00:00:00.000Z", completedAtUtc: "2026-08-20T00:01:00.000Z" })], nowUtc: now, staleSeconds: 86400 }).state, "stale");
  const failure = run({ startedAtUtc: "2026-08-27T11:30:00.000Z", completedAtUtc: "2026-08-27T11:31:00.000Z", successfulSources: [], failedSources: { reddit: "redacted" } });
  assert.equal(deriveSourceHealth({ source: "reddit", configured: true, runs: [failure, run()], nowUtc: now }).consecutiveFailures, 1);
  const recovery = run({ startedAtUtc: "2026-08-27T11:45:00.000Z", completedAtUtc: "2026-08-27T11:46:00.000Z" });
  assert.equal(deriveSourceHealth({ source: "reddit", configured: true, runs: [recovery, failure], nowUtc: now }).consecutiveFailures, 0);
});
