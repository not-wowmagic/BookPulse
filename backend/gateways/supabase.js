import { createClient } from "@supabase/supabase-js";

let supabaseClient;

export function getSupabaseAdminClient(env) {
  if (!supabaseClient) {
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
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
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
