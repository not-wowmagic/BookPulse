import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hash, MessageCircle, BookOpen, Zap, ArrowUp, Star } from "lucide-react";
import BookCover from "./BookCover";

gsap.registerPlugin(ScrollTrigger);

const PLATFORM_CONFIG = {
  booktokph: {
    label: "BookTokPH",
    sublabel: "Trending on TikTok Philippines",
    Icon: Hash,
    accentBg: "bg-signal",
    statLabel: "Mentions",
    statKey: "mentions",
    formatStat: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v),
    gridClass: "book-grid",
  },
  phbookclub: {
    label: "r/phbookclub",
    sublabel: "Trending on Reddit Philippines",
    Icon: MessageCircle,
    accentBg: "bg-[#FF4500]",
    statLabel: "Discussions",
    statKey: "mentions",
    formatStat: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v),
    gridClass: "book-grid",
  },
  goodreads: {
    label: "Goodreads",
    sublabel: "Trending on Goodreads Philippines",
    Icon: BookOpen,
    accentBg: "bg-[#372213]",
    statLabel: "Reviews",
    statKey: "reviews",
    formatStat: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v),
    gridClass: "book-grid--goodreads",
  },
};

/* ══════════════════════════════════════════════════════
   BookRow — CSS Grid locked. py-8. No flex for desktop.
   ══════════════════════════════════════════════════════ */

