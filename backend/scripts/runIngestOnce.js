import { getNodeEnv } from "../config/env.js";
import { createCacheGateway } from "../gateways/redis.js";
import { getSupabaseAdminClient } from "../gateways/supabase.js";
import { runIngestion } from "../pipeline/ingestRun.js";

async function main() {
  const env = getNodeEnv();
  const cache = await createCacheGateway({
    env,
    logger: (message) => console.log(`[cache] ${message}`),
  });
  const supabase = getSupabaseAdminClient(env);

  const result = await runIngestion({
    env,
    cache,
    supabase,
    logger: (message) => console.log(`[ingest] ${message}`),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Ingestion failed", error);
  process.exitCode = 1;
});
