import { getEdgeEnv } from "../backend/config/env.js";
import { toPhtDisplay } from "../backend/core/time.js";
import { getTrendingReadModel } from "../backend/edge/readModel.js";

export const config = {
  runtime: "edge",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, s-maxage=30, stale-while-revalidate=120",
      "x-bookpulse-runtime": "edge",
    },
  });
}

export function buildTrendingResponse(readModel, env, now = new Date()) {
  if (!readModel?.payload?.books?.length) {
    return {
      statusCode: 503,
      body: { status: "warming", mode: env.BOOKPULSE_MODE, message: "No published snapshot is available yet" },
    };
  }

  const payload = readModel.payload;
  const ageSeconds = Math.max(0, (now.getTime() - new Date(payload.generatedAtUtc).getTime()) / 1000);
  const status = ageSeconds > env.SWR_FRESH_SECONDS ? "stale" : "ok";
  return {
    statusCode: 200,
    body: {
      status,
      mode: env.BOOKPULSE_MODE,
      generatedAtUtc: payload.generatedAtUtc,
      lastUpdatedPht: toPhtDisplay(payload.generatedAtUtc, env.PHT_TIMEZONE),
      requiredSources: payload.requiredSources,
      successfulSources: payload.successfulSources,
      sourceFailures: payload.sourceFailures,
      books: payload.books,
    },
  };
}

/**
 * Pre-Flight Checklist (verified in this handler)
 * 1) Read path is edge-safe and does not execute heavy enrichment logic.
 * 2) Snapshot payload is served from persisted read model only.
 * 3) UTC timestamp remains in payload; user-facing PHT timestamp is derived at response.
 * 4) If ingest is partial, the previous known-good read model remains served.
 */
export default async function trendingHandler() {
  try {
    const env = getEdgeEnv();
    const readModel = await getTrendingReadModel({ env });

    const response = buildTrendingResponse(readModel, env);
    return json(response.body, response.statusCode);
  } catch (error) {
    return json(
      {
        status: "error",
        message: error.message,
      },
      500
    );
  }
}
