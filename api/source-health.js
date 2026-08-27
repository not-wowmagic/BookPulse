import { getEdgeEnv } from "../backend/config/env.js";
import { deriveSourceHealth } from "../backend/core/sourceHealth.js";
import { ingestRunsRest, readModelByKeyRest } from "../backend/gateways/supabase.js";

export const config = { runtime: "edge" };
const SOURCES = ["reddit", "tiktok", "goodreads"];

export function buildSourceHealthResponse({ env, runs, readModel, now = new Date() }) {
  const configured = new Set(env.INGEST_REQUIRED_SOURCES_ARRAY || []);
  return {
    generatedAtUtc: now.toISOString(),
    snapshotAvailable: Boolean(readModel?.payload?.books?.length),
    outagePolicy: "A source outage preserves the last known-good ranking.",
    sources: SOURCES.map((source) => deriveSourceHealth({ source, configured: configured.has(source), runs, nowUtc: now, freshSeconds: env.SWR_FRESH_SECONDS, staleSeconds: env.SWR_STALE_SECONDS })),
  };
}

export default async function handler() {
  try {
    const env = getEdgeEnv();
    const [runs, readModel] = await Promise.all([ingestRunsRest({ env, limit: 50 }), readModelByKeyRest({ env, key: "trending:latest" })]);
    return new Response(JSON.stringify(buildSourceHealthResponse({ env, runs, readModel })), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  } catch {
    return new Response(JSON.stringify({ status: "error", message: "Source health is unavailable" }), { status: 500, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }
}
