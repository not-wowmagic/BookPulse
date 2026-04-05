import test from "node:test";
import assert from "node:assert/strict";
import { computeTrendScore, scoreBooks } from "../core/trendScorer.js";

test("computeTrendScore is deterministic for same input", () => {
  const input = {
    mentions24h: 1000,
    sourceCount: 3,
    confidence: 0.9,
    lastSeenAtUtc: "2026-04-05T08:00:00.000Z",
  };

  const context = {
    maxMentions: 1000,
    maxSources: 3,
    nowUtc: new Date("2026-04-05T09:00:00.000Z"),
  };

  const first = computeTrendScore(input, context);
  const second = computeTrendScore(input, context);
  assert.equal(first, second);
});

test("scoreBooks sorts by deterministic trend score descending", () => {
  const list = [
    {
      canonicalKey: "a",
      title: "Book A",
      author: "Author A",
      mentions24h: 100,
      sourceCount: 1,
      confidence: 0.7,
      lastSeenAtUtc: "2026-04-05T00:00:00.000Z",
    },
    {
      canonicalKey: "b",
      title: "Book B",
      author: "Author B",
      mentions24h: 1000,
      sourceCount: 3,
      confidence: 0.95,
      lastSeenAtUtc: "2026-04-05T08:30:00.000Z",
    },
  ];

  const result = scoreBooks(list, {
    nowUtc: new Date("2026-04-05T09:00:00.000Z"),
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].canonicalKey, "b");
  assert.ok(result[0].trendScore >= result[1].trendScore);
});
