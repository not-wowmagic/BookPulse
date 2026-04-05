import { canonicalBookKey } from "../../backend/core/hash.js";
import { getNodeEnv } from "../../backend/config/env.js";
import { getSupabaseAdminClient } from "../../backend/gateways/supabase.js";
import { sanitizeFreeText } from "../../backend/security/sanitize.js";
import {
  applyCoverOverrideToBook,
  getCoverOverrideByCanonicalKey,
  upsertCoverOverride,
} from "../../backend/repository/metadataRepairRepository.js";

export const config = {
  runtime: "nodejs",
};

function parseAuthToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.headers["x-admin-token"] || "";
}

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

/**
 * Pre-Flight Checklist (verified in this handler)
 * 1) Access requires ADMIN_EDIT_TOKEN and is rejected without explicit auth.
 * 2) Cover override writes are sanitized before database updates.
 * 3) Override writes can be applied directly to books for immediate read-model consistency.
 * 4) This endpoint is for manual recovery after repeated metadata verification failures.
 */
export default async function coverOverrideHandler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const env = getNodeEnv();
    const authToken = parseAuthToken(req);

    if (!env.ADMIN_EDIT_TOKEN || authToken !== env.ADMIN_EDIT_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = getSupabaseAdminClient(env);

    if (req.method === "GET") {
      const canonicalKey = sanitizeFreeText(req.query?.canonicalKey || "", 220);
      if (!canonicalKey) {
        return res.status(400).json({ error: "canonicalKey query is required" });
      }

      const existing = await getCoverOverrideByCanonicalKey(supabase, canonicalKey);
      return res.status(200).json({
        status: "ok",
        override: existing,
      });
    }

    const body = parseBody(req);
    const title = sanitizeFreeText(body.title || "", 180);
    const author = sanitizeFreeText(body.author || "Unknown", 120) || "Unknown";
    const coverUrl = sanitizeFreeText(body.coverUrl || "", 500);
    const notes = sanitizeFreeText(body.notes || "", 400);

    if (!title || !coverUrl || !/^https?:\/\//i.test(coverUrl)) {
      return res.status(400).json({
        error: "title and a valid coverUrl are required",
      });
    }

    const canonicalKey = sanitizeFreeText(
      body.canonicalKey || canonicalBookKey(title, author),
      220
    );

    const saved = await upsertCoverOverride(supabase, {
      canonicalKey,
      title,
      author,
      coverUrl,
      notes,
      createdBy: sanitizeFreeText(body.createdBy || "admin", 80),
    });

    const applied = await applyCoverOverrideToBook(supabase, {
      canonicalKey,
      coverUrl,
      metadata: {
        coverOverrideNotes: notes,
        verificationSource: "manual_override",
      },
    });

    return res.status(200).json({
      status: "ok",
      override: saved,
      appliedToBook: Boolean(applied),
    });
  } catch (error) {
    return res.status(500).json({
      error: "cover override failed",
      detail: error.message,
    });
  }
}
