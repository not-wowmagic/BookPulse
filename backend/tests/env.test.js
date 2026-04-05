import test from "node:test";
import assert from "node:assert/strict";
import { getNodeEnv, resetCachedEnvForTests } from "../config/env.js";

const BASE_ENV = {
  BOOKPULSE_ENV: "development",
  BOOKPULSE_MODE: "demo",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  SUPABASE_ANON_KEY: "anon-test-key",
  CRON_SECRET: "this-is-a-very-long-test-secret-123456",
  ALLOW_DEMO_SOURCES: "true",
};

test("getNodeEnv validates and normalizes required values", () => {
  resetCachedEnvForTests();
  const env = getNodeEnv(BASE_ENV);

  assert.equal(env.BOOKPULSE_MODE, "demo");
  assert.equal(env.ALLOW_DEMO_SOURCES, true);
  assert.deepEqual(env.INGEST_REQUIRED_SOURCES_ARRAY, ["tiktok", "reddit", "goodreads"]);
});

test("getNodeEnv fails when stale window is not larger than fresh window", () => {
  resetCachedEnvForTests();

  assert.throws(
    () =>
      getNodeEnv({
        ...BASE_ENV,
        SWR_FRESH_SECONDS: "120",
        SWR_STALE_SECONDS: "120",
      }),
    /SWR_STALE_SECONDS must be greater than SWR_FRESH_SECONDS/
  );
});
