import { computeHistoricalTrend, scoreBooks } from "../core/trendScorer.js";

const HISTORY_DEFAULT_DAYS = 30;
const HISTORY_MAX_DAYS = 90;
const HISTORY_ROW_LIMIT = 5000;
const CANONICAL_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requireData(operation, response) {
  if (response.error) {
    throw new Error(`${operation} failed: ${response.error.message || "Unknown Supabase error"}`);
  }
  return response.data;
}

export function parseHistoryWindow(rawDays, now = new Date()) {
  const days = rawDays === null || rawDays === undefined || rawDays === ""
    ? HISTORY_DEFAULT_DAYS
    : Number(rawDays);
  if (!Number.isInteger(days) || days < 1 || days > HISTORY_MAX_DAYS) {
    throw new RangeError(`days must be an integer between 1 and ${HISTORY_MAX_DAYS}`);
  }
  return {
    days,
    fromUtc: new Date(now.getTime() - days * 86_400_000).toISOString(),
    toUtc: now.toISOString(),
  };
}

export function validateCanonicalKey(value) {
  const key = String(value || "");
  if (key.length > 180 || !CANONICAL_KEY_PATTERN.test(key)) {
    throw new TypeError("Invalid canonical book key");
  }
  return key;
}

function aggregateRun(rows) {
  const books = new Map();
  for (const row of rows) {
    const book = books.get(row.canonical_key) || {
      canonicalKey: row.canonical_key,
      mentions24h: 0,
      sources: new Set(),
      lastSeenAtUtc: row.captured_at,
    };
    book.mentions24h += Number(row.mentions_24h);
    book.sources.add(row.source);
    if (row.captured_at > book.lastSeenAtUtc) book.lastSeenAtUtc = row.captured_at;
    books.set(row.canonical_key, book);
  }
  return scoreBooks([...books.values()].map((book) => ({
    ...book,
    sources: [...book.sources],
    sourceCount: book.sources.size,
  })), { nowUtc: new Date(Math.max(...rows.map((row) => Date.parse(row.captured_at)))) });
}

function historicalSnapshots(allRows, canonicalKey) {
  const byRun = new Map();
  for (const row of allRows) {
    const group = byRun.get(row.run_id) || [];
    group.push(row);
    byRun.set(row.run_id, group);
  }
  return [...byRun.values()].map((rows) => {
    const scored = aggregateRun(rows);
    const index = scored.findIndex((book) => book.canonicalKey === canonicalKey);
    if (index < 0) return null;
    return {
      capturedAtUtc: rows.reduce((latest, row) => row.captured_at > latest ? row.captured_at : latest, rows[0].captured_at),
      score: scored[index].trendScore,
      rank: index + 1,
    };
  }).filter(Boolean).sort((left, right) => left.capturedAtUtc.localeCompare(right.capturedAtUtc));
}

function groupSeries(rows) {
  const groups = new Map();
  for (const row of rows) {
    const signalType = row.signal_type || "interval_mention_count";
    const unit = row.unit || "mentions";
    const key = `${row.source}:${signalType}:${unit}`;
    const group = groups.get(key) || {
      source: row.source,
      signalType,
      unit,
      points: [],
    };
    group.points.push({
      value: Number(row.signal_value ?? row.mentions_24h),
      capturedAtUtc: row.captured_at,
      providerRecordedAtUtc: row.provider_recorded_at || null,
    });
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    points: group.points.sort((a, b) => a.capturedAtUtc.localeCompare(b.capturedAtUtc)),
  }));
}

