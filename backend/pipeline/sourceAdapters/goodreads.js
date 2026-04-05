import { DEMO_SOURCE_BOOKS } from "../../data/demoSourceBooks.js";
import { sanitizeExternalBookRecord } from "../../security/sanitize.js";
import { fetchSourceRecords } from "./shared.js";

const SOURCE = "goodreads";

export async function fetchGoodreadsSource({ env, logger = () => {}, fetchImpl = fetch }) {
  if (env.BOOKPULSE_MODE === "demo" || env.ALLOW_DEMO_SOURCES) {
    return DEMO_SOURCE_BOOKS.goodreads.map((item) => sanitizeExternalBookRecord(item, SOURCE));
  }

  if (!env.GOODREADS_TRENDS_ENDPOINT || !env.GOODREADS_API_TOKEN) {
    throw new Error("Goodreads source config missing in production mode");
  }

  return fetchSourceRecords({
    env,
    sourceName: SOURCE,
    endpoint: env.GOODREADS_TRENDS_ENDPOINT,
    apiToken: env.GOODREADS_API_TOKEN,
    timeoutMs: env.SOURCE_TIMEOUT_MS,
    retries: env.SOURCE_RETRY_ATTEMPTS,
    logger,
    fetchImpl,
  });
}
