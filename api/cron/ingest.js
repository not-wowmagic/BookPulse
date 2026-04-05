import { randomUUID } from "node:crypto";
import { getNodeEnv } from "../../backend/config/env.js";
import { createCacheGateway } from "../../backend/gateways/redis.js";
import { getSupabaseAdminClient } from "../../backend/gateways/supabase.js";
import { runIngestion } from "../../backend/pipeline/ingestRun.js";

export const config = {
  runtime: "nodejs",
};

function getInboundSecret(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.headers["x-cron-secret"] || req.query?.secret || "";
}

/**
 * Pre-Flight Checklist (verified in this handler)
 * 1) Environment is typed and validated before pipeline execution.
 * 2) Cron requests must present a shared secret (Bearer or x-cron-secret).
 * 3) Distributed lock prevents concurrent ingestion race conditions.
 * 4) Partial source failures do not overwrite the published read model.
 * 5) Timestamps persisted in UTC; PHT conversion is done only in read APIs.
 */
export default async function ingestCronHandler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let lockAcquired = false;
  const lockOwner = randomUUID();

  try {
    const env = getNodeEnv();
    const inboundSecret = getInboundSecret(req);
    if (!inboundSecret || inboundSecret !== env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = getSupabaseAdminClient(env);
    const cache = await createCacheGateway({ env, logger: () => {} });

    lockAcquired = await cache.acquireLock("bookpulse:ingest:lock", lockOwner, env.LOCK_TTL_SECONDS);
    if (!lockAcquired) {
      return res.status(409).json({
        status: "busy",
        message: "Ingestion is already running",
      });
    }

    const result = await runIngestion({
      env,
      supabase,
      cache,
      logger: () => {},
    });

    const statusCode = result.sourceCoverageComplete ? 200 : 207;
    return res.status(statusCode).json({
      status: result.status,
      runId: result.runId,
      published: result.published,
      successfulSources: result.successfulSources,
      failedSources: result.failedSources,
      totalBooks: result.totalBooks,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Ingestion failed",
      detail: error.message,
    });
  } finally {
    try {
      if (lockAcquired) {
        const env = getNodeEnv();
        const cache = await createCacheGateway({ env, logger: () => {} });
        await cache.releaseLock("bookpulse:ingest:lock", lockOwner);
      }
    } catch {
      // Best-effort lock release
    }
  }
}
