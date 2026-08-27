import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTrending } from "../services/trendingApi";

function readBool(key, fallback = false) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch { return fallback; }
}

const EMPTY_DATA = Object.freeze({ books: [], booktokph: [], phbookclub: [], goodreads: [] });

export function useBookData() {
  const [data, setData] = useState(EMPTY_DATA);
  const [status, setStatus] = useState("loading");
  const [mode, setMode] = useState("production");
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeVibeFilter, setActiveVibeFilter] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(() => readBool("bp-dark-mode", true));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "paper");
    try { localStorage.setItem("bp-dark-mode", String(isDarkMode)); } catch { /* ignore */ }
  }, [isDarkMode]);

  const refreshData = useCallback(async (signal) => {
    try {
      const result = await fetchTrending({ signal });
      setStatus(result.status);
      setMode(result.mode);
      setError(null);
      if (result.books.length) {
        setData(result);
        setLastUpdated(result.generatedAtUtc ? new Date(result.generatedAtUtc) : null);
      }
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      setStatus((current) => current === "ok" || current === "stale" ? "stale" : "error");
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => refreshData(controller.signal));
    const interval = setInterval(() => refreshData(controller.signal), 60_000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [refreshData]);

  const filterBooks = useCallback((books) => {
    if (activeVibeFilter === "convergent") return books.filter((book) => book.isConvergent);
    return books;
  }, [activeVibeFilter]);

  return {
    booktokph: useMemo(() => filterBooks(data.booktokph), [data.booktokph, filterBooks]),
    phbookclub: useMemo(() => filterBooks(data.phbookclub), [data.phbookclub, filterBooks]),
    goodreads: useMemo(() => filterBooks(data.goodreads), [data.goodreads, filterBooks]),
    fullFeed: data.books,
    lastUpdated, status, mode, error, refreshData,
    activeVibeFilter, setActiveVibeFilter,
    isDarkMode, setIsDarkMode,
  };
}
