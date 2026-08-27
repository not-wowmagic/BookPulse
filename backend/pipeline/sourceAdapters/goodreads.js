import { DEMO_SOURCE_BOOKS } from "../../data/demoSourceBooks.js";
import { sanitizeExternalBookRecord } from "../../security/sanitize.js";

const SOURCE = "goodreads";

export async function fetchGoodreadsSource({ env, logger = () => {}, fetchImpl = fetch }) {
  if (env.BOOKPULSE_MODE === "demo" && env.ALLOW_DEMO_SOURCES) {
    return DEMO_SOURCE_BOOKS.goodreads.map((item) => sanitizeExternalBookRecord(item, SOURCE));
  }

  throw new Error("Goodreads source is unavailable: no supported production API is configured");
}