export function buildBookHistory({ canonicalKey, book, targetRows, allRows, latestPayload, window, firstSeenAtUtc = null }) {
  if (!book) return null;
  const snapshots = historicalSnapshots(allRows, canonicalKey);
  const publishedBooks = Array.isArray(latestPayload?.books) ? latestPayload.books : [];
  const currentPublished = publishedBooks.find((item) => item.canonicalKey === canonicalKey);
  const latest = snapshots.at(-1) || null;
  const previous = snapshots.at(-2) || null;
  const currentScore = currentPublished?.trendScore ?? book.trend_score ?? latest?.score ?? null;
  const currentRank = currentPublished?.rank ?? latest?.rank ?? null;
  const previousScore = currentPublished?.previousTrendScore ?? previous?.score ?? null;
  const previousRank = currentPublished?.previousRank ?? previous?.rank ?? null;
  const timestamps = targetRows.map((row) => row.captured_at).sort();
  const sources = [...new Set(targetRows.map((row) => row.source))];

  const series = groupSeries(targetRows);
  const historicalTrend = computeHistoricalTrend(series, { nowUtc: new Date(window.toUtc) });
  return {
    canonicalKey,
    metadata: {
      title: book.title,
      author: book.author,
      coverUrl: book.cover_url,
      publishedYear: book.published_year,
    },
    current: {
      score: currentScore,
      previousScore,
      scoreChange: currentScore === null || previousScore === null ? null : currentScore - previousScore,
      rank: currentRank,
      previousRank,
      rankChange: currentRank === null || previousRank === null ? null : previousRank - currentRank,
    },
    firstSeenAtUtc: firstSeenAtUtc || timestamps[0] || null,
    peakScore: [currentScore, ...snapshots.map((item) => item.score)]
      .filter((value) => value !== null).reduce((peak, value) => Math.max(peak, value), null),
    peakRank: [currentRank, ...snapshots.map((item) => item.rank)]
      .filter((value) => value !== null).reduce((peak, value) => peak === null ? value : Math.min(peak, value), null),
    sufficientHistory: historicalTrend.sufficientHistory,
    trendIntelligence: historicalTrend,
    series,
    sourceFreshness: sources.map((source) => ({
      source,
      latestCapturedAtUtc: targetRows.filter((row) => row.source === source)
        .reduce((latestAt, row) => row.captured_at > latestAt ? row.captured_at : latestAt, ""),
    })),
    window,
  };
}

export async function getBookHistory(supabase, { canonicalKey, window }) {
  const bookResponse = await supabase.from("books")
    .select("canonical_key,title,author,cover_url,published_year,trend_score")
    .eq("canonical_key", canonicalKey).maybeSingle();
  const book = requireData("getHistoryBook", bookResponse);
  if (!book) return null;

  const targetRows = requireData("getBookObservations", await supabase.from("source_mentions")
    .select("run_id,canonical_key,source,mentions_24h,signal_type,signal_value,unit,provider_recorded_at,captured_at")
    .eq("canonical_key", canonicalKey).gte("captured_at", window.fromUtc)
    .lte("captured_at", window.toUtc).order("captured_at", { ascending: true }).limit(HISTORY_ROW_LIMIT)) || [];
  const firstSeenRows = requireData("getBookFirstObservation", await supabase.from("source_mentions")
    .select("captured_at").eq("canonical_key", canonicalKey)
    .order("captured_at", { ascending: true }).limit(1)) || [];
  const runIds = [...new Set(targetRows.map((row) => row.run_id))];
  let allRows = [];
  if (runIds.length) {
    allRows = requireData("getHistoryRunObservations", await supabase.from("source_mentions")
      .select("run_id,canonical_key,source,mentions_24h,signal_type,signal_value,unit,provider_recorded_at,captured_at")
      .in("run_id", runIds).order("captured_at", { ascending: true }).limit(HISTORY_ROW_LIMIT));
  }
  const readModel = requireData("getHistoryReadModel", await supabase.from("read_models")
    .select("payload").eq("key", "trending:latest").maybeSingle());
  return buildBookHistory({
    canonicalKey,
    book,
    targetRows,
    allRows,
    latestPayload: readModel?.payload,
    window,
    firstSeenAtUtc: firstSeenRows[0]?.captured_at || null,
  });
}
