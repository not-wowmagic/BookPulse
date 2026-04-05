import { fetchJsonWithRetry } from "../core/http.js";
import {
  authorMatchScore,
  normalizeAuthorForLookup,
  normalizeTitleForLookup,
  titleMatchScore,
} from "../core/fuzzyMatch.js";
import {
  countMissingMetadataFailures,
  getCoverOverrideByCanonicalKey,
  insertMissingMetadataLog,
} from "../repository/metadataRepairRepository.js";

const OPENLIBRARY_COVERS_BASE = "https://covers.openlibrary.org/b";

let metadataApiQueue = Promise.resolve();
let lastMetadataCallAtMs = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueRateLimitedTask(env, task) {
  const scheduled = metadataApiQueue.then(async () => {
    const minInterval = Math.max(1, Number(env.OPENLIBRARY_MIN_CALL_INTERVAL_MS || 1000));
    const now = Date.now();
    const waitMs = Math.max(0, lastMetadataCallAtMs + minInterval - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastMetadataCallAtMs = Date.now();
    return task();
  });

  metadataApiQueue = scheduled.catch(() => undefined);
  return scheduled;
}

async function fetchJsonRateLimited(url, options, env, fetchImpl) {
  return enqueueRateLimitedTask(env, async () =>
    fetchJsonWithRetry(url, {
      ...options,
      fetchImpl,
    })
  );
}

async function fetchRawRateLimited(url, options, env, fetchImpl) {
  return enqueueRateLimitedTask(env, () => fetchImpl(url, options));
}

function coverByIdUrl(coverId) {
  if (!coverId) {
    return null;
  }

  return `${OPENLIBRARY_COVERS_BASE}/id/${coverId}-L.jpg?default=false`;
}

function coverByIsbnUrl(isbn) {
  if (!isbn) {
    return null;
  }

  return `${OPENLIBRARY_COVERS_BASE}/isbn/${isbn}-L.jpg?default=false`;
}

function normalizeIsbn(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}

function cacheEnvelope(data, env, nowMs = Date.now()) {
  return {
    data,
    fetchedAtMs: nowMs,
    freshUntilMs: nowMs + env.SWR_FRESH_SECONDS * 1000,
    staleUntilMs: nowMs + env.SWR_STALE_SECONDS * 1000,
  };
}

function isFresh(entry, nowMs = Date.now()) {
  return entry && entry.freshUntilMs > nowMs;
}

function isStaleButUsable(entry, nowMs = Date.now()) {
  return entry && entry.freshUntilMs <= nowMs && entry.staleUntilMs > nowMs;
}

function extractWorkId(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/\/works\/(OL\d+W)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  if (/^OL\d+W$/i.test(value)) {
    return String(value).toUpperCase();
  }

  return null;
}

function scoreOpenLibraryDoc(doc, expectedTitle, expectedAuthor) {
  const candidateAuthor = doc.author_name?.[0] || "";
  const titleScore = titleMatchScore(expectedTitle, doc.title || "");
  const authorScore = authorMatchScore(expectedAuthor, candidateAuthor);
  const hasCoverBoost = doc.cover_i ? 5 : 0;

  return {
    doc,
    titleScore,
    authorScore,
    score: titleScore * 0.55 + authorScore * 0.45 + hasCoverBoost,
  };
}

function pickBestOpenLibraryDoc(docs, expectedTitle, expectedAuthor) {
  if (!Array.isArray(docs) || docs.length === 0) {
    return null;
  }

  const scored = docs
    .map((doc) => scoreOpenLibraryDoc(doc, expectedTitle, expectedAuthor))
    .sort((left, right) => right.score - left.score);

  return scored[0] || null;
}

function extractIsbnsFromSearchDoc(doc) {
  if (!doc?.isbn) {
    return [];
  }

  return uniqueList(
    doc.isbn
      .map((value) => normalizeIsbn(value))
      .filter((isbn) => isbn.length === 10 || isbn.length === 13)
  );
}

function extractIsbnsFromWork(workPayload) {
  const identifiers = workPayload?.identifiers || {};
  const isbn10 = Array.isArray(identifiers.isbn_10) ? identifiers.isbn_10 : [];
  const isbn13 = Array.isArray(identifiers.isbn_13) ? identifiers.isbn_13 : [];

  return uniqueList(
    [...isbn10, ...isbn13]
      .map((value) => normalizeIsbn(value))
      .filter((isbn) => isbn.length === 10 || isbn.length === 13)
  );
}

function extractIsbnsFromEditions(editionsPayload) {
  const entries = Array.isArray(editionsPayload?.entries) ? editionsPayload.entries : [];
  const allIsbns = [];

  entries.forEach((entry) => {
    const isbn10 = Array.isArray(entry?.isbn_10) ? entry.isbn_10 : [];
    const isbn13 = Array.isArray(entry?.isbn_13) ? entry.isbn_13 : [];
    allIsbns.push(...isbn10, ...isbn13);
  });

  return uniqueList(
    allIsbns
      .map((value) => normalizeIsbn(value))
      .filter((isbn) => isbn.length === 10 || isbn.length === 13)
  );
}

function normalizeGoogleCoverUrl(value) {
  if (!value) {
    return null;
  }

  return String(value)
    .replace(/^http:\/\//i, "https://")
    .replace(/&edge=curl/i, "")
    .replace(/zoom=1/i, "zoom=2");
}

function extractImageUrlFromFirecrawl(payload) {
  const directCandidates = [
    payload?.data?.metadata?.ogImage,
    payload?.data?.metadata?.["og:image"],
    payload?.data?.metadata?.twitterImage,
    payload?.data?.image,
  ];

  const matchedDirect = directCandidates.find(Boolean);
  if (matchedDirect) {
    return matchedDirect;
  }

  const markdown = payload?.data?.markdown || payload?.markdown || "";
  const match = String(markdown).match(/https?:\/\/[^\s)"']+\.(?:png|jpg|jpeg|webp)/i);
  return match?.[0] || null;
}

async function isImageResolvable(url, env, fetchImpl) {
  if (!url) {
    return false;
  }

  try {
    const headResponse = await fetchRawRateLimited(url, { method: "HEAD" }, env, fetchImpl);
    if (headResponse.ok) {
      return true;
    }

    if (![405, 501].includes(headResponse.status)) {
      return false;
    }
  } catch {
    // Retry with GET for hosts that block HEAD.
  }

  try {
    const getResponse = await fetchRawRateLimited(
      url,
      {
        method: "GET",
        headers: { Range: "bytes=0-1" },
      },
      env,
      fetchImpl
    );
    return getResponse.ok;
  } catch {
    return false;
  }
}

async function runOpenLibrarySearchQueries({ title, author, env, fetchImpl }) {
  const normalizedTitle = normalizeTitleForLookup(title);
  const normalizedAuthor = normalizeAuthorForLookup(author);

  const queryCandidates = uniqueList([
    normalizedTitle && normalizedAuthor ? `${normalizedTitle} ${normalizedAuthor}` : null,
    normalizedTitle,
    normalizeTitleForLookup(String(title || "").replace(/\s*\([^)]*\)\s*$/u, "")),
    title,
  ]);

  const collectedDocs = [];

  for (const query of queryCandidates) {
    const endpoint = `${env.OPEN_LIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,cover_i,first_publish_year,isbn`;
    const payload = await fetchJsonRateLimited(
      endpoint,
      {
        timeoutMs: env.OPEN_LIBRARY_TIMEOUT_MS,
        retries: 0,
      },
      env,
      fetchImpl
    );

    if (Array.isArray(payload?.docs)) {
      collectedDocs.push(...payload.docs);
    }
  }

  return {
    normalizedTitle,
    normalizedAuthor,
    docs: collectedDocs,
  };
}

async function fetchWorkById(workId, env, fetchImpl) {
  if (!workId) {
    return null;
  }

  const workEndpoint = `${env.OPEN_LIBRARY_BASE_URL}/works/${workId}.json`;
  const payload = await fetchJsonRateLimited(
    workEndpoint,
    {
      timeoutMs: env.OPEN_LIBRARY_TIMEOUT_MS,
      retries: 0,
    },
    env,
    fetchImpl
  );

  return payload || null;
}

async function fetchEditionsByWorkId(workId, env, fetchImpl) {
  if (!workId) {
    return null;
  }

  const editionsEndpoint = `${env.OPEN_LIBRARY_BASE_URL}/works/${workId}/editions.json?limit=8`;
  const payload = await fetchJsonRateLimited(
    editionsEndpoint,
    {
      timeoutMs: env.OPEN_LIBRARY_TIMEOUT_MS,
      retries: 0,
    },
    env,
    fetchImpl
  );

  return payload || null;
}

async function tryGoogleBooksFallback({ title, author, env, fetchImpl }) {
  if (!env.GOOGLE_BOOKS_API_KEY) {
    return null;
  }

  const query = `intitle:${title} inauthor:${author}`;
  const endpoint = `${env.GOOGLE_BOOKS_BASE_URL}/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books&key=${encodeURIComponent(env.GOOGLE_BOOKS_API_KEY)}`;
  const payload = await fetchJsonWithRetry(endpoint, {
    timeoutMs: env.SOURCE_TIMEOUT_MS,
    retries: env.SOURCE_RETRY_ATTEMPTS,
    fetchImpl,
  });

  const items = Array.isArray(payload?.items) ? payload.items : [];
  const scored = items
    .map((item) => {
      const info = item.volumeInfo || {};
      const candidateTitle = info.title || "";
      const candidateAuthor = Array.isArray(info.authors) ? info.authors[0] : "";
      const image = normalizeGoogleCoverUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null);

      return {
        image,
        candidateTitle,
        candidateAuthor,
        titleScore: titleMatchScore(title, candidateTitle),
        authorScore: authorMatchScore(author, candidateAuthor),
      };
    })
    .filter((entry) => entry.image)
    .sort((left, right) => (right.titleScore + right.authorScore) - (left.titleScore + left.authorScore));

  const best = scored[0];
  if (!best) {
    return null;
  }

  return {
    coverUrl: best.image,
    foundAuthor: best.candidateAuthor || author,
    verifiedTitle: best.candidateTitle || title,
    authorSimilarity: best.authorScore,
    verificationSource: "googlebooks",
  };
}

function pickFirecrawlSearchUrl(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) {
    const match = data.find((entry) => typeof entry?.url === "string" && entry.url.includes("goodreads.com"));
    return match?.url || null;
  }

  if (Array.isArray(payload?.results)) {
    const match = payload.results.find((entry) => typeof entry?.url === "string" && entry.url.includes("goodreads.com"));
    return match?.url || null;
  }

  return null;
}

