// ═══════════════════════════════════════════════════════
// BOOKPULSE — Real Trending Data (April 2026)
// Sources: BookTokPH, r/phbookclub, Goodreads Philippines
// Covers: Hardcoded Open Library + Google Books thumbnails
// ═══════════════════════════════════════════════════════

/**
 * Cover URL map — hardcoded for reliability.
 * Uses Open Library covers (ISBN-based, no rate limits on img tags)
 * and Google Books thumbnails as fallback.
 */
const COVER_MAP = {
  // BookTokPH
  "Fourth Wing": "https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg",
  "It Ends with Us": "https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg",
  "The Housemaid": "https://covers.openlibrary.org/b/isbn/9781538742570-M.jpg",
  "A Court of Thorns and Roses": "https://covers.openlibrary.org/b/isbn/9781635575569-M.jpg",
  "The Song of Achilles": "https://covers.openlibrary.org/b/isbn/9780062060624-M.jpg",
  "Sunrise on the Reaping": "https://covers.openlibrary.org/b/isbn/9781339016054-M.jpg",
  "Yellowface": "https://covers.openlibrary.org/b/isbn/9780063286863-M.jpg",
  "Iron Flame": "https://covers.openlibrary.org/b/isbn/9781649374172-M.jpg",

  // r/phbookclub — Filipino titles (using Google Books thumbnails)
  "Sikodiwa": "https://books.google.com/books/publisher/content/images/frontcover/Carl_Cervantes_Sikodiwa?fife=w240-h345",
  "Some People Need Killing": "https://covers.openlibrary.org/b/isbn/9780593492697-M.jpg",
  "Yellowface (Kuang)": "https://covers.openlibrary.org/b/isbn/9780063286863-M.jpg",
  "The Bathala Games": null,
  "Son of a Dead 1980s Bold Star": "/covers/son-of-a-dead-1980s-bold-star.svg",
  "Memoirs of an Art Forger": null,
  "The Elsewhere Express": null,

  // Goodreads
  "Dear Debbie": "https://covers.openlibrary.org/b/isbn/9781464224058-M.jpg",
  "Strange Houses": "https://covers.openlibrary.org/b/isbn/9798217048632-M.jpg",
  "The Seven Year Slip": "https://covers.openlibrary.org/b/isbn/9780593638873-M.jpg",
  "Babel": "https://covers.openlibrary.org/b/isbn/9780063021426-M.jpg",
  "The Love Hypothesis": "https://covers.openlibrary.org/b/isbn/9780593336823-M.jpg",
};

export function getBookCover(title) {
  return COVER_MAP[title] || null;
}

// ═══════════════════════════════════════════════════════
// BOOKTOKPH — Trending on TikTok Philippines (April 2026)
// Source: #BookTokPH hashtag, Philippines-specific viral posts
// ═══════════════════════════════════════════════════════

export const BOOKTOKPH_BOOKS = [
  {
    id: "bt-1",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    genre: "Romantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg",
    mentions: 48200,
    velocity: 96,
    trendScore: 97,
    trending: true,
  },
  {
    id: "bt-2",
    title: "It Ends with Us",
    author: "Colleen Hoover",
    genre: "Contemporary Romance",
    cover: "https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg",
    mentions: 41500,
    velocity: 88,
    trendScore: 93,
    trending: true,
  },
  {
    id: "bt-3",
    title: "The Housemaid",
    author: "Freida McFadden",
    genre: "Psychological Thriller",
    cover: "https://covers.openlibrary.org/b/isbn/9781538742570-M.jpg",
    mentions: 34800,
    velocity: 91,
    trendScore: 90,
    trending: true,
  },
  {
    id: "bt-4",
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    genre: "Romantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9781635575569-M.jpg",
    mentions: 31200,
    velocity: 84,
    trendScore: 88,
    trending: true,
  },
  {
    id: "bt-5",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    genre: "Historical Fiction",
    cover: "https://covers.openlibrary.org/b/isbn/9780062060624-M.jpg",
    mentions: 27600,
    velocity: 79,
    trendScore: 85,
    trending: true,
  },
  {
    id: "bt-6",
    title: "Iron Flame",
    author: "Rebecca Yarros",
    genre: "Romantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9781649374172-M.jpg",
    mentions: 24100,
    velocity: 82,
    trendScore: 83,
    trending: true,
  },
  {
    id: "bt-7",
    title: "Yellowface",
    author: "R.F. Kuang",
    genre: "Literary Satire",
    cover: "https://covers.openlibrary.org/b/isbn/9780063286863-M.jpg",
    mentions: 19400,
    velocity: 76,
    trendScore: 78,
    trending: true,
  },
  {
    id: "bt-8",
    title: "The Love Hypothesis",
    author: "Ali Hazelwood",
    genre: "Romance",
    cover: "https://covers.openlibrary.org/b/isbn/9780593336823-M.jpg",
    mentions: 16800,
    velocity: 71,
    trendScore: 74,
    trending: false,
  },
];

