import { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Layers, Hash, MessageCircle, BookOpen, Newspaper } from "lucide-react";
import BookCover from "./BookCover";

gsap.registerPlugin(ScrollTrigger);

const SOURCE_ICONS = {
  TikTok: Hash,
  Reddit: MessageCircle,
  Goodreads: BookOpen,
  NYT: Newspaper,
};
const SOURCE_LABELS = {
  TikTok: "BookTokPH",
  Reddit: "r/phbookclub",
  Goodreads: "Goodreads",
  NYT: "NYT",
};

/**
 * ConvergenceDetector — Highlights books trending on 2+ platforms.
 */
export default function ConvergenceDetector({ fullFeed }) {
  const sectionRef = useRef(null);
  const cardsRef = useRef(null);

  const convergentBooks = useMemo(() => {
    if (!fullFeed) return [];
    return fullFeed
      .filter((b) => b.isConvergent)
      .sort((a, b) => b.platformCount - a.platformCount || (b.trendScore || b.velocityScore || 0) - (a.trendScore || a.velocityScore || 0))
      .slice(0, 6);
  }, [fullFeed]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(Array.from(cards),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.08,
            scrollTrigger: { trigger: cardsRef.current, start: "top 85%", toggleActions: "play none none none" }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [convergentBooks]);

  if (convergentBooks.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="convergence-detector"
      className="bg-black"
      style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
      aria-label="Cross-platform convergence"
    >
      <div className="container-bp">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="convergence-icon-wrap">
            <Layers size={18} className="text-signal" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
              Cross-Platform Convergence
            </h2>
            <p className="font-data text-[10px] text-white/30 tracking-wider uppercase mt-1">
              Books trending on 2+ platforms simultaneously
            </p>
          </div>
        </div>

        <p className="font-data text-xs text-white/40 mb-8 max-w-lg leading-relaxed" style={{ letterSpacing: "0.03em" }}>
          When a book appears on multiple platforms at once, it signals genuine reader excitement — not algorithmic amplification.
        </p>

        {/* Cards grid */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {convergentBooks.map((book) => (
            <article key={book.id} className="convergence-card group">
              <div className="flex items-start gap-4 mb-4">
                <BookCover cover={book.coverUrl} title={book.title} author={book.author} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-white text-base group-hover:text-signal transition-colors truncate leading-tight">
                    {book.title}
                  </p>
                  <p className="font-data text-[10px] text-white/35 truncate mt-1">{book.author}</p>
                  <p className="font-data text-[10px] text-white/20 mt-0.5">{book.genre}</p>
                </div>
              </div>

              {/* Platform icons */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {book.sources?.map((src) => {
                  const SrcIcon = SOURCE_ICONS[src] || Layers;
                  return (
                    <span key={src} className="inline-flex items-center gap-1 bg-white/[0.06] text-white/50 rounded-full border border-white/[0.08] font-data text-[9px] px-2.5 py-0.5">
                      <SrcIcon size={9} aria-hidden="true" />
                      {SOURCE_LABELS[src] || src}
                    </span>
                  );
                })}
              </div>

              {/* Score + Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-data text-2xl font-bold text-signal tabular-nums">
                    {book.trendScore || book.velocityScore}
                  </span>
                  <span className="font-data text-[9px] text-white/20">/100</span>
                </div>
                <span className="convergence-badge convergence-badge--card font-data">
                  <Layers size={9} />
                  {book.platformCount} PLATFORMS
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
