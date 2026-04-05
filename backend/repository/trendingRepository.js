function formatSupabaseError(operation, error) {
  const message = error?.message || "Unknown Supabase error";
  return new Error(`${operation} failed: ${message}`);
}

function requireData(operation, response) {
  if (response.error) {
    throw formatSupabaseError(operation, response.error);
  }
  return response.data;
}

export async function startIngestRun(supabase, payload) {
  const response = await supabase
    .from("ingest_runs")
    .insert({
      status: "running",
      required_sources: payload.requiredSources,
      successful_sources: [],
      failed_sources: {},
      error_count: 0,
      notes: payload.notes || null,
    })
    .select("id, started_at, status")
    .single();

  return requireData("startIngestRun", response);
}

export async function finalizeIngestRun(supabase, runId, payload) {
  const response = await supabase
    .from("ingest_runs")
    .update({
      status: payload.status,
      completed_at: payload.completedAtUtc,
      successful_sources: payload.successfulSources,
      failed_sources: payload.failedSources,
      error_count: payload.errorCount,
      notes: payload.notes || null,
    })
    .eq("id", runId)
    .select("id, status, completed_at")
    .single();

  return requireData("finalizeIngestRun", response);
}

export async function upsertBooks(supabase, books) {
  if (!books.length) {
    return [];
  }

  const rows = books.map((book) => ({
    canonical_key: book.canonicalKey,
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl,
    published_year: book.publishedYear,
    latest_mentions_24h: book.mentions24h,
    trend_score: book.trendScore,
    source_count: book.sourceCount,
    metadata: book.metadata || {},
    updated_at: book.updatedAtUtc,
  }));

  const response = await supabase
    .from("books")
    .upsert(rows, {
      onConflict: "canonical_key",
      ignoreDuplicates: false,
    })
    .select("canonical_key, trend_score, updated_at");

  return requireData("upsertBooks", response);
}

export async function insertSourceMentions(supabase, rows) {
  if (!rows.length) {
    return [];
  }

  const response = await supabase
    .from("source_mentions")
    .upsert(rows, {
      onConflict: "run_id,canonical_key,source",
      ignoreDuplicates: false,
    })
    .select("id");

  return requireData("insertSourceMentions", response);
}

export async function publishTrendingReadModel(supabase, payload) {
  const response = await supabase
    .from("read_models")
    .upsert(
      {
        key: "trending:latest",
        payload,
        updated_at: payload.generatedAtUtc,
      },
      {
        onConflict: "key",
        ignoreDuplicates: false,
      }
    )
    .select("key, updated_at")
    .single();

  return requireData("publishTrendingReadModel", response);
}
