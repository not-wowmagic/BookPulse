import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBookHistory,
  parseHistoryWindow,
  validateCanonicalKey,
} from "../repository/historyRepository.js";

const book = {
  canonical_key: "trese-budjette-tan",
  title: "Trese",
  author: "Budjette Tan",
  cover_url: null,
  published_year: 2005,
  trend_score: 65,
};
const window = {
  days: 30,
  fromUtc: "2026-07-28T00:00:00.000Z",
  toUtc: "2026-08-27T00:00:00.000Z",
};

function row(run, key, source, value, capturedAt) {
  return { run_id: run, canonical_key: key, source, mentions_24h: value, captured_at: capturedAt };
}

test("history windows default to 30 days and remain bounded", () => {
  const result = parseHistoryWindow(null, new Date("2026-08-27T00:00:00.000Z"));
  assert.equal(result.days, 30);
  assert.equal(result.fromUtc, "2026-07-28T00:00:00.000Z");
  assert.throws(() => parseHistoryWindow("0"), RangeError);
  assert.throws(() => parseHistoryWindow("91"), RangeError);
  assert.throws(() => parseHistoryWindow("1.5"), RangeError);
});

test("canonical keys reject unsafe and unbounded input", () => {
  assert.equal(validateCanonicalKey("trese-budjette-tan"), "trese-budjette-tan");
  for (const key of ["", "../secret", "Trese", "a/b", "a".repeat(181)]) {
    assert.throws(() => validateCanonicalKey(key), TypeError);
  }
});

test("empty persisted history is transparent rather than generated", () => {
  const result = buildBookHistory({ canonicalKey: book.canonical_key, book, targetRows: [], allRows: [], latestPayload: null, window });
  assert.deepEqual(result.series, []);
  assert.equal(result.firstSeenAtUtc, null);
  assert.equal(result.sufficientHistory, false);
  assert.equal(result.current.previousScore, null);
});

test("one persisted observation remains insufficient and preserves missing provider time", () => {
  const rows = [row("run-1", book.canonical_key, "reddit", 4, "2026-08-26T00:00:00.000Z")];
  const result = buildBookHistory({ canonicalKey: book.canonical_key, book, targetRows: rows, allRows: rows, latestPayload: null, window });
  assert.equal(result.series[0].signalType, "interval_mention_count");
  assert.equal(result.series[0].unit, "mentions");
  assert.equal(result.series[0].points[0].providerRecordedAtUtc, null);
  assert.equal(result.sufficientHistory, false);
  assert.equal(result.peakRank, 1);
});

test("sparse multi-source observations calculate deterministic score and rank movement", () => {
  const targetRows = [
    row("run-1", book.canonical_key, "reddit", 4, "2026-08-20T00:00:00.000Z"),
    row("run-2", book.canonical_key, "reddit", 10, "2026-08-26T00:00:00.000Z"),
    row("run-2", book.canonical_key, "tiktok", 12, "2026-08-26T00:01:00.000Z"),
  ];
  const allRows = [
    ...targetRows,
    row("run-1", "other-author", "reddit", 8, "2026-08-20T00:00:00.000Z"),
    row("run-2", "other-author", "reddit", 5, "2026-08-26T00:00:00.000Z"),
  ];
  const result = buildBookHistory({ canonicalKey: book.canonical_key, book, targetRows, allRows, latestPayload: null, window });
  assert.equal(result.series.length, 2);
  assert.equal(result.current.previousScore !== null, true);
  assert.equal(result.current.previousRank, 2);
  assert.equal(result.current.rank, 1);
  assert.equal(result.current.rankChange, 1);
  assert.equal(result.peakRank, 1);
  assert.equal(result.sufficientHistory, true);
  assert.deepEqual(result, buildBookHistory({ canonicalKey: book.canonical_key, book, targetRows, allRows, latestPayload: null, window }));
});

test("published snapshot supplies authoritative current and previous values", () => {
  const rows = [row("run-1", book.canonical_key, "reddit", 4, "2026-08-20T00:00:00.000Z")];
  const latestPayload = { books: [{ canonicalKey: book.canonical_key, trendScore: 72, rank: 3, previousTrendScore: 66, previousRank: 5 }] };
  const result = buildBookHistory({ canonicalKey: book.canonical_key, book, targetRows: rows, allRows: rows, latestPayload, window });
  assert.deepEqual(result.current, { score: 72, previousScore: 66, scoreChange: 6, rank: 3, previousRank: 5, rankChange: 2 });
});

test("first seen can precede the bounded response window", () => {
  const rows = [row("run-2", book.canonical_key, "reddit", 4, "2026-08-20T00:00:00.000Z")];
  const result = buildBookHistory({
    canonicalKey: book.canonical_key,
    book,
    targetRows: rows,
    allRows: rows,
    latestPayload: null,
    window,
    firstSeenAtUtc: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(result.firstSeenAtUtc, "2026-01-01T00:00:00.000Z");
});

test("missing book returns no history", () => {
  assert.equal(buildBookHistory({ canonicalKey: "missing-book", book: null, targetRows: [], allRows: [], latestPayload: null, window }), null);
});
