import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Download, Filter, LayoutDashboard } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const PROTOCOL_CARDS = [
  {
    step: "01",
    title: "Ingestion",
    subtitle: "Set it and forget it.",
    description:
      "Every 6 hours, BookPulse scans BookTokPH hashtags, r/phbookclub threads, and Goodreads shelves. Global data cross-referenced with Philippines-specific signals — trending posts, community upvotes, and local reading communities.",
    detail: "DATA IN",
    Icon: Download,
    accent: "bg-signal",
  },
  {
    step: "02",
    title: "Filtering",
    subtitle: "Signal from noise.",
    description:
      "Not every mention is a trend. Our filters strip promotional spam, bot activity, and recycled content. What remains: genuine reader enthusiasm. Books are scored by velocity — how fast they're gaining real attention, not just volume.",
    detail: "PROCESS",
    Icon: Filter,
    accent: "bg-black",
  },
  {
    step: "03",
    title: "Display",
    subtitle: "Clean. Ad-free. Yours.",
    description:
      "No affiliate links. No sponsored placements. No algorithmic manipulation. BookPulse renders a clean, brutally honest view of what the Filipino reading community is actually excited about — updated automatically, consumed instantly.",
    detail: "DATA OUT",
    Icon: LayoutDashboard,
    accent: "bg-signal",
  },
];

export default function DataProtocol() {
  const sectionRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(Array.from(cards),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.1,
            scrollTrigger: { trigger: cardsRef.current, start: "top 85%", toggleActions: "play none none none" }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="data-protocol"
      style={{ paddingTop: "6rem", paddingBottom: "6rem" }}
      className="bg-paper"
      aria-label="How BookPulse processes trend data"
    >
      <div className="container-bp">

        {/* Header */}
        <div style={{ marginBottom: "4rem" }}>
          <p className="font-data text-xs text-signal uppercase mb-4" style={{ letterSpacing: "0.2em" }}
             aria-hidden="true">
            // Data Protocol
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-none">
            How the machine
          </h2>
          <span className="block font-drama text-4xl md:text-5xl lg:text-6xl text-signal leading-none mt-3">
            reads for you.
          </span>
          <p className="font-data text-xs text-black/45 mt-8 max-w-xl leading-relaxed" style={{ letterSpacing: "0.05em" }}>
            Three automated steps. Zero manual intervention. BookPulse runs in the background so you never miss a trend.
          </p>
        </div>

        {/* Protocol Cards */}
        <div ref={cardsRef} className="flex flex-col" style={{ gap: "3rem" }} role="list">
          {PROTOCOL_CARDS.map((card) => {
            const { Icon } = card;
            return (
              <article key={card.step}
                   className="relative bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0_#111] hover:shadow-[6px_6px_0_#111] hover:-translate-y-0.5 transition-all duration-300"
                   role="listitem">

                {/* Background Watermark */}
                <div className="absolute -right-4 -bottom-8 font-heading font-bold text-black leading-none pointer-events-none select-none"
                     style={{ fontSize: "14rem", opacity: 0.02, zIndex: -1 }}
                     aria-hidden="true">
                  {card.step}
                </div>

                {/* Card Content */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-start"
                     style={{ padding: "3rem 3rem", gap: "2.5rem" }}>

                  {/* Icon Column */}
                  <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-4 flex-shrink-0" style={{ minWidth: "6rem" }}>
                    <div className={`w-14 h-14 md:w-16 md:h-16 ${card.accent} rounded-xl flex items-center justify-center`}>
                      <Icon size={24} className="text-white" aria-hidden="true" />
                    </div>
                    <span className="font-data text-[9px] text-black/35 uppercase font-bold" style={{ letterSpacing: "0.2em" }}>
                      {card.detail}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                      {card.title}
                    </h3>
                    <p className="font-drama text-lg md:text-xl text-signal mb-6">
                      {card.subtitle}
                    </p>
                    <p className="text-sm md:text-base text-black/60 leading-relaxed max-w-2xl">
                      {card.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