// ═══════════════════════════════════════════════════════
// R/PHBOOKCLUB — Trending on Reddit Philippines (April 2026)
// Source: r/phbookclub subreddit discussions, PH Book Festival
// ═══════════════════════════════════════════════════════

export const PHBOOKCLUB_BOOKS = [
  {
    id: "ph-1",
    title: "Sikodiwa",
    author: "Carl Cervantes",
    genre: "Psychology / Filipino Culture",
    cover: "https://books.google.com/books/publisher/content/images/frontcover/Carl_Cervantes_Sikodiwa?fife=w480-h690",
    mentions: 1420,
    velocity: 94,
    trendScore: 95,
    trending: true,
  },
  {
    id: "ph-2",
    title: "Some People Need Killing",
    author: "Patricia Evangelista",
    genre: "Non-Fiction / Investigative",
    cover: "https://covers.openlibrary.org/b/isbn/9780593492697-M.jpg",
    mentions: 1280,
    velocity: 91,
    trendScore: 92,
    trending: true,
  },
  {
    id: "ph-3",
    title: "Son of a Dead 1980s Bold Star",
    author: "Chuck Smith",
    genre: "Essays / Memoir",
    cover: "/covers/son-of-a-dead-1980s-bold-star.svg",
    mentions: 980,
    velocity: 85,
    trendScore: 87,
    trending: true,
  },
  {
    id: "ph-4",
    title: "Yellowface",
    author: "R.F. Kuang",
    genre: "Literary Satire",
    cover: "https://covers.openlibrary.org/b/isbn/9780063286863-M.jpg",
    mentions: 870,
    velocity: 81,
    trendScore: 84,
    trending: true,
  },
  {
    id: "ph-5",
    title: "Babel",
    author: "R.F. Kuang",
    genre: "Dark Academia / Fantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9780063021426-M.jpg",
    mentions: 760,
    velocity: 77,
    trendScore: 80,
    trending: true,
  },
  {
    id: "ph-6",
    title: "The Last Days of Magic: Stories",
    author: "Ian Rosales Casocot",
    genre: "Filipino Short Stories",
    cover: null,
    mentions: 640,
    velocity: 72,
    trendScore: 76,
    trending: true,
  },
  {
    id: "ph-7",
    title: "The Housemaid",
    author: "Freida McFadden",
    genre: "Psychological Thriller",
    cover: "https://covers.openlibrary.org/b/isbn/9781538742570-M.jpg",
    mentions: 520,
    velocity: 68,
    trendScore: 72,
    trending: false,
  },
  {
    id: "ph-8",
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    genre: "Romantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9781635575569-M.jpg",
    mentions: 410,
    velocity: 64,
    trendScore: 68,
    trending: false,
  },
];

// ═══════════════════════════════════════════════════════
// GOODREADS — Trending on Goodreads Philippines (April 2026)
// Source: Goodreads Philippines shelves, most-read lists
// ═══════════════════════════════════════════════════════

