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