async function tryFirecrawlGoodreadsFallback({ title, author, env, fetchImpl }) {
  if (!env.FIRECRAWL_API_KEY) {
    return null;
  }

  const searchQuery = `site:goodreads.com "${title}" "${author}"`;
  const searchResponse = await fetchJsonWithRetry(env.FIRECRAWL_SEARCH_ENDPOINT, {
    method: "POST",
    timeoutMs: env.SOURCE_TIMEOUT_MS,
    retries: env.SOURCE_RETRY_ATTEMPTS,
    fetchImpl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      query: searchQuery,
      limit: 3,
    }),
  });

  const candidateUrl = pickFirecrawlSearchUrl(searchResponse);
  if (!candidateUrl) {
    return null;
  }

  const scrapeResponse = await fetchJsonWithRetry(env.FIRECRAWL_SCRAPE_ENDPOINT, {
    method: "POST",
    timeoutMs: env.SOURCE_TIMEOUT_MS,
    retries: env.SOURCE_RETRY_ATTEMPTS,
    fetchImpl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url: candidateUrl,
      formats: ["markdown", "html"],
      onlyMainContent: true,
    }),
  });

  const imageUrl = extractImageUrlFromFirecrawl(scrapeResponse);
  if (!imageUrl) {
    return null;
  }

  return {
    coverUrl: imageUrl,
    foundAuthor: author,
    verifiedTitle: title,
    verificationSource: "firecrawl-goodreads",
    authorSimilarity: 100,
  };
}

