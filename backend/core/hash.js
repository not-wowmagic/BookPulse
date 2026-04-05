function normalizeToken(rawValue) {
  return String(rawValue ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalBookKey(title, author) {
  const normalizedTitle = normalizeToken(title);
  const normalizedAuthor = normalizeToken(author);

  if (!normalizedTitle) {
    throw new Error("canonicalBookKey() requires title");
  }

  return `${normalizedTitle}::${normalizedAuthor || "unknown"}`;
}

export function normalizedText(rawValue) {
  return normalizeToken(rawValue);
}
