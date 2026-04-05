import test from "node:test";
import assert from "node:assert/strict";
import {
  authorMatchScore,
  levenshteinDistance,
  normalizeTitleForLookup,
  similarityPercent,
  titleMatchScore,
} from "../core/fuzzyMatch.js";

test("normalizeTitleForLookup strips subtitles and series tokens", () => {
  const normalized = normalizeTitleForLookup("The Housemaid: A Thriller (Book 1)");
  assert.equal(normalized, "the housemaid");
});

test("authorMatchScore remains high for minor spelling variation", () => {
  const score = authorMatchScore("Rebecca Yarros", "Rebeka Yarros");
  assert.ok(score >= 85);
});

test("authorMatchScore is low for mismatched author", () => {
  const score = authorMatchScore("Rebecca Yarros", "Sarah J. Maas");
  assert.ok(score < 85);
});

test("titleMatchScore handles punctuation differences", () => {
  const score = titleMatchScore("Sunrise on the Reaping", "Sunrise-on the Reaping!");
  assert.ok(score >= 95);
});

test("levenshteinDistance and similarityPercent are stable", () => {
  assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  const similarity = similarityPercent("kitten", "sitting");
  assert.ok(similarity > 50 && similarity < 60);
});
