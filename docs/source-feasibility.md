# Goodreads and TikTok source feasibility

**Assessment date:** 2026-08-27  
**Scope:** authorized, maintainable collection of Philippines-first book-attention signals for BookPulse  
**Evidence standard:** provider-owned documentation only. Links below are the authoritative pages that must be rechecked before an integration is enabled because access programs, quotas, and terms can change.

## Executive decision

| Provider | Classification | Production decision |
| --- | --- | --- |
| Goodreads | **Not currently viable** | Do not collect Goodreads shelves, ratings, reviews, or activity. Goodreads does not issue new public API credentials, and its former API is not a supported foundation for a new production integration. |
| TikTok | **Viable only through provider approval or an approved third-party provider** | Keep TikTok unconfigured in production. Apply for an appropriate TikTok access program only if BookPulse and its operator satisfy that program's eligibility and use restrictions; otherwise evaluate a separately contracted, terms-compliant data provider. Do not scrape TikTok. |

These classifications concern trend ingestion, not cover or bibliographic metadata. Neither provider should contribute demo observations to a production snapshot. An unavailable source is missing—not zero—and should be reported as `not configured` or `unavailable` by source health.

## Evaluation criteria

For a source to be viable, BookPulse needs authorization to discover public records beyond a single consenting user's account, stable provider record identifiers and timestamps, bounded pagination, documented engagement fields, reproducible queries, and terms that permit the intended product use. A catalog lookup alone is not a trend signal. A ranking page visible to a human is not, by itself, permission to automate collection.

## Goodreads

### Official evidence