function BookRow({ book, rank, config, isGoodreads }) {
  return (
    <>
      {/* ── DESKTOP: CSS Grid row ── */}
      <div
        className={`hidden md:grid ${config.gridClass} group border-b border-white/[0.04] last:border-none hover:bg-white/[0.02] transition-colors duration-200`}
        style={{ padding: "2rem 2rem" }}
      >
        {/* Col 1: Rank */}
        <div className="text-right">
          <span className="font-data text-xl font-bold text-white/20 tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
        </div>

        {/* Col 2: Cover + Title (in 1fr) */}
        <div className="flex items-center gap-5 min-w-0">
          <BookCover cover={book.cover} title={book.title} author={book.author} size={56} />
          <div className="min-w-0">
            <p className="font-heading font-semibold text-white text-xl group-hover:text-signal transition-colors duration-200 truncate leading-tight">
              {book.title}
            </p>
            <p className="font-data text-[11px] text-white/35 truncate mt-2 tracking-wide">
              {book.author}
              <span className="text-white/15"> · {book.genre}</span>
            </p>
          </div>
        </div>

        {/* Col 3: Stat (Mentions / Discussions / Reviews) */}
        <div className="text-right">
          <span className="font-data text-sm text-white/50 tabular-nums">
            {config.formatStat(book[config.statKey] || book.mentions || 0)}
          </span>
        </div>

        {/* Col 3.5: Rating — only for Goodreads grid */}
        {isGoodreads && (
          <div className="flex items-center justify-end gap-2">
            <Star size={13} className="text-yellow-500 fill-yellow-500" />
            <span className="font-data text-sm text-white/50 tabular-nums">{book.rating}</span>
          </div>
        )}

        {/* Col 4: Score */}
        <div className="text-right">
          <span className={`font-data text-2xl font-bold tabular-nums ${
            book.trendScore >= 85 ? "text-signal" : book.trendScore >= 70 ? "text-white" : "text-white/40"
          }`}>
            {book.trendScore}
          </span>
          <span className="font-data text-[9px] text-white/15 ml-0.5">/100</span>
        </div>

        {/* Col 5: Status Badge */}
        <div className="flex justify-end">
          {book.trending ? (
            <div className="inline-flex items-center gap-2.5 bg-signal/10 text-signal rounded-full border border-signal/20"
                 style={{ padding: "0.5rem 1rem" }}>
              <Zap size={12} fill="currentColor" />
              <span className="font-data text-[10px] font-bold uppercase tracking-widest">Trending</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2.5 bg-white/[0.04] text-white/30 rounded-full border border-white/8"
                 style={{ padding: "0.5rem 1rem" }}>
              <ArrowUp size={12} />
              <span className="font-data text-[10px] uppercase tracking-widest">Steady</span>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE: Card layout ── */}
      <div className="flex md:hidden items-center gap-4 border-b border-white/[0.04] last:border-none"
           style={{ padding: "1.5rem 1.25rem" }}>
        <span className="font-data text-base font-bold text-white/20 tabular-nums w-8 text-right flex-shrink-0">
          {String(rank).padStart(2, "0")}
        </span>
        <BookCover cover={book.cover} title={book.title} author={book.author} size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-white text-base truncate leading-tight">
            {book.title}
          </p>
          <p className="font-data text-[10px] text-white/30 truncate mt-1.5">
            {book.author}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`font-data text-lg font-bold tabular-nums ${
            book.trendScore >= 85 ? "text-signal" : "text-white/45"
          }`}>
            {book.trendScore}
          </span>
          {book.trending && <Zap size={14} className="text-signal" fill="currentColor" />}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   PlatformBoard — one per data source
   ══════════════════════════════════════════════════════ */

function PlatformBoard({ platformKey, books }) {
  const boardRef = useRef(null);
  const config = PLATFORM_CONFIG[platformKey];
  const { Icon } = config;
  const sortedBooks = [...books].sort((a, b) => b.trendScore - a.trendScore);
  const isGoodreads = platformKey === "goodreads";

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

  return (
    <div ref={boardRef} className="bg-[#131313] border border-white/[0.07] rounded-2xl overflow-hidden">

      {/* ── Platform Header ── */}
      <div className="flex items-center gap-6 border-b border-white/[0.07] bg-[#171717]"
           style={{ padding: "1.75rem 2rem" }}>
        <div className={`w-12 h-12 ${config.accentBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
            {config.label}
          </h3>
          <p className="font-data text-[11px] text-white/35 tracking-wide mt-2">
            {config.sublabel}
          </p>
        </div>
        <span className="font-data text-[9px] text-white/20 tracking-widest uppercase hidden sm:block">
          Top {sortedBooks.length}
        </span>
      </div>

      {/* ── Column Headers — CSS Grid locked, uppercase, tracking-[0.2em], text-xs ── */}
      <div
        className={`hidden md:grid ${config.gridClass} border-b border-white/[0.04] bg-[#151515]`}
        style={{ padding: "1rem 2rem" }}
      >
        <div className="text-right font-data text-xs text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>#</div>
        <div className="font-data text-xs text-white/25 uppercase pl-1" style={{ letterSpacing: "0.2em" }}>Title</div>
        <div className="text-right font-data text-xs text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>{config.statLabel}</div>
        {isGoodreads && (
          <div className="text-right font-data text-xs text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Rating</div>
        )}
        <div className="text-right font-data text-xs text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Score</div>
        <div className="text-right font-data text-xs text-white/25 uppercase" style={{ letterSpacing: "0.2em" }}>Status</div>
      </div>

      {/* ── Book Rows ── */}
      <div>
        {sortedBooks.map((book, i) => (
          <BookRow key={book.id} book={book} rank={i + 1} config={config} isGoodreads={isGoodreads} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main TrendingBoard Export
   ══════════════════════════════════════════════════════ */

export default function TrendingBoard({ booktokph, phbookclub, goodreads }) {
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
    <section ref={sectionRef} id="trending-board" style={{ paddingTop: "6rem", paddingBottom: "6rem" }} className="bg-black">
      <div className="container-bp">

        {/* Section Header — mb-12 = 48px before first board */}
        <div ref={headerRef} style={{ marginBottom: "3rem" }}>
          <p className="font-data text-xs text-signal uppercase mb-4" style={{ letterSpacing: "0.2em" }}>
            // Live Rankings
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-none text-white">
            Trending in the
          </h2>
          <h2 className="font-drama text-4xl md:text-5xl lg:text-6xl text-signal leading-none mt-3">
            Philippines.
          </h2>
          <p className="font-data text-xs text-white/40 mt-8 max-w-xl leading-relaxed" style={{ letterSpacing: "0.05em" }}>
            Separated by platform. Ranked by trend velocity. Auto-updated every 60 seconds.
          </p>
        </div>

        {/* Platform Boards — gap-20 = 80px between boards */}
        <div className="flex flex-col" style={{ gap: "5rem" }}>
          <PlatformBoard platformKey="booktokph" books={booktokph} />
          <PlatformBoard platformKey="phbookclub" books={phbookclub} />
          <PlatformBoard platformKey="goodreads" books={goodreads} />
        </div>

      </div>
    </section>
  );
}
