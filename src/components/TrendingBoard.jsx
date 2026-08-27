import { useEffect, useRef, useState, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Hash, MessageCircle, BookOpen, Zap, ArrowUp, ArrowDown,
  Star, TrendingUp, TrendingDown, Layers, ExternalLink,
  ChevronDown, ChevronUp,
} from "lucide-react";
import BookCover from "./BookCover";
import VibeFilterBar from "./VibeFilterBar";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   Platform Config
   ═══════════════════════════════════════════════════════ */

const PLATFORM_CONFIG = {
  booktokph: {
    label: "BookTokPH",
    sublabel: "Trending on TikTok Philippines",
    Icon: Hash,
    accentBg: "bg-signal",
    statLabel: "Mentions",
    statKey: "mentions",
    formatStat: (v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v || 0)),
  },
  phbookclub: {
    label: "r/phbookclub",
    sublabel: "Trending on Reddit Philippines",
    Icon: MessageCircle,
    accentBg: "bg-[#FF4500]",
    statLabel: "Discussions",
    statKey: "mentions",
    formatStat: (v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v || 0)),
  },
  goodreads: {
    label: "Goodreads",
    sublabel: "Trending on Goodreads Philippines",
    Icon: BookOpen,
    accentBg: "bg-[#372213]",
    statLabel: "Reviews",
    statKey: "reviews",
    formatStat: (v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v || 0)),
  },
};

const PLATFORM_LABELS = {
  TikTok: "BookTokPH",
  Reddit: "r/phbookclub",
  Goodreads: "Goodreads",
  NYT: "NYT",
};

/* Sanitize text to prevent XSS from any future external data source */
function sanitize(str) {
  if (typeof str !== "string") return "";
  const withoutControls = [...str]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");
  return withoutControls.replace(/[<>]/g, "").trim();
}

/* ═══════════════════════════════════════════════════════
   SpreadTimeline — Expandable "How Did It Spread?" row
   ═══════════════════════════════════════════════════════ */

