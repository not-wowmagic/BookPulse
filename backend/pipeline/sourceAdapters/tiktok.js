import { DEMO_SOURCE_BOOKS } from "../../data/demoSourceBooks.js";
import { sanitizeExternalBookRecord } from "../../security/sanitize.js";
import { fetchSourceRecords } from "./shared.js";

const SOURCE = "tiktok";

export async function fetchTikTokSource({ env, logger = () => {}, fetchImpl = fetch }) {
  if (env.BOOKPULSE_MODE === "demo" || env.ALLOW_DEMO_SOURCES) {
    return DEMO_SOURCE_BOOKS.tiktok.map((item) => sanitizeExternalBookRecord(item, SOURCE));
  }

  if (!env.TIKTOK_TRENDS_ENDPOINT || !env.TIKTOK_API_TOKEN) {
    throw new Error("TikTok source config missing in production mode");
  }

  return fetchSourceRecords({
    env,
    sourceName: SOURCE,
    endpoint: env.TIKTOK_TRENDS_ENDPOINT,
    apiToken: env.TIKTOK_API_TOKEN,
    timeoutMs: env.SOURCE_TIMEOUT_MS,
    retries: env.SOURCE_RETRY_ATTEMPTS,
    logger,
    fetchImpl,
  });
}
