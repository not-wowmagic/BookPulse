import { getNodeEnv } from "../../../backend/config/env.js";
import { getSupabaseAdminClient } from "../../../backend/gateways/supabase.js";
import {
  getBookHistory,
  parseHistoryWindow,
  validateCanonicalKey,
} from "../../../backend/repository/historyRepository.js";

export const config = { runtime: "nodejs" };

export async function buildHistoryResponse({ canonicalKey, days, now = new Date(), supabase }) {
  const key = validateCanonicalKey(canonicalKey);
  const window = parseHistoryWindow(days, now);
  const history = await getBookHistory(supabase, { canonicalKey: key, window });
  return history ? { statusCode: 200, body: history } : {
    statusCode: 404,
    body: { status: "not_found", message: "Book history was not found" },
  };
}

export default async function historyHandler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const canonicalKey = req.query?.canonicalKey || url.pathname.split("/").at(-2);
    const env = getNodeEnv();
    const result = await buildHistoryResponse({
      canonicalKey,
      days: url.searchParams.get("days"),
      supabase: await getSupabaseAdminClient(env),
    });
    res.setHeader("cache-control", "public, s-maxage=60");
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return res.status(400).json({ status: "invalid_request", message: error.message });
    }
    return res.status(500).json({ status: "error", message: "History is temporarily unavailable" });
  }
}
