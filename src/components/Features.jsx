import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hash, MessageCircle, BookOpen, TrendingUp } from "lucide-react";
import { TELEMETRY_MESSAGES } from "../data/books";
import BookCover from "./BookCover";

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════
   Card 1 — Platform Shuffler
   ════════════════════════════════════════════════════ */
function PlatformShuffler({ booktokph, phbookclub, goodreads }) {
  const platforms = [
    { key: "booktokph", label: "BookTokPH", Icon: Hash, books: booktokph },
    { key: "phbookclub", label: "r/phbookclub", Icon: MessageCircle, books: phbookclub },
    { key: "goodreads", label: "Goodreads", Icon: BookOpen, books: goodreads },
  ];

  const [activePlatform, setActivePlatform] = useState(0);
  const [activeBookIdx, setActiveBookIdx] = useState(0);
  const contentRef = useRef(null);

  const platform = platforms[activePlatform];
  const book = platform.books[activeBookIdx];
  const PlatIcon = platform.Icon;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBookIdx((b) => {
        if (b >= 2) {
          setActivePlatform((p) => (p + 1) % 3);
          return 0;
        }
        return b + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activePlatform]);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
    }
  }, [activePlatform, activeBookIdx]);

  return (
    <div className="card-brutal flex flex-col min-h-[380px]">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
          <TrendingUp size={15} className="text-signal" />
        </div>
        <span className="font-heading font-bold text-xs tracking-wide uppercase">
          Platform Shuffler
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between" ref={contentRef}>
        {/* Book Info with Cover */}
        <div className="flex gap-4 items-start mb-6">
          <BookCover cover={book.cover} title={book.title} author={book.author} size={56} />
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-drama text-lg leading-tight mb-1">
              {book.title}
            </p>
            <p className="font-data text-[11px] text-midgray">{book.author}</p>
            <p className="font-data text-[10px] text-midgray/50 mt-0.5">{book.genre}</p>
          </div>
        </div>

        {/* Platform label */}
        <div className="flex items-center gap-2 mb-3">
          <PlatIcon size={13} className="text-signal" />
          <span className="font-data text-xs font-bold">{platform.label}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-paper px-3 py-2.5 rounded-xl">
            <p className="font-data text-xl font-bold text-signal">#{activeBookIdx + 1}</p>
            <p className="font-data text-[9px] text-midgray uppercase tracking-wider mt-0.5">Rank</p>
          </div>
          <div className="bg-paper px-3 py-2.5 rounded-xl">
            <p className="font-data text-xl font-bold">{book.velocity}</p>
            <p className="font-data text-[9px] text-midgray uppercase tracking-wider mt-0.5">Velocity</p>
          </div>
          <div className="bg-paper px-3 py-2.5 rounded-xl">
            <p className="font-data text-xl font-bold">{book.trendScore}</p>
            <p className="font-data text-[9px] text-midgray uppercase tracking-wider mt-0.5">Score</p>
          </div>
        </div>

        {/* Platform Indicators */}
        <div className="flex gap-2">
          {platforms.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i === activePlatform ? "bg-signal" : "bg-black/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Card 2 — Telemetry Feed
   ════════════════════════════════════════════════════ */
function TelemetryFeed() {
  const [lines, setLines] = useState([]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    let charIdx = 0;
    const msg = TELEMETRY_MESSAGES[msgIdx % TELEMETRY_MESSAGES.length];
    const typeInterval = setInterval(() => {
      if (charIdx <= msg.length) {
        setCurrentMsg(msg.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setLines((prev) => [...prev, msg].slice(-6));
          setCurrentMsg("");
          setMsgIdx((i) => i + 1);
        }, 800);
      }
    }, 35);
    return () => clearInterval(typeInterval);
  }, [msgIdx]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [lines, currentMsg]);

  return (
    <div className="card-brutal flex flex-col min-h-[380px] bg-black! text-white! border-black!">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-signal rounded-xl flex items-center justify-center">
          <MessageCircle size={15} className="text-white" />
        </div>
        <span className="font-heading font-bold text-xs tracking-wide uppercase text-white">
          Telemetry Feed
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-data text-[10px] text-white/40">ACTIVE</span>
        </div>
      </div>

      <div ref={feedRef} className="flex-1 overflow-hidden font-data text-xs leading-loose space-y-2 min-h-[200px]">
        {lines.map((line, i) => (
          <div key={i} className="text-white/35">
            <span className="text-signal/50 mr-2">▸</span>{line}
          </div>
        ))}
        {currentMsg && (
          <div className="text-white/75">
            <span className="text-signal mr-2">▸</span>{currentMsg}
            <span className="inline-block w-1.5 h-3.5 bg-signal ml-0.5 animate-pulse" />
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-white/8 flex items-center justify-between">
        <span className="font-data text-[10px] text-white/20">BOOKPULSE://TELEMETRY</span>
        <span className="font-data text-[10px] text-white/20">{lines.length} events</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Card 3 — Velocity Map
   ════════════════════════════════════════════════════ */
function VelocityMap({ booktokph }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const primary = booktokph[0];

  const generateCurve = (score) => {
    const points = [];
    for (let i = 0; i < 9; i++) {
      const progress = i / 8;
      const base = score * progress;
      const noise = Math.sin(i * 1.7) * 5;
      points.push(Math.max(0, Math.min(100, Math.round(base + noise))));
    }
    return points;
  };

  const data = generateCurve(primary.trendScore);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      gsap.fromTo(pathRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 2, ease: "power2.inOut",
          scrollTrigger: { trigger: svgRef.current, start: "top 80%", toggleActions: "play none none none" },
        }
      );
    }
  }, [data]);

  const width = 300, height = 130, padding = 12;
  const graphW = width - padding * 2, graphH = height - padding * 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * graphW;
    const y = padding + graphH - (val / 100) * graphH;
    return `${x},${y}`;
  });

  const pathD = "M " + points.map((p, i) => {
    if (i === 0) return p;
    const [px, py] = points[i - 1].split(",").map(Number);
    const [cx, cy] = p.split(",").map(Number);
    const cpx = (px + cx) / 2;
    return `C ${cpx},${py} ${cpx},${cy} ${cx},${cy}`;
  }).join(" ");

  const lastPoint = points[points.length - 1].split(",").map(Number);
  const areaD = pathD + ` L ${padding + graphW},${padding + graphH} L ${padding},${padding + graphH} Z`;

  return (
    <div className="card-brutal flex flex-col min-h-[380px]">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
          <TrendingUp size={15} className="text-signal" />
        </div>
        <span className="font-heading font-bold text-xs tracking-wide uppercase">Velocity Map</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <BookCover cover={primary.cover} title={primary.title} author={primary.author} size={40} />
        <div>
          <p className="font-drama text-base leading-tight">{primary.title}</p>
          <p className="font-data text-[10px] text-midgray mt-0.5">Trend velocity — last 24 hours</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-paper rounded-2xl p-4">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: "150px" }}>
          {[0, 25, 50, 75, 100].map((val) => {
            const y = padding + graphH - (val / 100) * graphH;
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={padding + graphW} y2={y} stroke="#111" strokeOpacity={0.05} strokeDasharray="2,5" />
                <text x={padding - 3} y={y + 3} fill="#6B6B6B" fontSize="7" fontFamily="Space Mono" textAnchor="end">{val}</text>
              </g>
            );
          })}
          <path d={areaD} fill="#E63B2E" fillOpacity={0.06} />
          <path ref={pathRef} d={pathD} fill="none" stroke="#E63B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="4" fill="#E63B2E" />
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="8" fill="#E63B2E" fillOpacity={0.15} />
        </svg>
      </div>

      <div className="flex items-center justify-between mt-5">
        <span className="font-data text-[11px] text-midgray">24h ago</span>
        <div className="flex items-baseline gap-1">
          <span className="font-data text-2xl font-bold text-signal">{data[data.length - 1]}</span>
          <span className="font-data text-xs text-midgray">/100</span>
        </div>
        <span className="font-data text-[11px] text-midgray">Now</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Features Section Wrapper
   ════════════════════════════════════════════════════ */
export default function Features({ booktokph, phbookclub, goodreads }) {
  const sectionRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.children;
      if (!cards) return;
      gsap.fromTo(cards, { y: 50, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-16 md:py-24 bg-paper">
      <div className="container-bp">
        <div className="mb-10 md:mb-14">
          <p className="font-data text-xs text-signal tracking-widest uppercase mb-3">// Trend Artifacts</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-none">Three lenses on</h2>
          <h2 className="font-drama text-3xl md:text-5xl lg:text-6xl text-signal leading-none mt-1">what Filipinos read.</h2>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <PlatformShuffler booktokph={booktokph} phbookclub={phbookclub} goodreads={goodreads} />
          <TelemetryFeed />
          <VelocityMap booktokph={booktokph} />
        </div>
      </div>
    </section>
  );
}
