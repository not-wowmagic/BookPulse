import test from "node:test";
import assert from "node:assert/strict";
import { buildBreakoutRadar } from "../repository/breakoutRepository.js";

test("radar is derived only from supplied persisted rows and retains provenance", () => {
  const values = [1, 2, 3, 8, 20, 40];
  const rows = values.flatMap((value, index) => ["reddit", "tiktok"].map((source) => ({
    canonical_key: "book-a", source, mentions_24h: value,
    captured_at: new Date(Date.UTC(2026, 7, 20 + index)).toISOString(),
  })));
  const result = buildBreakoutRadar({
    rows,
    books: [{ canonical_key: "book-a", title: "Book A", author: "Author", cover_url: "https://example.test/a.jpg" }],
    nowUtc: new Date("2026-08-25T01:00:00.000Z"),
  });
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].provenance, ["reddit", "tiktok"]);
  assert.equal(result[0].title, "Book A");
  assert.equal(result[0].trend.classification, "breakout");
});

test("radar returns empty when persisted history is insufficient", () => {
  const result = buildBreakoutRadar({ rows: [{
    canonical_key: "new-book", source: "reddit", mentions_24h: 3,
    captured_at: "2026-08-25T00:00:00.000Z",
  }], nowUtc: new Date("2026-08-25T01:00:00.000Z") });
  assert.deepEqual(result, []);
});
