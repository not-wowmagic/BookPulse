import { DEMO_SOURCE_BOOKS } from "../../data/demoSourceBooks.js";
import { sanitizeExternalBookRecord } from "../../security/sanitize.js";
import { fetchSourceRecords } from "./shared.js";

const SOURCE = "reddit";

export async function fetchRedditSource({ env, logger = () => {}, fetchImpl = fetch }) {
  if (env.BOOKPULSE_MODE === "demo" || env.ALLOW_DEMO_SOURCES) {
    return DEMO_SOURCE_BOOKS.reddit.map((item) => sanitizeExternalBookRecord(item, SOURCE));
  }

  if (!env.REDDIT_TRENDS_ENDPOINT || !env.REDDIT_API_TOKEN) {
    throw new Error("Reddit source config missing in production mode");
  }

  return fetchSourceRecords({
    env,
    sourceName: SOURCE,
    endpoint: env.REDDIT_TRENDS_ENDPOINT,
    apiToken: env.REDDIT_API_TOKEN,
    timeoutMs: env.SOURCE_TIMEOUT_MS,
    retries: env.SOURCE_RETRY_ATTEMPTS,
    logger,
    fetchImpl,
  });
}
