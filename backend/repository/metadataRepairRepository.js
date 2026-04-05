import { toPhtDisplay, toUtcIso } from "../core/time.js";

function ensureData(operation, response) {
  if (response.error) {
    throw new Error(`${operation} failed: ${response.error.message}`);
  }
  return response.data;
}

export async function getCoverOverrideByCanonicalKey(supabase, canonicalKey) {
  const response = await supabase
    .from("cover_overrides")
    .select("canonical_key,cover_url,title,author,notes,created_by,created_at")
    .eq("canonical_key", canonicalKey)
    .maybeSingle();

  if (response.error) {
    throw new Error(`getCoverOverrideByCanonicalKey failed: ${response.error.message}`);
  }

  return response.data || null;
}

export async function upsertCoverOverride(supabase, payload) {
  const response = await supabase
    .from("cover_overrides")
    .upsert(
      {
        canonical_key: payload.canonicalKey,
        title: payload.title,
        author: payload.author,
        cover_url: payload.coverUrl,
        notes: payload.notes || null,
        created_by: payload.createdBy || "admin",
        updated_at: payload.updatedAtUtc || toUtcIso(new Date()),
      },
      {
        onConflict: "canonical_key",
        ignoreDuplicates: false,
      }
    )
    .select("canonical_key,cover_url,updated_at")
    .single();

  return ensureData("upsertCoverOverride", response);
}

export async function countMissingMetadataFailures(supabase, canonicalKey) {
  const response = await supabase
    .from("missing_metadata_log")
    .select("id", { count: "exact", head: true })
    .eq("canonical_key", canonicalKey)
    .eq("status", "failed");

  if (response.error) {
    throw new Error(`countMissingMetadataFailures failed: ${response.error.message}`);
  }

  return Number(response.count || 0);
}

export async function insertMissingMetadataLog(supabase, payload) {
  const verifiedAtUtc = payload.verifiedAtUtc || toUtcIso(new Date());
  const verifiedAtPht = payload.verifiedAtPht || toPhtDisplay(verifiedAtUtc, payload.phtTimeZone || "Asia/Manila");

  const response = await supabase
    .from("missing_metadata_log")
    .insert({
      canonical_key: payload.canonicalKey,
      title: payload.title,
      author: payload.author,
      status: payload.status,
      attempt_count: payload.attemptCount,
      author_similarity: payload.authorSimilarity,
      verification_source: payload.verificationSource,
      cover_url: payload.coverUrl || null,
      details: payload.details || {},
      verified_at_utc: verifiedAtUtc,
      verified_at_pht: verifiedAtPht,
      requires_manual_override: Boolean(payload.requiresManualOverride),
      resolved: Boolean(payload.resolved),
    })
    .select("id,status,verified_at_utc")
    .single();

  return ensureData("insertMissingMetadataLog", response);
}

export async function applyCoverOverrideToBook(supabase, payload) {
  const response = await supabase
    .from("books")
    .update({
      cover_url: payload.coverUrl,
      metadata: {
        ...payload.metadata,
        coverOverrideApplied: true,
      },
      updated_at: payload.updatedAtUtc || toUtcIso(new Date()),
    })
    .eq("canonical_key", payload.canonicalKey)
    .select("canonical_key,cover_url,updated_at")
    .maybeSingle();

  if (response.error) {
    throw new Error(`applyCoverOverrideToBook failed: ${response.error.message}`);
  }

  return response.data || null;
}
