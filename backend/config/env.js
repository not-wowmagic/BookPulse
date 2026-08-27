const DEFAULTS = Object.freeze({
  BOOKPULSE_ENV: "development", BOOKPULSE_MODE: "demo",
  OPEN_LIBRARY_BASE_URL: "https://openlibrary.org", OPEN_LIBRARY_TIMEOUT_MS: 3500,
  OPENLIBRARY_MIN_CALL_INTERVAL_MS: 1000, SOURCE_TIMEOUT_MS: 5000, SOURCE_RETRY_ATTEMPTS: 2,
  AUTHOR_SIMILARITY_THRESHOLD: 85, METADATA_FAILURE_THRESHOLD: 3,
  GOOGLE_BOOKS_BASE_URL: "https://www.googleapis.com/books/v1",
  FIRECRAWL_SEARCH_ENDPOINT: "https://api.firecrawl.dev/v1/search",
  FIRECRAWL_SCRAPE_ENDPOINT: "https://api.firecrawl.dev/v1/scrape",
  SWR_FRESH_SECONDS: 21600, SWR_STALE_SECONDS: 259200, LOCK_TTL_SECONDS: 900,
  INGEST_REQUIRED_SOURCES: "reddit", PHT_TIMEZONE: "Asia/Manila", ALLOW_DEMO_SOURCES: false,
  REDDIT_COLLECTION_WINDOW_HOURS: 24, REDDIT_MAX_PAGES: 4,
});
const URL_KEYS = ["SUPABASE_URL", "REDIS_URL", "REDIS_REST_URL", "OPEN_LIBRARY_BASE_URL", "GOOGLE_BOOKS_BASE_URL", "FIRECRAWL_SEARCH_ENDPOINT", "FIRECRAWL_SCRAPE_ENDPOINT", "TIKTOK_TRENDS_ENDPOINT", "REDDIT_TRENDS_ENDPOINT", "GOODREADS_TRENDS_ENDPOINT"];
const POSITIVE_KEYS = ["OPEN_LIBRARY_TIMEOUT_MS", "OPENLIBRARY_MIN_CALL_INTERVAL_MS", "SOURCE_TIMEOUT_MS", "METADATA_FAILURE_THRESHOLD", "SWR_FRESH_SECONDS", "SWR_STALE_SECONDS", "LOCK_TTL_SECONDS", "REDDIT_COLLECTION_WINDOW_HOURS", "REDDIT_MAX_PAGES"];
const OPTIONAL_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "REDIS_URL", "REDIS_REST_URL", "REDIS_REST_TOKEN", "CRON_SECRET", "GOOGLE_BOOKS_API_KEY", "FIRECRAWL_API_KEY", "TIKTOK_TRENDS_ENDPOINT", "TIKTOK_API_TOKEN", "REDDIT_TRENDS_ENDPOINT", "REDDIT_API_TOKEN", "REDDIT_USER_AGENT", "GOODREADS_TRENDS_ENDPOINT", "GOODREADS_API_TOKEN", "ADMIN_EDIT_TOKEN"];
let cachedNodeEnv;
let cachedEdgeEnv;

function fail(message) { throw new Error(`Environment validation failed: ${message}`); }
function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off", ""].includes(normalized)) return false;
  fail(`ALLOW_DEMO_SOURCES: Invalid boolean value: ${value}`);
}
function parseBase(source) {
  const value = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) if (source[key] !== undefined && source[key] !== "") value[key] = source[key];
  for (const key of OPTIONAL_KEYS) if (source[key] !== undefined && source[key] !== "") value[key] = source[key];
  if (!source.SUPABASE_URL) fail("SUPABASE_URL: Required");
  if (!["development", "staging", "production"].includes(value.BOOKPULSE_ENV)) fail("BOOKPULSE_ENV: Invalid value");
  if (!["demo", "production"].includes(value.BOOKPULSE_MODE)) fail("BOOKPULSE_MODE: Invalid value");
  value.ALLOW_DEMO_SOURCES = parseBoolean(value.ALLOW_DEMO_SOURCES);
  value.SOURCE_RETRY_ATTEMPTS = Number(value.SOURCE_RETRY_ATTEMPTS);
  if (!Number.isInteger(value.SOURCE_RETRY_ATTEMPTS) || value.SOURCE_RETRY_ATTEMPTS < 0) fail("SOURCE_RETRY_ATTEMPTS: Expected a non-negative integer");
  for (const key of POSITIVE_KEYS) { value[key] = Number(value[key]); if (!Number.isInteger(value[key]) || value[key] <= 0) fail(`${key}: Expected a positive integer`); }
  value.AUTHOR_SIMILARITY_THRESHOLD = Number(value.AUTHOR_SIMILARITY_THRESHOLD);
  if (value.AUTHOR_SIMILARITY_THRESHOLD < 0 || value.AUTHOR_SIMILARITY_THRESHOLD > 100) fail("AUTHOR_SIMILARITY_THRESHOLD: Must be between 0 and 100");
  for (const key of URL_KEYS) if (value[key]) { try { new URL(value[key]); } catch { fail(`${key}: Invalid URL`); } }
  value.INGEST_REQUIRED_SOURCES_ARRAY = String(value.INGEST_REQUIRED_SOURCES).split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return value;
}
function validateNode(value) {
  if (!value.SUPABASE_SERVICE_ROLE_KEY) fail("SUPABASE_SERVICE_ROLE_KEY: Required for node workers");
  if (!value.CRON_SECRET || value.CRON_SECRET.length < 24) fail("CRON_SECRET: Required with at least 24 characters");
  if (value.BOOKPULSE_MODE === "production") {
    for (const key of ["REDDIT_TRENDS_ENDPOINT", "REDDIT_API_TOKEN", "ADMIN_EDIT_TOKEN"]) if (!value[key]) fail(`${key}: required when BOOKPULSE_MODE=production`);
  }
  if (value.SWR_STALE_SECONDS <= value.SWR_FRESH_SECONDS) fail("SWR_STALE_SECONDS must be greater than SWR_FRESH_SECONDS");
  return value;
}

export function getNodeEnv(source = process.env) { return cachedNodeEnv ||= validateNode(parseBase(source)); }
export function getEdgeEnv(source = process.env) { const value = parseBase(source); if (!value.SUPABASE_ANON_KEY) fail("SUPABASE_ANON_KEY: required for edge reads"); return cachedEdgeEnv ||= value; }
export function resetCachedEnvForTests() { cachedNodeEnv = undefined; cachedEdgeEnv = undefined; }