async function writeVerificationLog({
  supabase,
  env,
  canonicalKey,
  title,
  author,
  metadata,
  details,
}) {
  if (!supabase) {
    return {
      attemptCount: metadata.coverUrl ? 1 : 1,
      requiresManualOverride: false,
    };
  }

  const failureCount = metadata.coverUrl
    ? 0
    : await countMissingMetadataFailures(supabase, canonicalKey);
  const attemptCount = metadata.coverUrl ? 1 : failureCount + 1;
  const requiresManualOverride = !metadata.coverUrl && attemptCount >= env.METADATA_FAILURE_THRESHOLD;

  await insertMissingMetadataLog(supabase, {
    canonicalKey,
    title,
    author,
    status: metadata.verificationSource === "manual_override"
      ? "manual_override"
      : metadata.coverUrl
        ? "success"
        : "failed",
    attemptCount,
    authorSimilarity: metadata.authorSimilarity || null,
    verificationSource: metadata.verificationSource,
    coverUrl: metadata.coverUrl,
    requiresManualOverride,
    resolved: Boolean(metadata.coverUrl),
    phtTimeZone: env.PHT_TIMEZONE,
    details,
  });

  return {
    attemptCount,
    requiresManualOverride,
  };
}

async function tripleCheckVerification({
  title,
  author,
  env,
  fetchImpl,
}) {
  const searchResults = await runOpenLibrarySearchQueries({ title, author, env, fetchImpl });
  const best = pickBestOpenLibraryDoc(searchResults.docs, title, author);

  const fallbackBase = {
    coverUrl: null,
    foundAuthor: author || "Unknown",
    verifiedTitle: title,
    publishedYear: null,
    authorSimilarity: best?.authorScore || 0,
    verificationSource: "unresolved",
  };

  if (!best) {
    return {
      ...fallbackBase,
      details: {
        reason: "no-openlibrary-match",
        normalizedTitle: searchResults.normalizedTitle,
        normalizedAuthor: searchResults.normalizedAuthor,
      },
    };
  }

  const workId = extractWorkId(best.doc.key);
  const needsSecondarySearch = best.authorScore < env.AUTHOR_SIMILARITY_THRESHOLD;

  const primaryCoverUrl = coverByIdUrl(best.doc.cover_i);
  if (primaryCoverUrl && await isImageResolvable(primaryCoverUrl, env, fetchImpl)) {
    return {
      coverUrl: primaryCoverUrl,
      foundAuthor: best.doc.author_name?.[0] || author || "Unknown",
      verifiedTitle: best.doc.title || title,
      publishedYear: best.doc.first_publish_year || null,
      authorSimilarity: best.authorScore,
      verificationSource: "openlibrary-search",
      details: {
        workId,
        needsSecondarySearch,
      },
    };
  }

  const workPayload = await fetchWorkById(workId, env, fetchImpl);
  const workCoverUrl = coverByIdUrl(workPayload?.covers?.[0]);
  if (workCoverUrl && await isImageResolvable(workCoverUrl, env, fetchImpl)) {
    return {
      coverUrl: workCoverUrl,
      foundAuthor: best.doc.author_name?.[0] || author || "Unknown",
      verifiedTitle: workPayload?.title || best.doc.title || title,
      publishedYear: best.doc.first_publish_year || null,
      authorSimilarity: best.authorScore,
      verificationSource: "openlibrary-work-cover",
      details: {
        workId,
        needsSecondarySearch,
      },
    };
  }

  const editionsPayload = await fetchEditionsByWorkId(workId, env, fetchImpl);
  const isbnCandidates = uniqueList([
    ...extractIsbnsFromSearchDoc(best.doc),
    ...extractIsbnsFromWork(workPayload),
    ...extractIsbnsFromEditions(editionsPayload),
  ]);

  for (const isbn of isbnCandidates) {
    const isbnCoverUrl = coverByIsbnUrl(isbn);
    if (isbnCoverUrl && await isImageResolvable(isbnCoverUrl, env, fetchImpl)) {
      return {
        coverUrl: isbnCoverUrl,
        foundAuthor: best.doc.author_name?.[0] || author || "Unknown",
        verifiedTitle: workPayload?.title || best.doc.title || title,
        publishedYear: best.doc.first_publish_year || null,
        authorSimilarity: best.authorScore,
        verificationSource: "openlibrary-isbn",
        details: {
          workId,
          isbn,
          needsSecondarySearch,
        },
      };
    }
  }

  const googleFallback = await tryGoogleBooksFallback({ title, author, env, fetchImpl });
  if (googleFallback?.coverUrl && await isImageResolvable(googleFallback.coverUrl, env, fetchImpl)) {
    return {
      ...googleFallback,
      publishedYear: best.doc.first_publish_year || null,
      details: {
        workId,
        needsSecondarySearch,
      },
    };
  }

  const firecrawlFallback = await tryFirecrawlGoodreadsFallback({ title, author, env, fetchImpl });
  if (firecrawlFallback?.coverUrl && await isImageResolvable(firecrawlFallback.coverUrl, env, fetchImpl)) {
    return {
      ...firecrawlFallback,
      publishedYear: best.doc.first_publish_year || null,
      details: {
        workId,
        needsSecondarySearch,
      },
    };
  }

  return {
    ...fallbackBase,
    foundAuthor: best.doc.author_name?.[0] || author || "Unknown",
    verifiedTitle: best.doc.title || title,
    publishedYear: best.doc.first_publish_year || null,
    authorSimilarity: best.authorScore,
    details: {
      workId,
      needsSecondarySearch,
      isbnCandidateCount: isbnCandidates.length,
      reason: "all-fallbacks-exhausted",
    },
  };
}

