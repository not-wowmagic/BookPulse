import { ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="footer" className="bg-black border-t border-white/5 py-16 md:py-20">
      <div className="container-bp">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="font-heading text-2xl md:text-3xl font-bold text-white">
                Book
              </span>
              <span className="font-heading text-2xl md:text-3xl font-bold text-signal">
                Pulse
              </span>
            </div>
            <p className="font-data text-xs text-white/25 max-w-xs leading-loose">
              Real-time book trend aggregator.
              <br />
              Philippines-first.
              <br />
              Tracking BookTokPH · r/phbookclub · Goodreads.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
            <div className="flex flex-col gap-3">
              <span className="font-data text-[10px] text-white/15 tracking-widest uppercase">
                Data Sources
              </span>
              <div className="flex gap-5">
                <span className="font-data text-xs text-white/40 hover:text-signal transition-colors cursor-pointer">
                  BookTokPH
                </span>
                <span className="font-data text-xs text-white/40 hover:text-signal transition-colors cursor-pointer">
                  r/phbookclub
                </span>
                <span className="font-data text-xs text-white/40 hover:text-signal transition-colors cursor-pointer">
                  Goodreads
                </span>
              </div>
            </div>

            <button
              onClick={scrollToTop}
              className="w-11 h-11 border-2 border-white/10 hover:border-signal rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-signal hover:scale-105 cursor-pointer bg-transparent"
              aria-label="Scroll to top"
            >
              <ArrowUp size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Bottom Bar — more space above */}
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-data text-[10px] text-white/12">
            © 2026 BOOKPULSE. BUILT FOR FILIPINO READERS.
          </p>
          <p className="font-data text-[10px] text-white/12">
            NO ADS · NO AFFILIATES · NO NOISE
          </p>
        </div>
      </div>
    </footer>
  );
}
