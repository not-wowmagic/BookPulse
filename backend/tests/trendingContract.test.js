import test from "node:test";
import assert from "node:assert/strict";
import { buildTrendingResponse } from "../../api/trending.js";
import { normalizeTrendingResponse } from "../../src/services/trendingApi.js";

const ENV = {
  BOOKPULSE_MODE: "demo",
  PHT_TIMEZONE: "Asia/Manila",
  SWR_FRESH_SECONDS: 3600,
};

test("trending contract exposes demo mode and freshness", () => {
  const generatedAtUtc = "2026-08-27T00:00:00.000Z";
  const response = buildTrendingResponse({ payload: {
    generatedAtUtc,
    books: [{ canonicalKey: "trese", title: "Trese", mentions24h: 12, sourceCount: 2, sources: ["reddit", "tiktok"] }],
  } }, ENV, new Date("2026-08-27T02:00:00.000Z"));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "stale");
  assert.equal(response.body.mode, "demo");

  const normalized = normalizeTrendingResponse(response.body);
  assert.equal(normalized.books[0].id, "trese");
  assert.equal(normalized.books[0].mentions, 12);
  assert.equal(normalized.books[0].isConvergent, true);
  assert.equal(normalized.booktokph.length, 1);
  assert.equal(normalized.phbookclub.length, 1);
});

test("trending contract reports warming without a snapshot", () => {
  const response = buildTrendingResponse(null, ENV);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.status, "warming");
  assert.equal(response.body.mode, "demo");
});
