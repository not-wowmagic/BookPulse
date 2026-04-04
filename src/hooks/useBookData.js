import { useState, useEffect, useCallback } from "react";
import { BOOKTOKPH_BOOKS, PHBOOKCLUB_BOOKS, GOODREADS_BOOKS } from "../data/books";

/**
 * Simulates real-time data polling every 60 seconds.
 * Perturbs trend scores and velocity to simulate live updates.
 * Returns separate platform data.
 */
export function useBookData() {
  const [booktokph, setBooktokph] = useState(BOOKTOKPH_BOOKS);
  const [phbookclub, setPhbookclub] = useState(PHBOOKCLUB_BOOKS);
  const [goodreads, setGoodreads] = useState(GOODREADS_BOOKS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [syncCount, setSyncCount] = useState(0);

  const perturbBooks = useCallback((books) => {
    return books.map((book) => {
      const delta = Math.floor(Math.random() * 5) - 2;
      const newScore = Math.max(0, Math.min(100, book.trendScore + delta));
      const mentionDelta = Math.floor(Math.random() * 300) - 80;
      const velDelta = Math.floor(Math.random() * 8) - 3;
      return {
        ...book,
        trendScore: newScore,
        mentions: Math.max(0, (book.mentions || 0) + mentionDelta),
        velocity: Math.max(0, Math.min(100, (book.velocity || 0) + velDelta)),
        trending: newScore >= 75,
      };
    });
  }, []);

  const refreshData = useCallback(() => {
    setBooktokph((prev) => perturbBooks(prev));
    setPhbookclub((prev) => perturbBooks(prev));
    setGoodreads((prev) => perturbBooks(prev));
    setLastUpdated(new Date());
    setSyncCount((c) => c + 1);
  }, [perturbBooks]);

  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return { booktokph, phbookclub, goodreads, lastUpdated, syncCount, refreshData };
}
