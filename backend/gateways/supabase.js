let supabaseClient;

export async function getSupabaseAdminClient(env) {
  if (!supabaseClient) {
    const { createClient } = await import("@supabase/supabase-js");
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-bookpulse-service": "ingest-worker",
        },
      },
    });
  }

  return supabaseClient;
}

function getRestHeaders(env) {
  const key = env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_ANON_KEY is required for public read projections");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
}

export async function readModelByKeyRest({ env, key, fetchImpl = fetch }) {
  const encodedKey = encodeURIComponent(key);
  const response = await fetchImpl(
    `${env.SUPABASE_URL}/rest/v1/read_models?key=eq.${encodedKey}&select=payload,updated_at&limit=1`,
    {
      method: "GET",
      headers: getRestHeaders(env),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to read read_models(${key}): ${response.status} ${text.slice(0, 300)}`);
  }

  const rows = await response.json();
  return rows?.[0] || null;
}

export async function latestIngestRunRest({ env, fetchImpl = fetch }) {
  const response = await fetchImpl(
    `${env.SUPABASE_URL}/rest/v1/ingest_runs?select=id,status,started_at,completed_at,successful_sources,failed_sources,error_count&order=started_at.desc&limit=1`,
    {
      method: "GET",
      headers: getRestHeaders(env),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to read ingest_runs: ${response.status} ${text.slice(0, 300)}`);
  }

  const rows = await response.json();
  return rows?.[0] || null;
}

export async function ingestRunsRest({ env, limit = 50, fetchImpl = fetch }) {
  const boundedLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const response = await fetchImpl(
    `${env.SUPABASE_URL}/rest/v1/ingest_runs?select=id,status,started_at,completed_at,successful_sources,failed_sources,error_count,source_record_counts&order=started_at.desc&limit=${boundedLimit}`,
    { method: "GET", headers: getRestHeaders(env) }
  );
  if (!response.ok) throw new Error(`Failed to read source health: ${response.status}`);
  const rows = await response.json();
  return (rows || []).map((run) => ({
    id: run.id,
    status: run.status,
    startedAtUtc: run.started_at,
    completedAtUtc: run.completed_at,
    successfulSources: run.successful_sources || [],
    failedSources: run.failed_sources || {},
    sourceRecordCounts: run.source_record_counts || {},
  }));
}
