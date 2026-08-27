import { rankBreakouts } from "../core/trendScorer.js";

const ROW_LIMIT = 5000;

function requireData(label, response) {
  if (response.error) throw new Error(`${label} failed: ${response.error.message || "database error"}`);
  return response.data || [];
}

export function buildBreakoutRadar({ rows, books = [], nowUtc = new Date(), limit = 10 }) {
  const metadata = new Map(books.map((book) => [book.canonical_key, book]));
  const grouped = new Map();
  for (const row of rows || []) {
    const book = grouped.get(row.canonical_key) || { firstSeenAtUtc: row.captured_at, series: new Map() };
    if (row.captured_at < book.firstSeenAtUtc) book.firstSeenAtUtc = row.captured_at;
    const signalType = row.signal_type || "interval_mention_count";
    const unit = row.unit || "mentions";
    const key = `${row.source}:${signalType}:${unit}`;
    const series = book.series.get(key) || { source: row.source, signalType, unit, points: [] };
    series.points.push({ value: Number(row.signal_value ?? row.mentions_24h), capturedAtUtc: row.captured_at });
    book.series.set(key, series);
    grouped.set(row.canonical_key, book);
  }
  return rankBreakouts([...grouped].map(([canonicalKey, entry]) => {
    const book = metadata.get(canonicalKey) || {};
    return {
      canonicalKey,
      title: book.title || null,
      author: book.author || null,
      coverUrl: book.cover_url || null,
      firstSeenAtUtc: entry.firstSeenAtUtc,
      series: [...entry.series.values()],
      context: { nowUtc },
      provenance: [...new Set([...entry.series.values()].map((series) => series.source))],
    };
  })).slice(0, Math.max(1, Math.min(50, Number(limit) || 10)));
}

export async function getBreakoutRadar(supabase, { fromUtc, toUtc, nowUtc, limit }) {
  const rows = requireData("getBreakoutObservations", await supabase.from("source_mentions")
    .select("canonical_key,source,signal_type,signal_value,unit,mentions_24h,captured_at")
    .gte("captured_at", fromUtc).lte("captured_at", toUtc)
    .order("captured_at", { ascending: true }).limit(ROW_LIMIT));
  if (!rows.length) return [];
  const keys = [...new Set(rows.map((row) => row.canonical_key))];
  const books = requireData("getBreakoutBooks", await supabase.from("books")
    .select("canonical_key,title,author,cover_url").in("canonical_key", keys));
  return buildBreakoutRadar({ rows, books, nowUtc, limit });
}
