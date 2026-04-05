import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeExternalBookRecord } from "../security/sanitize.js";

test("sanitizeExternalBookRecord strips HTML and normalizes metrics", () => {
  const result = sanitizeExternalBookRecord(
    {
      title: "<script>alert(1)</script> Fourth Wing",
      author: "Rebecca <b>Yarros</b>",
      mentions: "1234.9",
      sourceUrl: "https://example.com/post/1",
    },
    "TikTok"
  );

  assert.equal(result.title.includes("script"), false);
  assert.equal(result.title.includes("Fourth Wing"), true);
  assert.equal(result.author.includes("<"), false);
  assert.equal(result.mentions24h, 1234);
  assert.equal(result.source, "tiktok");
  assert.match(result.capturedAtUtc, /^\d{4}-\d{2}-\d{2}T/);
});

test("sanitizeExternalBookRecord rejects empty title after sanitization", () => {
  assert.throws(
    () =>
      sanitizeExternalBookRecord(
        {
          title: "<b>  </b>",
          author: "Any",
          mentions: 22,
        },
        "reddit"
      ),
    /Sanitized title is empty/
  );
});
