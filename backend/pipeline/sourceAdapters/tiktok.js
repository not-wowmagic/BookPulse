import { DEMO_SOURCE_BOOKS } from "../../data/demoSourceBooks.js";
import { sanitizeExternalBookRecord } from "../../security/sanitize.js";

const SOURCE = "tiktok";

export async function fetchTikTokSource({ env, logger = () => {}, fetchImpl = fetch }) {
  if (env.BOOKPULSE_MODE === "demo" && env.ALLOW_DEMO_SOURCES) {
    return DEMO_SOURCE_BOOKS.tiktok.map((item) => sanitizeExternalBookRecord(item, SOURCE));
  }

  throw new Error("TikTok source is unavailable without an approved provider integration");
}
