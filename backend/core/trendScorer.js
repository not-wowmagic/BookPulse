import { hoursBetween } from "./time.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMentions(mentions24h, maxMentions) {
  if (!maxMentions || maxMentions <= 0) {
    return 0;
  }
  return clamp(mentions24h / maxMentions, 0, 1);
}

function recencyWeight(lastSeenAtUtc, nowUtc) {
  if (!lastSeenAtUtc) {
    return 0.8;
  }

  const ageHours = hoursBetween(lastSeenAtUtc, nowUtc);
  if (ageHours <= 1) {
    return 1;
  }
  if (ageHours <= 6) {
    return 0.95;
  }
  if (ageHours <= 24) {
    return 0.85;
  }
  return 0.7;
}

export function computeTrendScore(book, context = {}) {
  const maxMentions = context.maxMentions || 1;
  const maxSources = context.maxSources || 1;
  const nowUtc = context.nowUtc || new Date();

  const mentions24h = Number(book.mentions24h || 0);
  const sourceCount = Number(book.sourceCount || (book.sources?.length ?? 0));
  const confidence = clamp(Number(book.confidence || 0.85), 0.1, 1);

  const mentionSignal = normalizeMentions(mentions24h, maxMentions);
  const sourceSignal = clamp(sourceCount / maxSources, 0, 1);
  const recencySignal = recencyWeight(book.lastSeenAtUtc, nowUtc);

  const weighted =
    mentionSignal * 0.65 +
    sourceSignal * 0.2 +
    confidence * 0.15;

  const score = Math.round(clamp(weighted * recencySignal * 100, 0, 100));
  return score;
}

export function scoreBooks(inputBooks, context = {}) {
  const books = Array.isArray(inputBooks) ? inputBooks : [];
  if (!books.length) {
    return [];
  }

  const maxMentions = books.reduce((max, item) => Math.max(max, Number(item.mentions24h || 0)), 1);
  const maxSources = books.reduce(
    (max, item) => Math.max(max, Number(item.sourceCount || item.sources?.length || 0)),
    1
  );

  return books
    .map((book) => ({
      ...book,
      trendScore: computeTrendScore(book, {
        ...context,
        maxMentions,
        maxSources,
      }),
    }))
    .sort((left, right) => right.trendScore - left.trendScore || right.mentions24h - left.mentions24h);
}

const HISTORICAL_WEIGHTS = Object.freeze({
  attention: 0.18,
  growth: 0.25,
  acceleration: 0.16,
  persistence: 0.12,
  freshness: 0.09,
  sourceBreadth: 0.12,
  crossSourceMomentum: 0.08,
});

function round(value, digits = 4) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function observationAttention(point, previous) {
  const value = Number(point.value);
  if (!Number.isFinite(value)) return null;
  switch (point.signalType) {
    case "cumulative_mention_count":
    case "review_count":
    case "discussion_count":
      return previous ? Math.max(0, value - Number(previous.value)) : null;
    case "ranking_position":
      return value > 0 ? 1 / value : null;
    case "interval_mention_count":
    case "engagement_count":
      return Math.max(0, value);
    default:
      return null;
  }
}

function normalizedSeries(input) {
  return (Array.isArray(input) ? input : []).flatMap((series) => {
    const points = [...(series.points || [])]
      .filter((point) => Number.isFinite(Number(point.value)) && !Number.isNaN(Date.parse(point.capturedAtUtc)))
      .sort((a, b) => a.capturedAtUtc.localeCompare(b.capturedAtUtc));
    return points.map((point, index) => ({
      ...point,
      source: series.source,
      signalType: series.signalType,
      attention: observationAttention({ ...point, signalType: series.signalType }, points[index - 1]),
    })).filter((point) => point.attention !== null);
  });
}

function component(name, rawValue, normalizedValue, weight, confidence) {
  const normalized = clamp(normalizedValue, 0, 1);
  return {
    name,
    rawValue: round(rawValue),
    normalizedValue: round(normalized),
    weight,
    contribution: round(normalized * weight * 100),
    confidence: round(confidence),
  };
}

/**
 * Scores persisted observations without filling gaps. Cumulative signals use deltas,
 * interval signals use their recorded value, and rank positions use reciprocal rank.
 */
