import test from "node:test";
import assert from "node:assert/strict";
import fixture from "./fixtures/contracts.v1.json" with { type: "json" };

test("observation v1 fixture keeps signal semantics explicit", () => {
  const observation = fixture.observation;
  assert.equal(observation.signalType, "discussion_count");
  assert.equal(observation.unit, "comments");
  assert.equal(Number.isFinite(observation.value), true);
  assert.match(observation.capturedAtUtc, /Z$/);
  assert.ok(observation.providerRecordId);
  assert.ok(observation.ingestionRunId);
});

test("history fixture contains persisted sparse points without generated gaps", () => {
  assert.equal(fixture.history.sufficientHistory, false);
  assert.equal(fixture.history.series.length, 1);
  assert.equal(fixture.history.series[0].points.length, 1);
  assert.equal(fixture.history.series[0].points[0].value, 12);
});
