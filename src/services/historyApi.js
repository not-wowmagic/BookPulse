export async function fetchBookHistory(canonicalKey, { signal, days = 30 } = {}) {
  if (!canonicalKey) throw new TypeError("A canonical book key is required");
  const response = await fetch(`/api/books/${encodeURIComponent(canonicalKey)}/history?days=${days}`, {
    headers: { Accept: "application/json" }, signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `History API returned ${response.status}`);
  return payload;
}

export async function fetchSourceHealth({ signal } = {}) {
  const response = await fetch("/api/source-health", { headers: { Accept: "application/json" }, signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Source health is unavailable");
  return payload;
}

export async function fetchBreakouts({ signal, limit = 10 } = {}) {
  const response = await fetch(`/api/breakouts?limit=${limit}`, { headers: { Accept: "application/json" }, signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Breakout Radar is unavailable");
  return payload;
}