async function refreshEntry({ title, author, canonicalKey, env, cache, supabase, fetchImpl, logger }) {
  const metadata = await tripleCheckVerification({
    title,
    author,
    env,
    fetchImpl,
  });

  const logging = await writeVerificationLog({
    supabase,
    env,
    canonicalKey,
    title,
    author,
    metadata,
    details: metadata.details || {},
  });

  const finalMetadata = {
    coverUrl: metadata.coverUrl,
    foundAuthor: metadata.foundAuthor,
    publishedYear: metadata.publishedYear,
    verifiedTitle: metadata.verifiedTitle,
    verificationSource: metadata.verificationSource,
    authorSimilarity: metadata.authorSimilarity,
    attemptCount: logging.attemptCount,
    requiresManualOverride: logging.requiresManualOverride,
  };

  const envelope = cacheEnvelope(finalMetadata, env);
  await cache.setJson(`openlibrary:${canonicalKey}`, envelope, env.SWR_STALE_SECONDS);
  logger(`Metadata verification refreshed for ${canonicalKey} via ${metadata.verificationSource}`);
  return finalMetadata;
}

export async function resolveOpenLibraryMetadata({
  title,
  author,
  canonicalKey,
  env,
  cache,
  supabase,
  logger = () => {},
  fetchImpl = fetch,
}) {
  const key = `openlibrary:${canonicalKey}`;

  try {
    if (supabase) {
      const override = await getCoverOverrideByCanonicalKey(supabase, canonicalKey);
      if (override?.cover_url) {
        const metadata = {
          coverUrl: override.cover_url,
          foundAuthor: override.author || author || "Unknown",
          publishedYear: null,
          verifiedTitle: override.title || title,
          verificationSource: "manual_override",
          authorSimilarity: 100,
          attemptCount: 1,
          requiresManualOverride: false,
        };

        const envelope = cacheEnvelope(metadata, env);
        await cache.setJson(key, envelope, env.SWR_STALE_SECONDS);

        await writeVerificationLog({
          supabase,
          env,
          canonicalKey,
          title,
          author,
          metadata,
          details: {
            source: "admin-override",
          },
        });

        return {
          ...metadata,
          cacheStatus: "override",
        };
      }
    }

    const cached = await cache.getJson(key);

    if (isFresh(cached)) {
      return {
        ...cached.data,
        cacheStatus: "fresh",
      };
    }

    if (isStaleButUsable(cached)) {
      refreshEntry({ title, author, canonicalKey, env, cache, supabase, fetchImpl, logger }).catch((error) => {
        logger(`Background metadata refresh failed for ${canonicalKey}: ${error.message}`);
      });

      return {
        ...cached.data,
        cacheStatus: "stale",
      };
    }

    const metadata = await refreshEntry({
      title,
      author,
      canonicalKey,
      env,
      cache,
      supabase,
      fetchImpl,
      logger,
    });

    return {
      ...metadata,
      cacheStatus: "miss",
    };
  } catch (error) {
    const cached = await cache.getJson(key);
    if (cached?.data) {
      logger(`Metadata miss failed for ${canonicalKey}; serving stale cache`);
      return {
        ...cached.data,
        cacheStatus: "stale-fallback",
      };
    }

    logger(`Metadata verification failed without cache for ${canonicalKey}: ${error.message}`);
    return {
      coverUrl: null,
      foundAuthor: author || "Unknown",
      publishedYear: null,
      verifiedTitle: title,
      verificationSource: "error",
      authorSimilarity: 0,
      attemptCount: 1,
      requiresManualOverride: false,
      cacheStatus: "unavailable",
    };
  }
}
