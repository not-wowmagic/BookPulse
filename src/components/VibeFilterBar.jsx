import { useRef, useEffect } from "react";
import gsap from "gsap";

const FILTER_OPTIONS = [
  { key: "all", label: "All books" },
  { key: "convergent", label: "Multi-source" },
];

/**
 * VibeFilterBar — Horizontally scrollable pill bar for vibe-based filtering.
 * Placed at the top of TrendingBoard.
 */
export default function VibeFilterBar({ activeFilter, setActiveFilter }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.fromTo(
        barRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div
      ref={barRef}
      className="vibe-filter-bar"
      role="toolbar"
      aria-label="Filter trend books"
      style={{ opacity: 0 }}
    >
      <div className="vibe-filter-scroll">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(isActive ? "all" : opt.key)}
              className={`vibe-pill ${isActive ? "vibe-pill--active" : ""}`}
              aria-pressed={isActive}
              aria-label={`Filter by ${opt.label}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
