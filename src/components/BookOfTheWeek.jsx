import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Crown, Layers, Hash, MessageCircle, BookOpen, Newspaper } from "lucide-react";
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
 * BookOfTheWeek — Pinned editorial hero card for the #1 book.
 * Full-bleed cover with gradient overlay, aggregate score, platform badges.
 */
export default function BookOfTheWeek({ fullFeed }) {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);

  const topBook = fullFeed?.[0];
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(cardRef.current,
          { y: 40, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: cardRef.current, start: "top 88%", toggleActions: "play none none none" }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  if (!topBook) return null;

  return (
    <section
      ref={sectionRef}
      id="book-of-the-week"
      className="bg-black"
      style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
      aria-label="Book of the Week"
    >
      <div className="container-bp">
        <div
          ref={cardRef}
          className="book-of-week-card"
          style={{ opacity: 0 }}
        >
          {/* Background gradient */}
          <div className="book-of-week-card__bg" aria-hidden="true" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12" style={{ padding: "3rem" }}>
            {/* Cover */}
            <div className="flex-shrink-0">
              <BookCover cover={topBook.coverUrl} title={topBook.title} author={topBook.author} size={140} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="w-8 h-8 bg-signal rounded-lg flex items-center justify-center">
                  <Crown size={16} className="text-white" aria-hidden="true" />
                </div>
                <span className="font-data text-[10px] text-signal uppercase tracking-[0.25em] font-bold">
                  Book of the Week
                </span>
              </div>

              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
                {topBook.title}
              </h2>
              <p className="font-drama text-xl md:text-2xl text-white/50 mb-6">
                by {topBook.author}
              </p>

              {/* Stats row */}
              <div className="flex items-center justify-center md:justify-start gap-6 mb-6">
                <div>
                  <span className="font-data text-3xl font-bold text-signal tabular-nums">{topBook.trendScore || topBook.velocityScore}</span>
                  <span className="font-data text-xs text-white/25 ml-1">/100</span>
                  <p className="font-data text-[9px] text-white/30 mt-1 uppercase tracking-wider">Trend Score</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <span className="font-data text-3xl font-bold text-white tabular-nums">{topBook.platformCount}</span>
                  <p className="font-data text-[9px] text-white/30 mt-1 uppercase tracking-wider">Platforms</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <span className="font-data text-3xl font-bold text-white tabular-nums">
                    {topBook.mentions >= 1000 ? `${(topBook.mentions / 1000).toFixed(1)}K` : topBook.mentions}
                  </span>
                  <p className="font-data text-[9px] text-white/30 mt-1 uppercase tracking-wider">Mentions</p>
                </div>
              </div>

              {/* Platform badges */}
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {topBook.sources?.map((src) => {
                  const SrcIcon = SOURCE_ICONS[src] || Layers;
                  return (
                    <span key={src} className="inline-flex items-center gap-1.5 bg-white/[0.06] text-white/50 rounded-full border border-white/[0.08] font-data text-[10px] px-3 py-1">
                      <SrcIcon size={10} aria-hidden="true" />
                      {SOURCE_LABELS[src] || src}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