1. The [Goodreads API developer page](https://www.goodreads.com/api) states that Goodreads is no longer issuing new developer keys. Consequently, a new BookPulse deployment cannot obtain ordinary credentials through a documented self-service path.
2. The same page describes the legacy API and links its [API terms of use](https://www.goodreads.com/api/terms). A legacy interface and terms page do not establish that a new application may receive access or that an old key may be transferred to BookPulse.
3. Goodreads' [Developer Terms of Service](https://www.goodreads.com/api/terms) govern permitted API use. Any exceptional or partner access would require written confirmation that BookPulse's storage, analytics, attribution, and display behavior are allowed.

### Capability assessment

| Question | Finding |
| --- | --- |
| Authorized API for this use case | No generally available route for a new developer key. Existing legacy credentials, if any, must not be assumed transferable or production-supported. |
| Philippines-specific signal | No official developer documentation establishes a Philippines-filtered trend, shelf, review, or activity stream suitable for BookPulse. User locale or membership cannot safely be inferred as Philippine attention. |
| Authentication | Legacy API key/OAuth behavior exists in historical documentation, but new keys are not issued. BookPulse has no basis to ship against unavailable credentials. |
| Rate limits | No current, generally available quota is documented for a new integration. This is a blocker, not permission to probe or scrape. |
| Accessible fields | Legacy book, shelf, rating, and review capabilities are not equivalent to an authorized current trend feed. Public aggregate rating/review totals would be cumulative signals, not interval mentions. |
| Timestamp quality | No available official contract provides a reproducible Philippines-specific observation stream with provider event timestamps. A BookPulse capture time would not repair that limitation. |
| Reproducibility | Poor for the required use case: no new credential path, no geographic contract, and no documented stable trend query. |
| Compliance and maintenance | Unsupported HTML or RSS collection would be brittle and is outside this assessment. BookPulse must not implement it as a substitute for API authorization. |

### Classification and extension seam

**Not currently viable.** Production should expose Goodreads as unavailable rather than fabricate review counts or import demo values. The existing adapter boundary may remain, but it should fail closed unless Goodreads supplies BookPulse with documented partner access and written terms appropriate to trend analytics.

Reassessment requires all of the following:

- provider-issued credentials assigned to the BookPulse operator;
- a current API specification and quota;
- written confirmation that the planned collection, retention, derived scoring, and public display are permitted;
- a defensible Philippines scope or an explicit global/non-geographic label;
- stable IDs and timestamp semantics sufficient for idempotent observations.

If access later becomes valid, signal types must remain distinct. For example, an aggregate `ratings_count` or `text_reviews_count` is a **cumulative count captured at a point in time**, while a shelf event would be an **event/interval signal**. They must not be summed as interchangeable “mentions.”

## TikTok

### Official evidence

1. TikTok describes its [Research API](https://developers.tiktok.com/products/research-api/) as access for qualifying researchers and requires an application and approval; it is not a general commercial content-discovery API.
2. The [Research API getting-started guide](https://developers.tiktok.com/doc/research-api-get-started) defines the application, project, client, and token setup that an approved researcher must complete.
3. The [Research API FAQ](https://developers.tiktok.com/doc/research-api-faq) documents program eligibility, review, data availability, and operational limitations. Eligibility and the approved research purpose must be confirmed rather than inferred from public-video visibility.
4. The official [video query specification](https://developers.tiktok.com/doc/research-api-specs-query-videos) supports bounded queries and cursor pagination and documents selectable video fields, including stable video IDs, creation time, region code, descriptions/hashtags, and engagement counters where available.
5. TikTok's [Research API codebook](https://developers.tiktok.com/doc/research-api-codebook) defines returned fields and their meanings. Engagement counters are distinct cumulative measures and must remain separate signal types.
6. TikTok's [Research API rate-limit documentation](https://developers.tiktok.com/doc/research-api-rate-limits) defines enforced request/data quotas for approved clients. Implementation must read the current limits from this page and response headers at integration time rather than hard-code an assumption from this assessment.
7. The [Display API overview](https://developers.tiktok.com/products/display-api/) concerns an authorized user's profile and videos. It does not provide corpus-wide hashtag search for measuring BookTokPH.
8. TikTok's [developer terms](https://www.tiktok.com/legal/page/global/tik-tok-developer-terms-of-service/en) apply to developer products, and the Research Tools terms linked by the Research API materials govern approved research access. Approval for one purpose must not be treated as permission for another.

### Capability assessment

| Question | Finding |
| --- | --- |
| Authorized API for this use case | Potentially the Research API, but only after provider approval and only within the approved research purpose. The ordinary Display API is insufficient for platform-wide BookTokPH discovery. |
| Philippines-specific signal | Research video results can include a documented `region_code` field and can query hashtag/keyword-related attributes, but region availability and interpretation must be validated. A `PH` region code is provider metadata; it does not prove every viewer or creator is Filipino. “BookTokPH” therefore describes the query/community signal, not a representative Philippine readership sample. |
| Authentication | Approved research client credentials and server-side access tokens. Credentials and tokens must remain backend-only. |
| Rate limits | Provider-enforced Research API request and record quotas apply. Exact current quotas must be read from official documentation/headers when credentials are provisioned. Pagination must stop at both BookPulse's configured collection bound and provider limits. |
| Accessible fields | The video query contract documents IDs, creation timestamps, descriptions, hashtags, region metadata, and cumulative engagement counters such as views, likes, comments, shares, and favorites where available. Each counter has different semantics. |
| Timestamp quality | `create_time` is a provider event timestamp for publication. Engagement counters are snapshots at BookPulse `captured_at`; the API does not turn their difference into a provider-supplied interval count. Data availability may lag platform activity, so the integration cannot honestly claim instantaneous “real time.” |
| Reproducibility | Reasonable only when the approved query, date bounds, cursor handling, selected fields, capture timestamp, provider ID, and non-sensitive raw metadata are persisted. Search results and counters may change, so replay requires stored observations. |
| Compliance and maintenance | Conditional on continuing eligibility, the approved purpose, current terms, deletion/retention duties, and quota compliance. Scraping is not an acceptable fallback. |

### Proposed signal semantics if access is approved

One video may mention more than one book, so book resolution must be explicit and reviewable; a hashtag or free-text match must not silently become a canonical identity. After validated title matching, persist separate observations rather than a blended “TikTok score”:

- `video_mention`: one deduplicated provider video associated with a canonical book; unit `video`; event timestamp is the provider `create_time` and capture time is retained separately;
- `view_count`, `like_count`, `comment_count`, `share_count`, and `favorite_count`: separate **cumulative counters**; unit matches the named interaction and timestamp is the capture time;
- query/window provenance: approved query terms, inclusive date bounds, cursor/page metadata, and region filter/returned region code, excluding tokens and sensitive configuration.

Growth may later be calculated deterministically from two genuine counter snapshots. Missing snapshots are missing, not zero. Comment count, video count, score-like popularity, and mentions must never be normalized as if they were the same unit.

### Classification and setup requirements

**Viable only through provider approval or an approved third-party provider.** Research API eligibility is narrower than normal developer registration, so BookPulse must remain unconfigured unless the operator receives approval that covers this project. A commercial third-party provider is acceptable only after its authorization, lineage, field semantics, Philippine coverage, retention rights, and redistribution terms are documented; the provider must not merely resell prohibited scraping.

For direct Research API access, an operator must:

1. confirm that the operator, institution, territory, project, and intended public output meet the current eligibility rules;
2. submit the provider application and obtain approval for the specific research purpose;
3. create the provider project/client and place credentials only in server-side deployment secrets;
4. record the approved fields, time range, quotas, retention/deletion obligations, and attribution requirements;
5. run a limited validation collection to confirm `PH`/BookTokPH coverage and data lag before enabling publication;
6. add timeout, retry, pagination, deduplication, sanitization, idempotency, partial-failure, and quota tests before production use.

Without that approval, TikTok source health should return `not configured` (or an equivalently explicit unavailable state), and the latest known-good ranking must remain untouched.

## Product and engineering consequences

- The production source list must not imply active Goodreads or TikTok coverage while either source is unconfigured.
- Demo mode may demonstrate the interface only when it is explicitly selected and visibly labeled; demo observations must never enter the production read model.
- Source-health output should describe availability without exposing application IDs, tokens, provider endpoints containing credentials, rejection details, or raw payloads.
- The public methodology should describe the actual configured sources and collection cadence. “Real-time” should be replaced by the measured update interval and provider lag wherever live collection is not continuous.
- A future adapter must preserve provider IDs, provider event timestamps, UTC capture timestamps, signal type/unit, query window, ingestion run ID, and non-sensitive raw metadata required to reproduce normalization.

## Reassessment checklist

Before changing either classification, archive a dated review of the official pages above and answer:

1. Who granted access, to which legal entity and use purpose?
2. Does the authorization permit collection, retention, scoring, and public display?
3. What geographic claim does the provider field actually support?
4. Which values are events, interval counts, cumulative counters, rankings, or metadata?
5. What are the current quota, pagination, history-window, latency, and deletion rules?
6. Can identical provider records be identified and replayed idempotently?
7. Can a partial outage leave the prior published snapshot intact?

Until every answer is supported by current provider documentation and working credentials, unavailable providers must remain unavailable rather than simulated.