function SpreadTimeline({ timeline }) {
  if (!timeline || timeline.length < 2) return null;

  return (
    <div className="spread-timeline" role="list" aria-label="Platform spread timeline">
      <div className="spread-timeline__track">
        {timeline.map((node, i) => (
          <div key={node.platform} className="spread-timeline__node" role="listitem">
            <div className="spread-timeline__dot" />
            <span className="spread-timeline__label font-data">
              {PLATFORM_LABELS[node.platform] || node.platform}
            </span>
            <span className="spread-timeline__day font-data">
              Day {node.dayOffset}
            </span>
            {i < timeline.length - 1 && <div className="spread-timeline__connector" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BuyLinks — Shopee, Lazada, Fully Booked
   ═══════════════════════════════════════════════════════ */

function BuyLinks({ affiliates }) {
  if (!affiliates || affiliates.length === 0) return null;

  return (
    <div className="buy-links" role="list" aria-label="Buy this book">
      {affiliates.map((a) => (
        <a
          key={a.platform}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="buy-link font-data"
          role="listitem"
        >
          <ExternalLink size={10} aria-hidden="true" />
          {a.platform}
        </a>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BookRow — Enhanced with sparkline, momentum, badges
   ═══════════════════════════════════════════════════════ */

const BookRow = memo(function BookRow({ book, rank, config, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const safeTitle = sanitize(book.title);
  const safeAuthor = sanitize(book.author);
  const safeGenre = sanitize(book.genre);
  const score = Number(book.trendScore) || 0;
  const delta = book.scoreChange;

  return (
    <>
      {/* ── DESKTOP: CSS Grid row ── */}
      <div
        className={`hidden md:grid book-grid-v2 group border-b border-white/[0.04] last:border-none hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer`}
        style={{ padding: "1.5rem 2rem" }}
        role="row"
        aria-label={`Rank ${rank}: ${safeTitle} by ${safeAuthor}, score ${score}`}
        tabIndex={0}
        onClick={() => onSelect(book)}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(book); } }}
      >
        {/* Col 1: Rank */}
        <div className="text-right flex items-center justify-end" role="cell">
          <span className="font-data text-xl font-bold text-white/20 tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
        </div>

        {/* Col 2: Cover + Title + Badges */}
        <div className="flex items-center gap-4 min-w-0" role="cell">
          <BookCover cover={book.coverUrl} title={safeTitle} author={safeAuthor} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading font-semibold text-white text-lg group-hover:text-signal transition-colors duration-200 truncate leading-tight">
                {safeTitle}
              </p>
              {book.isConvergent && (
                <span className="convergence-badge font-data" aria-label="Trending on multiple platforms">
                  <Layers size={9} />
                  CROSSOVER
                </span>
              )}
              {book.isPHAuthor && (
                <span className="ph-badge font-data" aria-label="Filipino author">
                  🇵🇭
                </span>
              )}
            </div>
            <p className="font-data text-[11px] text-white/35 truncate mt-1.5 tracking-wide">
              {safeAuthor}
              <span className="text-white/15"> · {safeGenre}</span>
              {book.vibe && (
                <span className="text-white/20"> · {book.vibe}</span>
              )}
            </p>
          </div>
        </div>

        {/* Col 3: Stat */}
        <div className="text-right flex items-center justify-end" role="cell">
          <span className="font-data text-sm text-white/50 tabular-nums">
            {config.formatStat(book[config.statKey] || book.mentions || 0)}
          </span>
        </div>

        {/* Col 4: previous published snapshot */}
        <div className="flex items-center justify-center" role="cell">
          <span className="font-data text-xs text-white/30 tabular-nums">
            {book.previousTrendScore ?? "—"}
          </span>
        </div>

        {/* Col 5: Momentum Delta */}
        <div className="flex items-center justify-end gap-1" role="cell">
          {delta > 0 ? (
            <span className="momentum-tag momentum-tag--up font-data">
              <TrendingUp size={10} />
              +{delta}
            </span>
          ) : delta < 0 ? (
            <span className="momentum-tag momentum-tag--down font-data">
              <TrendingDown size={10} />
              {delta}
            </span>
          ) : (
            <span className="momentum-tag momentum-tag--flat font-data">—</span>
          )}
        </div>

        {/* Col 6: Score */}
        <div className="text-right flex items-center justify-end" role="cell">
          <span className={`font-data text-xl font-bold tabular-nums ${
            score >= 85 ? "text-signal" : score >= 70 ? "text-white" : "text-white/40"
          }`}>
            {score}
          </span>
          <span className="font-data text-[9px] text-white/15 ml-0.5">/100</span>
        </div>

        {/* Col 7: Status + Expand */}
        <div className="flex items-center justify-end gap-2" role="cell">
          {book.trending ? (
            <div className="inline-flex items-center gap-2 bg-signal/10 text-signal rounded-full border border-signal/20"
                 style={{ padding: "0.35rem 0.75rem" }}>
              <Zap size={10} fill="currentColor" aria-hidden="true" />
              <span className="font-data text-[9px] font-bold uppercase tracking-widest">Trending</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/[0.04] text-white/30 rounded-full border border-white/8"
                 style={{ padding: "0.35rem 0.75rem" }}>
              <ArrowUp size={10} aria-hidden="true" />
              <span className="font-data text-[9px] uppercase tracking-widest">Steady</span>
            </div>
          )}
          <button onClick={(event) => { event.stopPropagation(); setExpanded((e) => !e); }} className="text-white/20 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer p-1" aria-label={expanded ? "Collapse spread and purchase links" : "Expand spread and purchase links"}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── DESKTOP: Expanded Details ── */}
      {expanded && (
        <div className="hidden md:flex items-center gap-8 bg-white/[0.015] border-b border-white/[0.04]"
             style={{ padding: "1rem 2rem 1rem 6rem" }}>
          <SpreadTimeline timeline={book.spreadTimeline} />
          <BuyLinks affiliates={book.affiliates} />
        </div>
      )}

      {/* ── MOBILE: Card layout ── */}
      <div className="flex md:hidden items-center gap-4 border-b border-white/[0.04] last:border-none"
           style={{ padding: "1.25rem 1.25rem" }}
           role="row"
           tabIndex={0}
           onClick={() => onSelect(book)}
           onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(book); } }}
           aria-label={`Rank ${rank}: ${safeTitle}, score ${score}`}>
        <span className="font-data text-base font-bold text-white/20 tabular-nums w-8 text-right flex-shrink-0" role="cell">
          {String(rank).padStart(2, "0")}
        </span>
        <BookCover cover={book.coverUrl} title={safeTitle} author={safeAuthor} size={44} />
        <div className="flex-1 min-w-0" role="cell">
          <div className="flex items-center gap-1.5">
            <p className="font-heading font-semibold text-white text-base truncate leading-tight">
              {safeTitle}
            </p>
            {book.isConvergent && <Layers size={10} className="text-signal flex-shrink-0" />}
            {book.isPHAuthor && <span className="text-[10px] flex-shrink-0">🇵🇭</span>}
          </div>
          <p className="font-data text-[10px] text-white/30 truncate mt-1">
            {safeAuthor}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0" role="cell">
          <div className="flex items-center gap-1.5">
            <span className={`font-data text-lg font-bold tabular-nums ${
              score >= 85 ? "text-signal" : "text-white/45"
            }`}>
              {score}
            </span>
            {book.trending && <Zap size={12} className="text-signal" fill="currentColor" aria-hidden="true" />}
          </div>
          {delta != null && delta !== 0 && (
            <span className={`font-data text-[9px] ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
              {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
            </span>
          )}
        </div>
      </div>
    </>
  );
});

/* ═══════════════════════════════════════════════════════
   PlatformBoard — one per data source
   ═══════════════════════════════════════════════════════ */

function PlatformBoard({ platformKey, books, onSelect }) {
  const boardRef = useRef(null);
  const config = PLATFORM_CONFIG[platformKey];
  const { Icon } = config;
  const sortedBooks = [...books].sort((a, b) => (b.trendScore || b.velocityScore || 0) - (a.trendScore || a.velocityScore || 0));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(boardRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out",
          scrollTrigger: { trigger: boardRef.current, start: "top 88%", toggleActions: "play none none none" }
        }
      );
    }, boardRef);
    return () => ctx.revert();
  }, []);

  if (sortedBooks.length === 0) {
    return (
      <div ref={boardRef} className="bg-[#131313] border border-white/[0.07] rounded-2xl overflow-hidden" style={{ padding: "3rem 2rem" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-10 h-10 ${config.accentBg} rounded-xl flex items-center justify-center`}>
            <Icon size={18} className="text-white" />
          </div>
          <h3 className="font-heading text-lg font-bold text-white">{config.label}</h3>
        </div>
        <p className="font-data text-xs text-white/30">No books match the current filter.</p>
      </div>
    );
  }

  return (
    <div ref={boardRef} className="bg-[#131313] border border-white/[0.07] rounded-2xl overflow-hidden"
         role="table" aria-label={`${config.label} trending books`}>

      {/* Platform Header */}
      <div className="flex items-center gap-6 border-b border-white/[0.07] bg-[#171717]"
           style={{ padding: "1.5rem 2rem" }}>
        <div className={`w-11 h-11 ${config.accentBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
            {config.label}
          </h3>
          <p className="font-data text-[11px] text-white/35 tracking-wide mt-1.5">
            {config.sublabel}
          </p>
        </div>
        <span className="font-data text-[9px] text-white/20 tracking-widest uppercase hidden sm:block" aria-hidden="true">
          {sortedBooks.length} titles
        </span>
      </div>

      {/* Column Headers */}
      <div
        className="hidden md:grid book-grid-v2 border-b border-white/[0.04] bg-[#151515]"
        style={{ padding: "0.75rem 2rem" }}
        role="row"
        aria-hidden="true"
      >
        <div className="text-right font-data text-[10px] text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>#</div>
        <div className="font-data text-[10px] text-white/25 uppercase pl-1" style={{ letterSpacing: "0.2em" }}>Title</div>
        <div className="text-right font-data text-[10px] text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>{config.statLabel}</div>
        <div className="text-center font-data text-[10px] text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Previous</div>
        <div className="text-right font-data text-[10px] text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Δ</div>
        <div className="text-right font-data text-[10px] text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Score</div>
        <div className="text-right font-data text-[10px] text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Status</div>
      </div>

      {/* Book Rows */}
      <div role="rowgroup">
        {sortedBooks.map((book, i) => (
          <BookRow key={book.id} book={book} rank={i + 1} config={config} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main TrendingBoard Export
   ═══════════════════════════════════════════════════════ */

export default function TrendingBoard({
  booktokph, phbookclub, goodreads,
  status, mode, error,
  activeVibeFilter, setActiveVibeFilter,
  onSelectBook,
}) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(headerRef.current.children,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.08,
            scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="trending-board" style={{ paddingTop: "6rem", paddingBottom: "6rem" }} className="bg-black"
             aria-label="Live book trend rankings for the Philippines">
      <div className="container-bp">

        {(mode === "demo" || status !== "ok") && (
          <div className="mb-8 rounded-2xl border border-signal/30 bg-signal/10 px-5 py-4 font-data text-xs text-white/70" role="status">
            {mode === "demo" && <strong className="mr-2 text-signal">DEMO DATA</strong>}
            {status === "loading" && "Loading the latest published snapshot…"}
            {status === "warming" && "The pipeline has not published its first snapshot yet."}
            {status === "stale" && "Showing the latest known-good snapshot while fresh data is unavailable."}
            {status === "error" && (error || "Trend data is currently unavailable.")}
          </div>
        )}

        {/* Section Header */}
        <div ref={headerRef} style={{ marginBottom: "2rem" }}>
          <p className="font-data text-xs text-signal uppercase mb-4" style={{ letterSpacing: "0.2em" }}
             aria-hidden="true">
            // Live Rankings
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-none text-white">
            Trending in the
          </h2>
          <span className="block font-drama text-4xl md:text-5xl lg:text-6xl text-signal leading-none mt-3">
            Philippines.
          </span>
          <p className="font-data text-xs text-white/40 mt-6 max-w-xl leading-relaxed" style={{ letterSpacing: "0.05em" }}>
            Separated by platform. Ranked by trend velocity. Auto-updated every 60 seconds.
          </p>
        </div>

        {/* Vibe Filter Bar */}
        <VibeFilterBar activeFilter={activeVibeFilter} setActiveFilter={setActiveVibeFilter} />

        {/* Platform Boards */}
        <div className="flex flex-col" style={{ gap: "4rem", marginTop: "2.5rem" }}>
          <PlatformBoard platformKey="booktokph" books={booktokph} onSelect={onSelectBook} />
          <PlatformBoard platformKey="phbookclub" books={phbookclub} onSelect={onSelectBook} />
          <PlatformBoard platformKey="goodreads" books={goodreads} onSelect={onSelectBook} />
        </div>

      </div>
    </section>
  );
}
