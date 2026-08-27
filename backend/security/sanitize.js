import { toUtcIso } from "../core/time.js";

function cleanText(value, maxLength) {
  return [...String(value ?? "").normalize("NFKC")].map((character) => {
    const code = character.charCodeAt(0); return code <= 31 || code === 127 ? " " : character;
  }).join("").replace(/<[^>]*>/g, " ").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
function metric(record) {
  for (const candidate of [record.mentions24h, record.mentions, record.discussions, record.reviews]) {
    if (candidate === undefined) continue;
    const parsed = Number(candidate); if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return 0;
}
export function sanitizeExternalBookRecord(rawRecord, sourceName) {
  if (!rawRecord || typeof rawRecord !== "object" || typeof rawRecord.title !== "string" || !rawRecord.title) throw new TypeError("External book title is required");
  const title = cleanText(rawRecord.title, 180); const author = cleanText(rawRecord.author || "Unknown", 120) || "Unknown"; const source = cleanText(sourceName, 40).toLowerCase();
  if (!title) throw new Error("Sanitized title is empty");
  if (!source) throw new Error("Source name is required");
  if (rawRecord.sourceUrl) { try { new URL(rawRecord.sourceUrl); } catch { throw new TypeError("Invalid source URL"); } }
  return Object.freeze({ title, author, source, mentions24h: metric(rawRecord), sourceUrl: rawRecord.sourceUrl || null, capturedAtUtc: rawRecord.capturedAtUtc ? toUtcIso(rawRecord.capturedAtUtc) : toUtcIso(new Date(Math.floor(Date.now() / 900_000) * 900_000)) });
}
export function sanitizeFreeText(rawText, maxLength = 400) { return cleanText(rawText, maxLength); }