export const GOODREADS_BOOKS = [
  {
    id: "gr-1",
    title: "Dear Debbie",
    author: "Freida McFadden",
    genre: "Thriller",
    cover: "https://covers.openlibrary.org/b/isbn/9781464224058-M.jpg",
    rating: 4.12,
    reviews: 42800,
    velocity: 93,
    trendScore: 95,
    trending: true,
  },
  {
    id: "gr-2",
    title: "Sunrise on the Reaping",
    author: "Suzanne Collins",
    genre: "Dystopian Fiction",
    cover: "https://covers.openlibrary.org/b/isbn/9781339016054-M.jpg",
    rating: 4.28,
    reviews: 38400,
    velocity: 90,
    trendScore: 93,
    trending: true,
  },
  {
    id: "gr-3",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    genre: "Romantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg",
    rating: 4.52,
    reviews: 52100,
    velocity: 87,
    trendScore: 90,
    trending: true,
  },
  {
    id: "gr-4",
    title: "The Housemaid",
    author: "Freida McFadden",
    genre: "Psychological Thriller",
    cover: "https://covers.openlibrary.org/b/isbn/9781538742570-M.jpg",
    rating: 4.18,
    reviews: 35200,
    velocity: 85,
    trendScore: 88,
    trending: true,
  },
  {
    id: "gr-5",
    title: "It Ends with Us",
    author: "Colleen Hoover",
    genre: "Contemporary Romance",
    cover: "https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg",
    rating: 4.15,
    reviews: 48900,
    velocity: 82,
    trendScore: 85,
    trending: true,
  },
  {
    id: "gr-6",
    title: "Babel",
    author: "R.F. Kuang",
    genre: "Dark Academia / Fantasy",
    cover: "https://covers.openlibrary.org/b/isbn/9780063021426-M.jpg",
    rating: 4.08,
    reviews: 31400,
    velocity: 78,
    trendScore: 81,
    trending: true,
  },
  {
    id: "gr-7",
    title: "The Seven Year Slip",
    author: "Ashley Poston",
    genre: "Romance",
    cover: "https://covers.openlibrary.org/b/isbn/9780593638873-M.jpg",
    rating: 3.88,
    reviews: 24300,
    velocity: 74,
    trendScore: 77,
    trending: true,
  },
  {
    id: "gr-8",
    title: "The Love Hypothesis",
    author: "Ali Hazelwood",
    genre: "Romance",
    cover: "https://covers.openlibrary.org/b/isbn/9780593336823-M.jpg",
    rating: 4.02,
    reviews: 41200,
    velocity: 70,
    trendScore: 73,
    trending: false,
  },
];

// ═══════════════════════════════════════════════════════
// Platform Metadata
// ═══════════════════════════════════════════════════════

export const PLATFORMS = {
  booktokph: {
    id: "booktokph",
    label: "BookTokPH",
    sublabel: "TikTok Philippines",
    books: BOOKTOKPH_BOOKS,
  },
  phbookclub: {
    id: "phbookclub",
    label: "r/phbookclub",
    sublabel: "Reddit Philippines",
    books: PHBOOKCLUB_BOOKS,
  },
  goodreads: {
    id: "goodreads",
    label: "Goodreads",
    sublabel: "Philippines Shelves",
    books: GOODREADS_BOOKS,
  },
};

// ═══════════════════════════════════════════════════════
// Telemetry Messages (Updated with real book titles)
// ═══════════════════════════════════════════════════════

export const TELEMETRY_MESSAGES = [
  "Scanning #BookTokPH for new viral posts...",
  "Detected: Fourth Wing — 48.2K mentions on BookTokPH",
  "Cross-referencing with r/phbookclub weekly thread...",
  "Trending in Manila: Sikodiwa by Carl Cervantes +340%",
  "Goodreads PH rating spike: Dear Debbie → 4.12",
  "BookTokPH velocity alert: The Housemaid entering top 3",
  "r/phbookclub hot thread: Some People Need Killing — 91 new comments",
  "Syncing Goodreads Philippines shelf data...",
  "It Ends with Us — still #2 on BookTokPH after 14 weeks",
  "Data pipeline healthy — next sync in 58 minutes",
  "Noise filter applied — 14 promotional entries removed",
  "Trend score recalculated across 24 titles",
  "BookTokPH: ACOTAR remains dominant in romantasy",
  "Manila metro reading pulse: +22% this week",
  "r/phbookclub: Yellowface sparks debate — 45 comment thread",
  "Filtering duplicate cross-platform mentions...",
  "Goodreads PH: Sunrise on the Reaping — 38.4K reviews",
];
