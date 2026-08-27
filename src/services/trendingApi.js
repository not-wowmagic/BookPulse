const SOURCE_LABELS = Object.freeze({ tiktok: "TikTok", reddit: "Reddit", goodreads: "Goodreads" });

export function normalizeTrendingResponse(payload) {
  const books = Array.isArray(payload?.books) ? payload.books.map((book) => ({
    ...book,
    id: book.canonicalKey,
    mentions: Number(book.mentions24h || 0),
    platformCount: Number(book.sourceCount || book.sources?.length || 0),
    isConvergent: Number(book.sourceCount || book.sources?.length || 0) >= 2,
    sources: (book.sources || []).map((source) => SOURCE_LABELS[source] || source),
  })) : [];
  const hasSource = (book, source) => book.sources.some(
    (entry) => entry.toLowerCase() === SOURCE_LABELS[source].toLowerCase()
  );

  return {
    status: payload?.status || "error",
    mode: payload?.mode || "production",
    generatedAtUtc: payload?.generatedAtUtc || null,
    lastUpdatedPht: payload?.lastUpdatedPht || null,
    message: payload?.message || null,
    books,
    booktokph: books.filter((book) => hasSource(book, "tiktok")),
    phbookclub: books.filter((book) => hasSource(book, "reddit")),
    goodreads: books.filter((book) => hasSource(book, "goodreads")),
  };
}

export async function fetchTrending({ signal } = {}) {
  const response = await fetch("/api/trending", { headers: { Accept: "application/json" }, signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 503) {
    throw new Error(payload.message || `Trending API returned ${response.status}`);
  }
  return normalizeTrendingResponse(payload);
}
