import { getNodeEnv } from "../backend/config/env.js";
import { getSupabaseAdminClient } from "../backend/gateways/supabase.js";
import { getBreakoutRadar } from "../backend/repository/breakoutRepository.js";

export const config = { runtime: "nodejs" };

export default async function breakoutHandler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const limit = Number(url.searchParams.get("limit") || 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ status: "invalid_request", message: "limit must be between 1 and 50" });
    }
    const nowUtc = new Date();
    const items = await getBreakoutRadar(await getSupabaseAdminClient(getNodeEnv()), {
      fromUtc: new Date(nowUtc.getTime() - 30 * 86_400_000).toISOString(),
      toUtc: nowUtc.toISOString(),
      nowUtc,
      limit,
    });
    res.setHeader("cache-control", "public, s-maxage=60");
    return res.status(200).json({ status: items.length ? "ok" : "warming", generatedAtUtc: nowUtc.toISOString(), items });
  } catch {
    return res.status(500).json({ status: "error", message: "Breakout Radar is temporarily unavailable" });
  }
}
