const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeSignals(externalSignal, timeoutSignal) {
  if (!externalSignal) {
    return timeoutSignal;
  }

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([externalSignal, timeoutSignal]);
  }

  if (externalSignal.aborted) {
    return externalSignal;
  }

  return timeoutSignal;
}

function shouldRetry(error, responseStatus) {
  if (responseStatus && RETRYABLE_STATUS.has(responseStatus)) {
    return true;
  }

  if (error?.name === "AbortError") {
    return true;
  }

  const text = String(error?.message || "").toLowerCase();
  return text.includes("timeout") || text.includes("network");
}

export async function fetchJsonWithRetry(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 5000,
    retries = 2,
    baseDelayMs = 200,
    jitterMs = 120,
    signal,
    fetchImpl = fetch,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(new Error("Request timeout")), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method,
        headers,
        body,
        signal: mergeSignals(signal, timeoutController.signal),
      });

      if (!response.ok) {
        const responseText = await response.text();
        const statusError = new Error(
          `HTTP ${response.status} calling ${url}: ${responseText.slice(0, 400)}`
        );
        statusError.status = response.status;

        if (!shouldRetry(statusError, response.status) || attempt === retries) {
          throw statusError;
        }

        lastError = statusError;
      } else {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return await response.json();
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error, error?.status) || attempt === retries) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const jitter = Math.floor(Math.random() * jitterMs);
    const backoff = baseDelayMs * (2 ** attempt) + jitter;
    await sleep(backoff);
  }

  throw lastError || new Error(`Unexpected fetch retry failure for ${url}`);
}
