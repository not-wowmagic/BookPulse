import { useState, useRef, useCallback } from "react";

/**
 * BookCover — displays a book cover image with styled fallback.
 * Uses the hardcoded cover URL from the book data.
 * Detects Open Library's 1x1 transparent pixel "no cover" response via onLoad check.
 */
export default function BookCover({ cover, title, author, size = 48 }) {
  const [showFallback, setShowFallback] = useState(!cover);
  const imgRef = useRef(null);

  const initials = title
    .split(" ")
    .filter((w) => w.length > 1 && w[0] !== "(")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const w = size;
  const h = Math.round(size * 1.5);

  const handleLoad = useCallback(() => {
    // Open Library returns a 1x1 transparent GIF when it doesn't have a cover.
    // Detect this and switch to fallback.
    const img = imgRef.current;
    if (img && (img.naturalWidth <= 10 || img.naturalHeight <= 10)) {
      setShowFallback(true);
    }
  }, []);

  const handleError = useCallback(() => {
    setShowFallback(true);
  }, []);

  // Fallback placeholder
  const Placeholder = (
    <div
      className="flex-shrink-0 rounded-lg flex items-center justify-center"
      style={{
        width: w,
        height: h,
        minWidth: w,
        background: "linear-gradient(145deg, #1a1a1a 0%, #E63B2E 100%)",
      }}
    >
      <span
        className="font-heading font-bold text-white/90 tracking-wider"
        style={{ fontSize: Math.max(9, size * 0.22) }}
      >
        {initials}
      </span>
    </div>
  );

  if (showFallback) return Placeholder;

  return (
    <div
      className="flex-shrink-0 overflow-hidden rounded-lg shadow-md relative"
      style={{ width: w, height: h, minWidth: w }}
    >
      <img
        ref={imgRef}
        src={cover}
        alt={`${title} by ${author}`}
        className="w-full h-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
