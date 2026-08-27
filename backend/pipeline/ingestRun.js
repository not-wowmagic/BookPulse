import { canonicalBookKey } from "../core/hash.js";
import { scoreBooks } from "../core/trendScorer.js";
import { utcNowIso } from "../core/time.js";
import { resolveOpenLibraryMetadata } from "./openLibrary.js";
import { fetchTikTokSource } from "./sourceAdapters/tiktok.js";
import { fetchRedditSource } from "./sourceAdapters/reddit.js";
import { fetchGoodreadsSource } from "./sourceAdapters/goodreads.js";
import {
  finalizeIngestRun,
  getPublishedTrendingReadModel,
  insertSourceMentions,
  publishTrendingReadModel,
  startIngestRun,
  upsertBooks,
} from "../repository/trendingRepository.js";

const SOURCE_ADAPTERS = Object.freeze([
  { name: "tiktok", execute: fetchTikTokSource },
  { name: "reddit", execute: fetchRedditSource },
  { name: "goodreads", execute: fetchGoodreadsSource },
]);

function summarizeError(error) {
  const text = error?.message || String(error || "Unknown error");
  return text.slice(0, 300);
}

async function mapWithConcurrency(items, limit, worker) {
  const outputs = new Array(items.length);
  let current = 0;

  async function runWorker() {
    while (current < items.length) {
      const index = current;
      current += 1;
      outputs[index] = await worker(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return outputs;
}

function mergeSourceRecords(successEntries) {
  const merged = new Map();

  for (const entry of successEntries) {
    for (const record of entry.records) {
      const key = canonicalBookKey(record.title, record.author);
      const existing = merged.get(key) || {
        canonicalKey: key,
        title: record.title,
        author: record.author,
        mentions24h: 0,
        sourceCount: 0,
        sources: new Set(),
        lastSeenAtUtc: record.capturedAtUtc,
        metadata: {
          sourceBreakdown: {},
        },
      };

      existing.mentions24h += record.mentions24h;
      existing.sources.add(entry.sourceName);
      existing.sourceCount = existing.sources.size;
      existing.metadata.sourceBreakdown[entry.sourceName] =
        (existing.metadata.sourceBreakdown[entry.sourceName] || 0) + record.mentions24h;

      if (new Date(record.capturedAtUtc).getTime() > new Date(existing.lastSeenAtUtc).getTime()) {
        existing.lastSeenAtUtc = record.capturedAtUtc;
      }

      merged.set(key, existing);
    }
  }

  return [...merged.values()].map((item) => ({
    ...item,
    sources: [...item.sources],
  }));
}

export function buildMentionRows(runId, successEntries) {
  const rows = new Map();
  for (const entry of successEntries) {
    for (const record of entry.records) {
      const canonicalKey = canonicalBookKey(record.title, record.author);
      const observationKey = `${canonicalKey}:${entry.sourceName}:${record.capturedAtUtc}`;
      const existing = rows.get(observationKey);
      rows.set(observationKey, {
        run_id: runId,
        canonical_key: canonicalKey,
        source: entry.sourceName,
        mentions_24h: (existing?.mentions_24h || 0) + record.mentions24h,
        captured_at: record.capturedAtUtc,
      });
    }
  }
  return [...rows.values()];
}

export function addSnapshotMovement(scoredBooks, previousPayload) {
  const previousBooks = Array.isArray(previousPayload?.books) ? previousPayload.books : [];
  const previousByKey = new Map(
    previousBooks.map((book, index) => [book.canonicalKey, { ...book, rank: index + 1 }])
  );

  return scoredBooks.map((book, index) => {
    const previous = previousByKey.get(book.canonicalKey);
    const rank = index + 1;
    const previousTrendScore = previous ? Number(previous.trendScore || 0) : null;
    const previousRank = previous?.rank ?? null;
    return {
      ...book,
      rank,
      previousTrendScore,
      scoreChange: previousTrendScore === null ? null : book.trendScore - previousTrendScore,
      previousRank,
      rankChange: previousRank === null ? null : previousRank - rank,
    };
  });
}

function normalizeBookForReadModel(book) {
  return {
    canonicalKey: book.canonicalKey,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    coverStatus: book.coverUrl ? "verified" : "missing",
    publishedYear: book.publishedYear,
    mentions24h: book.mentions24h,
    trendScore: book.trendScore,
    sourceCount: book.sourceCount,
    sources: book.sources,
    lastSeenAtUtc: book.lastSeenAtUtc,
    metadata: book.metadata,
    rank: book.rank,
    previousTrendScore: book.previousTrendScore,
    scoreChange: book.scoreChange,
    previousRank: book.previousRank,
    rankChange: book.rankChange,
  };
}

export async function runIngestion({
  env,
  supabase,
  cache,
  logger = () => {},
  fetchImpl = fetch,
}) {
  const requiredSources = env.INGEST_REQUIRED_SOURCES_ARRAY;
  const start = await startIngestRun(supabase, {
    requiredSources,
    notes: "Tier-1 ingestion run started",
  });

  const runId = start.id;
  let finalizedPayload;

  try {
    logger(`Ingestion run ${runId} started`);

    const settled = await Promise.allSettled(
      SOURCE_ADAPTERS.map(async (adapter) => {
        const records = await adapter.execute({ env, logger, fetchImpl });
        return {
          sourceName: adapter.name,
          records,
        };
      })
    );

    const successEntries = [];
    const failedSources = {};

    settled.forEach((result, index) => {
      const sourceName = SOURCE_ADAPTERS[index].name;
      if (result.status === "fulfilled") {
        successEntries.push(result.value);
        return;
      }

      failedSources[sourceName] = summarizeError(result.reason);
      logger(`Source ${sourceName} failed: ${failedSources[sourceName]}`);
    });

    const successfulSources = successEntries.map((entry) => entry.sourceName);
    const sourceCoverageComplete = requiredSources.every((sourceName) =>
      successfulSources.includes(sourceName)
    );

    const mergedBooks = mergeSourceRecords(successEntries);
    const enriched = await mapWithConcurrency(mergedBooks, 4, async (book) => {
      const metadata = await resolveOpenLibraryMetadata({
        title: book.title,
        author: book.author,
        canonicalKey: book.canonicalKey,
        env,
        cache,
        supabase,
        logger,
        fetchImpl,
      });

      return {
        ...book,
        title: metadata.verifiedTitle || book.title,
        author: metadata.foundAuthor || book.author,
        coverUrl: metadata.coverUrl,
        publishedYear: metadata.publishedYear,
        metadata: {
          ...book.metadata,
          openLibraryCacheStatus: metadata.cacheStatus,
          verificationSource: metadata.verificationSource,
          authorSimilarity: metadata.authorSimilarity,
          verificationAttemptCount: metadata.attemptCount,
          requiresManualOverride: metadata.requiresManualOverride,
        },
      };
    });

    const previousReadModel = await getPublishedTrendingReadModel(supabase);
    const scored = addSnapshotMovement(scoreBooks(enriched, {
      nowUtc: new Date(),
    }), previousReadModel?.payload).map((book) => ({
      ...book,
      updatedAtUtc: utcNowIso(),
    }));

    await upsertBooks(supabase, scored);
    await insertSourceMentions(supabase, buildMentionRows(runId, successEntries));

    if (sourceCoverageComplete && scored.length > 0) {
      const generatedAtUtc = utcNowIso();
      await publishTrendingReadModel(supabase, {
        generatedAtUtc,
        requiredSources,
        successfulSources,
        sourceFailures: failedSources,
        books: scored.map(normalizeBookForReadModel),
      });

      logger(`Published read model with ${scored.length} books`);
    } else {
      logger("Read model publication skipped due to partial coverage");
    }

    finalizedPayload = {
      status: sourceCoverageComplete ? "completed" : "partial_failed",
      completedAtUtc: utcNowIso(),
      successfulSources,
      failedSources,
      errorCount: Object.keys(failedSources).length,
      notes: sourceCoverageComplete
        ? "Read model published from complete source coverage"
        : "Partial run detected. Existing read model was preserved.",
    };

    await finalizeIngestRun(supabase, runId, finalizedPayload);

    return {
      runId,
      published: sourceCoverageComplete,
      sourceCoverageComplete,
      successfulSources,
      failedSources,
      totalBooks: scored.length,
      status: finalizedPayload.status,
    };
  } catch (error) {
    finalizedPayload = {
      status: "failed",
      completedAtUtc: utcNowIso(),
      successfulSources: [],
      failedSources: {
        pipeline: summarizeError(error),
      },
      errorCount: 1,
      notes: "Pipeline failed before completion",
    };

    await finalizeIngestRun(supabase, runId, finalizedPayload);
    throw error;
  }
}
