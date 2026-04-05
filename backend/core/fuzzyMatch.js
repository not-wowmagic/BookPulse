function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripDiacritics(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function removeSubtitleSegments(value) {
  let normalized = value;

  // Remove explicit subtitle separators.
  normalized = normalized.replace(/\s*[:|\u2013\u2014-]\s+.*$/u, "");

  // Remove trailing series markers: (Book 1), [Vol. 2], #3.
  normalized = normalized.replace(/\s*\((book|vol\.?|volume|series|#)\s*\d+[^)]*\)\s*$/iu, "");
  normalized = normalized.replace(/\s*\[(book|vol\.?|volume|series|#)\s*\d+[^\]]*\]\s*$/iu, "");
  normalized = normalized.replace(/\s+#\d+\s*$/u, "");

  return normalized;
}

export function normalizeTitleForLookup(rawTitle) {
  const source = String(rawTitle ?? "");
  const stripped = removeSubtitleSegments(source);

  return normalizeWhitespace(
    stripDiacritics(stripped)
      .toLowerCase()
      .replace(/<[^>]*>/g, " ")
      .replace(/[^a-z0-9' ]/g, " ")
  );
}

export function normalizeAuthorForLookup(rawAuthor) {
  return normalizeWhitespace(
    stripDiacritics(String(rawAuthor ?? ""))
      .toLowerCase()
      .replace(/<[^>]*>/g, " ")
      .replace(/[^a-z0-9' ]/g, " ")
  );
}

export function levenshteinDistance(leftRaw, rightRaw) {
  const left = String(leftRaw ?? "");
  const right = String(rightRaw ?? "");

  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = new Array(right.length + 1);
  const current = new Array(right.length + 1);

  for (let index = 0; index <= right.length; index += 1) {
    previous[index] = index;
  }

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

export function similarityPercent(leftRaw, rightRaw) {
  const left = normalizeWhitespace(String(leftRaw ?? "").toLowerCase());
  const right = normalizeWhitespace(String(rightRaw ?? "").toLowerCase());

  if (!left && !right) {
    return 100;
  }

  if (!left || !right) {
    return 0;
  }

  const distance = levenshteinDistance(left, right);
  const denominator = Math.max(left.length, right.length);
  if (!denominator) {
    return 100;
  }

  return Math.max(0, (1 - distance / denominator) * 100);
}

export function authorMatchScore(expectedAuthor, candidateAuthor) {
  const expected = normalizeAuthorForLookup(expectedAuthor);
  const candidate = normalizeAuthorForLookup(candidateAuthor);

  if (!expected || !candidate) {
    return 0;
  }

  const fullScore = similarityPercent(expected, candidate);

  const expectedLastToken = expected.split(" ").filter(Boolean).at(-1) || expected;
  const candidateLastToken = candidate.split(" ").filter(Boolean).at(-1) || candidate;
  const surnameScore = similarityPercent(expectedLastToken, candidateLastToken);

  return (fullScore * 0.7) + (surnameScore * 0.3);
}

export function titleMatchScore(expectedTitle, candidateTitle) {
  const expected = normalizeTitleForLookup(expectedTitle);
  const candidate = normalizeTitleForLookup(candidateTitle);
  return similarityPercent(expected, candidate);
}
