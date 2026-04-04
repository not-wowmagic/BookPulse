import { useEffect, useRef } from "react";
import { ArrowDown, Clock } from "lucide-react";
import gsap from "gsap";

export default function Hero({ lastUpdated }) {
  const heroRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const platformsRef = useRef(null);
  const ctaRef = useRef(null);
  const metaRef = useRef(null);

  const formattedTime = lastUpdated.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4 });
      tl.fromTo(line1Ref.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" })
        .fromTo(line2Ref.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.55")
        .fromTo(subtitleRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3")
        .fromTo(platformsRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.15")
        .fromTo(ctaRef.current, { y: 14, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, "-=0.1")
        .fromTo(metaRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.05");
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} id="hero-section" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(230,59,46,0.05) 59px, rgba(230,59,46,0.05) 60px),
                            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(230,59,46,0.05) 59px, rgba(230,59,46,0.05) 60px)`,
        }} />
        <div className="hero-gradient absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full px-8">
        <div className="overflow-hidden">
          <h1 ref={line1Ref} className="font-heading font-bold text-white tracking-tighter leading-none"
              style={{ fontSize: "clamp(4rem, 12vw, 11rem)", opacity: 0 }}>
            Book
          </h1>
        </div>
        <div className="overflow-hidden mt-2">
          <h1 ref={line2Ref} className="font-heading font-bold text-signal tracking-tighter leading-none"
              style={{ fontSize: "clamp(4rem, 12vw, 11rem)", opacity: 0 }}>
            Pulse
          </h1>
        </div>

        {/* Subtitle — generous gap */}
        <p ref={subtitleRef}
           className="font-drama text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/50 mt-12 md:mt-16 max-w-2xl leading-relaxed"
           style={{ opacity: 0 }}>
          Real-time book trends from the Filipino reading pulse.
        </p>

        {/* Platform list */}
        <p ref={platformsRef}
           className="font-data text-xs text-white/25 mt-8 tracking-[0.25em] uppercase"
           style={{ opacity: 0 }}>
          BookTokPH · r/phbookclub · Goodreads
        </p>

        {/* CTA — mt-12 as specified, px-10 py-4 */}
        <div ref={ctaRef} className="mt-12" style={{ opacity: 0 }}>
          <a href="#trending-board" id="hero-cta"
             className="inline-flex items-center justify-center gap-3 bg-signal hover:bg-signal-dark text-white font-heading font-bold text-sm tracking-widest uppercase rounded-full border-2 border-signal hover:border-signal-dark transition-all duration-300 no-underline shadow-[0_0_48px_rgba(230,59,46,0.15)] hover:shadow-[0_0_64px_rgba(230,59,46,0.3)]"
             style={{ padding: "1rem 2.5rem" }}>
            Explore Trending Books
            <ArrowDown size={18} className="animate-bounce" />
          </a>
        </div>

        {/* Meta */}
        <div ref={metaRef} className="mt-10 flex items-center justify-center gap-4 text-white/20 font-data text-[11px] tracking-wide" style={{ opacity: 0 }}>
          <Clock size={12} />
          <span>Last synced: {formattedTime}</span>
          <span className="text-white/10">·</span>
          <span>Auto-refresh: 60s</span>
          <span className="text-white/10">·</span>
          <span>3 platforms</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
