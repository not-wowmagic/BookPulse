import { z } from "zod";

const POSITIVE_INT = z
  .coerce
  .number()
  .int()
  .positive();

const NON_NEGATIVE_INT = z
  .coerce
  .number()
  .int()
  .nonnegative();

const PERCENT = z
  .coerce
  .number()
  .min(0)
  .max(100);

const BOOLEAN_FROM_TEXT = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off", ""].includes(normalized)) {
      return false;
    }

    throw new Error(`Invalid boolean value: ${value}`);
  });

const BASE_SCHEMA = z.object({
  BOOKPULSE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  BOOKPULSE_MODE: z.enum(["demo", "production"]).default("demo"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),

  REDIS_URL: z.string().url().optional(),
  REDIS_REST_URL: z.string().url().optional(),
  REDIS_REST_TOKEN: z.string().min(1).optional(),

  CRON_SECRET: z.string().min(24),

  OPEN_LIBRARY_BASE_URL: z.string().url().default("https://openlibrary.org"),
  OPEN_LIBRARY_TIMEOUT_MS: POSITIVE_INT.default(3500),
  OPENLIBRARY_MIN_CALL_INTERVAL_MS: POSITIVE_INT.default(1000),
  SOURCE_TIMEOUT_MS: POSITIVE_INT.default(5000),
  SOURCE_RETRY_ATTEMPTS: NON_NEGATIVE_INT.default(2),
  AUTHOR_SIMILARITY_THRESHOLD: PERCENT.default(85),
  METADATA_FAILURE_THRESHOLD: POSITIVE_INT.default(3),

  GOOGLE_BOOKS_BASE_URL: z.string().url().default("https://www.googleapis.com/books/v1"),
  GOOGLE_BOOKS_API_KEY: z.string().min(1).optional(),

  FIRECRAWL_SEARCH_ENDPOINT: z.string().url().default("https://api.firecrawl.dev/v1/search"),
  FIRECRAWL_SCRAPE_ENDPOINT: z.string().url().default("https://api.firecrawl.dev/v1/scrape"),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),

  SWR_FRESH_SECONDS: POSITIVE_INT.default(21600),
  SWR_STALE_SECONDS: POSITIVE_INT.default(259200),

  LOCK_TTL_SECONDS: POSITIVE_INT.default(900),

  INGEST_REQUIRED_SOURCES: z.string().default("tiktok,reddit,goodreads"),
  PHT_TIMEZONE: z.string().default("Asia/Manila"),

  ALLOW_DEMO_SOURCES: BOOLEAN_FROM_TEXT.default(false),

  TIKTOK_TRENDS_ENDPOINT: z.string().url().optional(),
  TIKTOK_API_TOKEN: z.string().min(1).optional(),

  REDDIT_TRENDS_ENDPOINT: z.string().url().optional(),
  REDDIT_API_TOKEN: z.string().min(1).optional(),

  GOODREADS_TRENDS_ENDPOINT: z.string().url().optional(),
  GOODREADS_API_TOKEN: z.string().min(1).optional(),

  ADMIN_EDIT_TOKEN: z.string().min(24).optional(),
});

const EDGE_SCHEMA = BASE_SCHEMA.superRefine((value, ctx) => {
  if (!value.SUPABASE_ANON_KEY && !value.SUPABASE_SERVICE_ROLE_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required for edge reads",
      path: ["SUPABASE_ANON_KEY"],
    });
  }
});

const NODE_SCHEMA = BASE_SCHEMA.superRefine((value, ctx) => {
  if (value.BOOKPULSE_MODE === "production") {
    const required = [
      ["TIKTOK_TRENDS_ENDPOINT", value.TIKTOK_TRENDS_ENDPOINT],
      ["TIKTOK_API_TOKEN", value.TIKTOK_API_TOKEN],
      ["REDDIT_TRENDS_ENDPOINT", value.REDDIT_TRENDS_ENDPOINT],
      ["REDDIT_API_TOKEN", value.REDDIT_API_TOKEN],
      ["GOODREADS_TRENDS_ENDPOINT", value.GOODREADS_TRENDS_ENDPOINT],
      ["GOODREADS_API_TOKEN", value.GOODREADS_API_TOKEN],
    ];

    required.forEach(([key, entry]) => {
      if (!entry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when BOOKPULSE_MODE=production`,
          path: [key],
        });
      }
    });

    if (!value.ADMIN_EDIT_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ADMIN_EDIT_TOKEN is required when BOOKPULSE_MODE=production",
        path: ["ADMIN_EDIT_TOKEN"],
      });
    }
  }

  if (value.SWR_STALE_SECONDS <= value.SWR_FRESH_SECONDS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SWR_STALE_SECONDS must be greater than SWR_FRESH_SECONDS",
      path: ["SWR_STALE_SECONDS"],
    });
  }
});

let cachedNodeEnv;
let cachedEdgeEnv;

function parseRequiredSources(rawList) {
  return rawList
    .split(",")
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);
}

function parseSchema(schema, source) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Environment validation failed: ${formatted}`);
  }

  return {
    ...parsed.data,
    INGEST_REQUIRED_SOURCES_ARRAY: parseRequiredSources(parsed.data.INGEST_REQUIRED_SOURCES),
  };
}

export function getNodeEnv(source = process.env) {
  if (!cachedNodeEnv) {
    cachedNodeEnv = parseSchema(NODE_SCHEMA, source);
  }
  return cachedNodeEnv;
}

export function getEdgeEnv(source = process.env) {
  if (!cachedEdgeEnv) {
    cachedEdgeEnv = parseSchema(EDGE_SCHEMA, source);
  }
  return cachedEdgeEnv;
}

export function resetCachedEnvForTests() {
  cachedNodeEnv = undefined;
  cachedEdgeEnv = undefined;
}
