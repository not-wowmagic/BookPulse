import { latestIngestRunRest, readModelByKeyRest } from "../gateways/supabase.js";

export async function getTrendingReadModel({ env, fetchImpl = fetch }) {
  return readModelByKeyRest({
    env,
    key: "trending:latest",
    fetchImpl,
  });
}

export async function getHealthSnapshot({ env, fetchImpl = fetch }) {
  const [readModel, latestRun] = await Promise.all([
    getTrendingReadModel({ env, fetchImpl }),
    latestIngestRunRest({ env, fetchImpl }),
  ]);

  return {
    readModel,
    latestRun,
  };
}