export function computeHistoricalTrend(series, { nowUtc = new Date(), expectedSources = 3 } = {}) {
  const points = normalizedSeries(series);
  const captures = [...new Set(points.map((point) => point.capturedAtUtc))].sort();
  const sources = [...new Set(points.map((point) => point.source))];
  const durationHours = captures.length > 1
    ? hoursBetween(captures[0], captures.at(-1))
    : 0;
  const sufficientHistory = captures.length >= 3 && durationHours >= 48;
  const confidence = clamp((captures.length / 6) * 0.55 + (sources.length / expectedSources) * 0.3
    + Math.min(durationHours / 168, 1) * 0.15, 0, 1);

  if (!points.length) {
    return { score: null, classification: "insufficient_history", sufficientHistory: false, confidence: 0, components: [] };
  }

  const midpoint = Math.max(1, Math.floor(captures.length / 2));
  const recentTimes = new Set(captures.slice(midpoint));
  const olderTimes = new Set(captures.slice(0, midpoint));
  const sum = (set, source = null) => points.filter((point) => set.has(point.capturedAtUtc)
    && (!source || point.source === source)).reduce((total, point) => total + point.attention, 0);
  const average = (set, source = null) => {
    const observed = points.filter((point) => set.has(point.capturedAtUtc) && (!source || point.source === source));
    return observed.length ? observed.reduce((total, point) => total + point.attention, 0) / observed.length : null;
  };
  const recent = average(recentTimes) ?? 0;
  const baseline = average(olderTimes) ?? recent;
  const growth = baseline > 0 ? (recent - baseline) / baseline : recent > 0 ? 1 : 0;

  const recentCaptures = [...recentTimes];
  const recentMid = Math.max(1, Math.floor(recentCaptures.length / 2));
  const recentFirst = new Set(recentCaptures.slice(0, recentMid));
  const recentLast = new Set(recentCaptures.slice(recentMid));
  const firstAverage = average(recentFirst) ?? 0;
  const lastAverage = average(recentLast) ?? firstAverage;
  const recentGrowth = firstAverage > 0 ? (lastAverage - firstAverage) / firstAverage : 0;
  const acceleration = recentGrowth - growth;
  const latestAt = captures.at(-1);
  const ageHours = hoursBetween(latestAt, nowUtc);
  const freshness = Math.exp(-Math.max(0, ageHours) / 48);
  const positiveSources = sources.filter((source) => {
    const a = average(olderTimes, source);
    const b = average(recentTimes, source);
    return a !== null && b !== null && b > a;
  }).length;
  const sourceTotals = sources.map((source) => sum(recentTimes, source));
  const total = sourceTotals.reduce((value, item) => value + item, 0);
  const concentration = total > 0 ? Math.max(...sourceTotals) / total : 1;
  const persistence = captures.filter((capture) => sum(new Set([capture])) > 0).length / captures.length;

  const components = [
    component("current_normalized_attention", recent, recent / (recent + 20), HISTORICAL_WEIGHTS.attention, confidence),
    component("short_window_growth", growth, 0.5 + Math.tanh(growth) / 2, HISTORICAL_WEIGHTS.growth, confidence),
    component("acceleration", acceleration, 0.5 + Math.tanh(acceleration) / 2, HISTORICAL_WEIGHTS.acceleration, confidence),
    component("persistence", persistence, persistence, HISTORICAL_WEIGHTS.persistence, confidence),
    component("freshness", ageHours, freshness, HISTORICAL_WEIGHTS.freshness, confidence),
    component("source_breadth", sources.length, sources.length / expectedSources, HISTORICAL_WEIGHTS.sourceBreadth, confidence),
    component("cross_source_momentum", positiveSources, positiveSources / expectedSources, HISTORICAL_WEIGHTS.crossSourceMomentum, confidence),
  ];
  const score = sufficientHistory ? round(components.reduce((value, item) => value + item.contribution, 0) * confidence, 2) : null;
  let classification = "insufficient_history";
  if (sufficientHistory) {
    if (growth < -0.15) classification = "cooling";
    else if (growth > 0.6 && concentration > 0.8) classification = "spike";
    else if (growth > 0.6 && positiveSources >= 2) classification = "breakout";
    else if (growth > 0.15) classification = "rising";
    else classification = "sustained";
  }
  return {
    score,
    classification,
    sufficientHistory,
    confidence: round(confidence),
    features: { recentAttention: round(recent), baselineAttention: round(baseline), growth: round(growth), acceleration: round(acceleration), persistence: round(persistence), freshness: round(freshness), sourceBreadth: sources.length, sourceConcentration: round(concentration), crossSourceMomentum: positiveSources },
    components,
  };
}

export function rankBreakouts(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const trend = item.trend || computeHistoricalTrend(item.series, item.context);
    const novelty = item.firstSeenAtUtc && item.context?.nowUtc
      ? clamp(1 - hoursBetween(item.firstSeenAtUtc, item.context.nowUtc) / (24 * 30), 0, 1)
      : 0;
    const breakoutScore = trend.sufficientHistory
      ? round(clamp(Math.max(0, trend.features.growth) * 35 + Math.max(0, trend.features.acceleration) * 20
        + trend.features.crossSourceMomentum * 12 + novelty * 10 - trend.features.sourceConcentration * 8, 0, 100), 2)
      : null;
    const reason = !trend.sufficientHistory ? "insufficient_history"
      : trend.classification === "breakout" ? "multi_source_breakout"
        : trend.classification === "spike" ? "single_source_spike"
          : trend.features.growth > 0 && trend.features.baselineAttention > 0 ? "recovery_or_growth"
            : "established_popularity";
    return { ...item, trend, breakoutScore, breakoutReason: reason };
  }).filter((item) => item.breakoutScore !== null)
    .sort((a, b) => b.breakoutScore - a.breakoutScore || String(a.canonicalKey).localeCompare(String(b.canonicalKey)));
}
