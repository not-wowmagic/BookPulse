import test from "node:test";
import assert from "node:assert/strict";
import { computeHistoricalTrend, rankBreakouts } from "../core/trendScorer.js";

const times = ["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25"]
  .map((day) => `${day}T00:00:00.000Z`);
const series = (source, values, signalType = "interval_mention_count") => ({
  source, signalType, unit: "mentions",
  points: values.map((value, index) => ({ value, capturedAtUtc: times[index] })),
});
const context = { nowUtc: new Date("2026-08-25T01:00:00.000Z") };

test("historical scoring is deterministic and explanation contributions total the score before confidence", () => {
  const input = [series("reddit", [2, 3, 4, 8, 14, 25]), series("tiktok", [1, 2, 3, 7, 12, 20])];
  const first = computeHistoricalTrend(input, context);
  const second = computeHistoricalTrend(input, context);
  assert.deepEqual(first, second);
  const contributions = first.components.reduce((sum, item) => sum + item.contribution, 0);
  assert.ok(Math.abs(first.score - contributions * first.confidence) < 0.1);
  assert.equal(first.classification, "breakout");
});

test("large static popularity is sustained rather than a breakout", () => {
  const result = computeHistoricalTrend([series("reddit", [1000, 1000, 1000, 1000, 1000, 1000])], context);
  assert.equal(result.classification, "sustained");
  assert.equal(result.features.growth, 0);
});

test("a rapid single-source rise is classified as a spike", () => {
  const result = computeHistoricalTrend([series("reddit", [1, 1, 2, 10, 30, 80])], context);
  assert.equal(result.classification, "spike");
});

test("decline and stale observations lower classification and freshness", () => {
  const result = computeHistoricalTrend([series("reddit", [50, 40, 30, 10, 5, 2])], {
    nowUtc: new Date("2026-09-03T00:00:00.000Z"),
  });
  assert.equal(result.classification, "cooling");
  assert.ok(result.features.freshness < 0.02);
});

test("sparse and missing histories are explicit rather than treated as zero", () => {
  const sparse = computeHistoricalTrend([{
    source: "reddit", signalType: "interval_mention_count", points: [
      { value: 4, capturedAtUtc: times[0] }, { value: 12, capturedAtUtc: times[5] },
    ],
  }], context);
  assert.equal(sparse.score, null);
  assert.equal(sparse.classification, "insufficient_history");
  assert.equal(computeHistoricalTrend([], context).score, null);
});

test("cumulative totals are converted to non-negative deltas", () => {
  const result = computeHistoricalTrend([series("goodreads", [100, 101, 103, 106, 110, 115], "review_count")], context);
  assert.equal(result.features.recentAttention, 4);
  assert.ok(result.features.baselineAttention < result.features.recentAttention);
});

test("breakout ranking excludes insufficient history and is stable", () => {
  const items = rankBreakouts([
    { canonicalKey: "growth", series: [series("reddit", [1, 2, 3, 8, 20, 40]), series("tiktok", [1, 1, 2, 6, 15, 35])], context },
    { canonicalKey: "sparse", series: [{ source: "reddit", signalType: "discussion_count", points: [{ value: 2, capturedAtUtc: times[5] }] }], context },
  ]);
  assert.deepEqual(items.map((item) => item.canonicalKey), ["growth"]);
  assert.equal(items[0].breakoutReason, "multi_source_breakout");
});
