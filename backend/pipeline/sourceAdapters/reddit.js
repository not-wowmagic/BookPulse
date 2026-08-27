import { DEMO_SOURCE_BOOKS } from "../../data/demoSourceBooks.js";
import { fetchJsonWithRetry } from "../../core/http.js";
import { sanitizeExternalBookRecord, sanitizeFreeText } from "../../security/sanitize.js";

const SOURCE = "reddit";
const DEFAULT_ENDPOINT = "https://oauth.reddit.com/r/phbookclub/new";
const DEFAULT_WINDOW_HOURS = 24;
const DEFAULT_MAX_PAGES = 4;
const PAGE_SIZE = 100;
const MIN_REMAINING_REQUESTS = 2;

function positiveInteger(value, fallback, maximum) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function redditEndpoint(rawEndpoint) {
  const url = new URL(rawEndpoint || DEFAULT_ENDPOINT);
  if (url.protocol !== "https:" || url.hostname !== "oauth.reddit.com") {
    throw new Error("Reddit OAuth endpoint must use https://oauth.reddit.com");
  }
  return url;
}

function extractBookIdentity(post) {
  const text = sanitizeFreeText(post?.title, 300);
  // Only intentionally structured discussion titles are accepted. Guessing a
  // book from arbitrary prose would create false canonical identities.
  const patterns = [
    /^\s*\[book\]\s*(.+?)\s+(?:by|[—–-])\s+(.+)$/i,
    /^\s*(.+?)\s+by\s+(.+?)\s*(?:\[(?:discussion|book)\])?\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const title = sanitizeFreeText(match[1], 180);
      const author = sanitizeFreeText(match[2], 120);
      if (title && author) return { title, author };
    }
  }
  return null;
}

export function normalizeRedditPost(rawPost, { capturedAtUtc = new Date().toISOString() } = {}) {
  const post = rawPost?.data ?? rawPost;
  if (!post || typeof post !== "object") return null;

  const providerRecordId = sanitizeFreeText(post.name, 40);
  const identity = extractBookIdentity(post);
  const createdSeconds = Number(post.created_utc);
  const discussions = Number(post.num_comments);
  const permalink = typeof post.permalink === "string" ? post.permalink : "";

  if (
    !/^t3_[a-z0-9]+$/i.test(providerRecordId) ||
    !identity ||
    !Number.isFinite(createdSeconds) ||
    createdSeconds <= 0 ||
    !Number.isFinite(discussions) ||
    discussions < 0 ||
    !permalink.startsWith("/r/")
  ) {
    return null;
  }

  const providerRecordedAtUtc = new Date(createdSeconds * 1000).toISOString();
  const sanitized = sanitizeExternalBookRecord(
    {
      ...identity,
      discussions: Math.floor(discussions),
      sourceUrl: `https://www.reddit.com${permalink}`,
      capturedAtUtc,
    },
    SOURCE
  );

  return Object.freeze({
    ...sanitized,
    signalType: "discussion_count",
    value: sanitized.mentions24h,
    unit: "comments",
    providerRecordedAtUtc,
    providerRecordId,
    providerReference: sanitized.sourceUrl,
    window: null,
    rawMetadata: Object.freeze({
      subreddit: sanitizeFreeText(post.subreddit, 40),
      postScore: Number.isFinite(Number(post.score)) ? Math.floor(Number(post.score)) : null,
      upvoteRatio: Number.isFinite(Number(post.upvote_ratio)) ? Number(post.upvote_ratio) : null,
    }),
  });
}

function nextPageUrl(endpoint, after) {
  const url = new URL(endpoint);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("raw_json", "1");
  if (after) url.searchParams.set("after", after);
  return url;
}

function listing(payload) {
  return Array.isArray(payload?.data?.children) ? payload.data.children : [];
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchRedditSource({ env, logger = () => {}, fetchImpl = fetch }) {
  if (env.BOOKPULSE_MODE === "demo" && env.ALLOW_DEMO_SOURCES) {
    return DEMO_SOURCE_BOOKS.reddit.map((item) => sanitizeExternalBookRecord(item, SOURCE));
  }

  if (!env.REDDIT_API_TOKEN) {
    throw new Error("Reddit OAuth token missing in production mode");
  }

  const endpoint = redditEndpoint(env.REDDIT_TRENDS_ENDPOINT);
  const windowHours = positiveInteger(env.REDDIT_COLLECTION_WINDOW_HOURS, DEFAULT_WINDOW_HOURS, 168);
  const maxPages = positiveInteger(env.REDDIT_MAX_PAGES, DEFAULT_MAX_PAGES, 10);
  const capturedAtUtc = new Date().toISOString();
  const cutoff = Date.parse(capturedAtUtc) - windowHours * 60 * 60 * 1000;
  const records = new Map();
  let after = null;

  for (let page = 0; page < maxPages; page += 1) {
    const url = nextPageUrl(endpoint, after);
    const payload = await fetchJsonWithRetry(url, {
      method: "GET",
      timeoutMs: env.SOURCE_TIMEOUT_MS,
      retries: env.SOURCE_RETRY_ATTEMPTS,
      fetchImpl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.REDDIT_API_TOKEN}`,
        "User-Agent": env.REDDIT_USER_AGENT || "web:bookpulse:1.0 (by /u/bookpulse)",
      },
    });

    const children = listing(payload);
    let reachedCutoff = false;
    for (const child of children) {
      const createdAt = Number(child?.data?.created_utc) * 1000;
      if (Number.isFinite(createdAt) && createdAt < cutoff) {
        reachedCutoff = true;
        continue;
      }
      const normalized = normalizeRedditPost(child, { capturedAtUtc });
      if (normalized && !records.has(normalized.providerRecordId)) {
        records.set(normalized.providerRecordId, normalized);
      }
    }

    after = typeof payload?.data?.after === "string" ? payload.data.after : null;
    if (!after || reachedCutoff || children.length === 0) break;

    // Reddit's documented response headers are unavailable through the JSON
    // helper, so pace pagination conservatively as well as honoring retries.
    if (page + 1 < maxPages) await wait(1000 / MIN_REMAINING_REQUESTS);
  }

  logger(`Source reddit yielded ${records.size} structured discussions`);
  return [...records.values()];
}
