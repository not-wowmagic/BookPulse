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

    if (!readModel?.payload?.books?.length) {
      return json(
        {
          status: "warming",
          message: "No published snapshot is available yet",
        },
        503
      );
    }

    return json({
      status: "ok",
      generatedAtUtc: readModel.payload.generatedAtUtc,
      lastUpdatedPht: toPhtDisplay(readModel.payload.generatedAtUtc, env.PHT_TIMEZONE),
      requiredSources: readModel.payload.requiredSources,
      successfulSources: readModel.payload.successfulSources,
      sourceFailures: readModel.payload.sourceFailures,
      books: readModel.payload.books,
    });
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
