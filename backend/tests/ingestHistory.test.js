import test from "node:test";
import assert from "node:assert/strict";
import { addSnapshotMovement, buildMentionRows } from "../pipeline/ingestRun.js";
import { sanitizeExternalBookRecord } from "../security/sanitize.js";

test("buildMentionRows collapses duplicate observations from one source", () => {
  const capturedAtUtc = "2026-08-27T01:00:00.000Z";
  const rows = buildMentionRows("run-1", [{
    sourceName: "reddit",
    records: [
      { title: "Trese", author: "Budjette Tan", mentions24h: 3, capturedAtUtc },
      { title: "Trese", author: "Budjette Tan", mentions24h: 4, capturedAtUtc },
    ],
  }]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].mentions_24h, 7);
  assert.equal(rows[0].captured_at, capturedAtUtc);
});

test("missing provider timestamps share a stable ingestion window", () => {
  const first = sanitizeExternalBookRecord({ title: "Trese", author: "Budjette Tan", mentions: 1 }, "reddit");
  const second = sanitizeExternalBookRecord({ title: "Trese", author: "Budjette Tan", mentions: 1 }, "reddit");
  assert.equal(first.capturedAtUtc, second.capturedAtUtc);
  assert.equal(new Date(first.capturedAtUtc).getUTCMinutes() % 15, 0);
});

test("addSnapshotMovement derives score and rank changes", () => {
  const current = addSnapshotMovement([
    { canonicalKey: "b", trendScore: 90 },
    { canonicalKey: "a", trendScore: 70 },
    { canonicalKey: "new", trendScore: 60 },
  ], { books: [
    { canonicalKey: "a", trendScore: 75 },
    { canonicalKey: "b", trendScore: 80 },
  ] });

  assert.deepEqual(
    current.map(({ canonicalKey, scoreChange, rankChange }) => ({ canonicalKey, scoreChange, rankChange })),
    [
      { canonicalKey: "b", scoreChange: 10, rankChange: 1 },
      { canonicalKey: "a", scoreChange: -5, rankChange: -1 },
      { canonicalKey: "new", scoreChange: null, rankChange: null },
    ]
  );
});
