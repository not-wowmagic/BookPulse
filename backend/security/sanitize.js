import { z } from "zod";
import { toUtcIso } from "../core/time.js";

const RAW_BOOK_SCHEMA = z.object({
  title: z.string().min(1),
  author: z.string().min(1).optional().default("Unknown"),
  mentions: z.union([z.number(), z.string()]).optional(),
  mentions24h: z.union([z.number(), z.string()]).optional(),
  discussions: z.union([z.number(), z.string()]).optional(),
  reviews: z.union([z.number(), z.string()]).optional(),
  sourceUrl: z.string().url().optional(),
  capturedAtUtc: z.string().datetime().optional(),
});

function stripControlCharacters(text) {
  return [...text]
    .map((character) => {
      const code = character.charCodeAt(0);
      if (code <= 31 || code === 127) {
        return " ";
      }
      return character;
    })
    .join("");
}

function cleanText(value, maxLength) {
  return stripControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parseMetric(record) {
  const candidates = [record.mentions24h, record.mentions, record.discussions, record.reviews];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return 0;
}

export function sanitizeExternalBookRecord(rawRecord, sourceName) {
  const parsed = RAW_BOOK_SCHEMA.parse(rawRecord);

  const title = cleanText(parsed.title, 180);
  const author = cleanText(parsed.author || "Unknown", 120) || "Unknown";
  const source = cleanText(sourceName, 40).toLowerCase();

  if (!title) {
    throw new Error("Sanitized title is empty");
  }

  if (!source) {
    throw new Error("Source name is required");
  }

  return Object.freeze({
    title,
    author,
    source,
    mentions24h: parseMetric(parsed),
    sourceUrl: parsed.sourceUrl || null,
    capturedAtUtc: parsed.capturedAtUtc ? toUtcIso(parsed.capturedAtUtc) : toUtcIso(new Date()),
  });
}

export function sanitizeFreeText(rawText, maxLength = 400) {
  return cleanText(rawText, maxLength);
}
