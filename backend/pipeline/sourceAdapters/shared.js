import { fetchJsonWithRetry } from "../../core/http.js";
import { sanitizeExternalBookRecord } from "../../security/sanitize.js";

function parseRecordsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

export async function fetchSourceRecords({
  sourceName,
  endpoint,
  apiToken,
  timeoutMs,
  retries,
  logger,
  fetchImpl = fetch,
}) {
  const payload = await fetchJsonWithRetry(endpoint, {
    method: "GET",
    timeoutMs,
    retries,
    fetchImpl,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
  });

  const rawRecords = parseRecordsFromPayload(payload);
  const sanitized = rawRecords
    .map((entry) => sanitizeExternalBookRecord(entry, sourceName))
    .filter((entry) => entry.mentions24h > 0);

  logger(`Source ${sourceName} yielded ${sanitized.length} sanitized records`);
  return sanitized;
}
