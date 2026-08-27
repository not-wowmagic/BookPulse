import test from "node:test";
import assert from "node:assert/strict";
import { fetchRedditSource, normalizeRedditPost } from "../pipeline/sourceAdapters/reddit.js";

const NOW_SECONDS = Math.floor(Date.now() / 1000);

function post(overrides = {}) {
  return {
    kind: "t3",
    data: {
      name: "t3_abc123",
      title: "[Book] Trese — Budjette Tan",
      created_utc: NOW_SECONDS - 60,
      num_comments: 12,
      permalink: "/r/PHBookClub/comments/abc123/trese/",
      subreddit: "PHBookClub",
      score: 20,
      upvote_ratio: 0.9,
      ...overrides,
    },
  };
}

const env = {
  BOOKPULSE_MODE: "production",
  ALLOW_DEMO_SOURCES: false,
  REDDIT_TRENDS_ENDPOINT: "https://oauth.reddit.com/r/phbookclub/new",
  REDDIT_API_TOKEN: "secret-token",
  REDDIT_USER_AGENT: "web:bookpulse:test (by /u/test)",
  REDDIT_COLLECTION_WINDOW_HOURS: 24,
  REDDIT_MAX_PAGES: 2,
  SOURCE_TIMEOUT_MS: 100,
  SOURCE_RETRY_ATTEMPTS: 0,
};

function response(payload) {
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
}

test("normalizes explicit book discussions with provider semantics and timestamps", () => {
  const result = normalizeRedditPost(post(), { capturedAtUtc: "2026-08-27T01:00:00.000Z" });
  assert.equal(result.title, "Trese");
  assert.equal(result.author, "Budjette Tan");
  assert.equal(result.signalType, "discussion_count");
  assert.equal(result.unit, "comments");
  assert.equal(result.value, 12);
  assert.equal(result.providerRecordId, "t3_abc123");
  assert.equal(result.capturedAtUtc, "2026-08-27T01:00:00.000Z");
  assert.equal(result.providerRecordedAtUtc, new Date((NOW_SECONDS - 60) * 1000).toISOString());
});

test("rejects malformed and unstructured records rather than guessing identities", () => {
  assert.equal(normalizeRedditPost(post({ title: "What did everyone read this week?" })), null);
  assert.equal(normalizeRedditPost(post({ created_utc: "invalid" })), null);
  assert.equal(normalizeRedditPost(post({ name: "not-a-post" })), null);
});

test("paginates listings, sends OAuth headers, and deduplicates stable post IDs", async () => {
  const urls = [];
  const fetchImpl = async (url, options) => {
    urls.push(String(url));
    assert.equal(options.headers.Authorization, "Bearer secret-token");
    assert.equal(options.headers["User-Agent"], env.REDDIT_USER_AGENT);
    if (urls.length === 1) return response({ data: { children: [post()], after: "t3_next" } });
    return response({ data: { children: [post(), post({ name: "t3_def456", title: "Babel by R. F. Kuang" })], after: null } });
  };

  const records = await fetchRedditSource({ env, fetchImpl });
  assert.equal(records.length, 2);
  assert.match(urls[1], /after=t3_next/);
});

test("stops at the bounded collection window and handles empty responses", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return response({ data: { children: [post({ created_utc: NOW_SECONDS - 172800 })], after: "t3_next" } });
  };
  assert.deepEqual(await fetchRedditSource({ env, fetchImpl }), []);
  assert.equal(calls, 1);

  const empty = await fetchRedditSource({ env, fetchImpl: async () => response({ data: { children: [], after: null } }) });
  assert.deepEqual(empty, []);
});

test("rejects non-official endpoints before transmitting the token", async () => {
  await assert.rejects(
    fetchRedditSource({ env: { ...env, REDDIT_TRENDS_ENDPOINT: "https://example.com/steal" }, fetchImpl: () => assert.fail() }),
    /oauth\.reddit\.com/
  );
});

test("production cannot silently use demo observations", async () => {
  await assert.rejects(
    fetchRedditSource({
      env: { ...env, ALLOW_DEMO_SOURCES: true, REDDIT_API_TOKEN: undefined },
      fetchImpl: () => assert.fail(),
    }),
    /OAuth token missing/
  );
});

test("propagates timeouts and provider failures for partial-run isolation", async () => {
  await assert.rejects(
    fetchRedditSource({ env, fetchImpl: async () => new Response("unavailable", { status: 503 }) }),
    /503/
  );

  await assert.rejects(
    fetchRedditSource({ env: { ...env, SOURCE_TIMEOUT_MS: 5 }, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason))) }),
    /abort|timeout/i
  );
});

test("honors a rate-limit response through bounded retry", async () => {
  let calls = 0;
  const records = await fetchRedditSource({
    env: { ...env, SOURCE_RETRY_ATTEMPTS: 1 },
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return new Response("rate limited", { status: 429 });
      return response({ data: { children: [post()], after: null } });
    },
  });
  assert.equal(calls, 2);
  assert.equal(records.length, 1);
});
