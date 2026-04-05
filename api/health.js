import { getEdgeEnv } from "../backend/config/env.js";
import { toPhtDisplay } from "../backend/core/time.js";
import { getHealthSnapshot } from "../backend/edge/readModel.js";

export const config = {
  runtime: "edge",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-bookpulse-runtime": "edge",
    },
  });
}

/**
 * Pre-Flight Checklist (verified in this handler)
 * 1) Health response reads persisted state only (no background work in request path).
 * 2) Reports whether latest ingest run was complete or partial.
 * 3) Returns both UTC and PHT timestamps for operator visibility.
 * 4) Exposes non-sensitive diagnostics only.
 */
export default async function healthHandler() {
  try {
    const env = getEdgeEnv();
    const { readModel, latestRun } = await getHealthSnapshot({ env });

    const generatedAtUtc = readModel?.payload?.generatedAtUtc || null;
    return json({
      status: "ok",
      snapshotAvailable: Boolean(readModel?.payload?.books?.length),
      latestSnapshotUtc: generatedAtUtc,
      latestSnapshotPht: generatedAtUtc ? toPhtDisplay(generatedAtUtc, env.PHT_TIMEZONE) : null,
      latestRun,
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
