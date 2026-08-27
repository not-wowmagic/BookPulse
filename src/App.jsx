import { lazy, Suspense } from "react";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { useBookData } from "./hooks/useBookData";

/* Lazy-load below-fold sections for faster initial paint */
const BookOfTheWeek = lazy(() => import("./components/BookOfTheWeek"));
const ConvergenceDetector = lazy(() => import("./components/ConvergenceDetector"));
const TrendingBoard = lazy(() => import("./components/TrendingBoard"));
const Features = lazy(() => import("./components/Features"));
const DataProtocol = lazy(() => import("./components/DataProtocol"));
const EmailDigest = lazy(() => import("./components/EmailDigest"));
const Footer = lazy(() => import("./components/Footer"));

/* Minimal loading skeleton reused by Suspense boundaries */
function SectionSkeleton() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "24rem" }}
      role="status"
      aria-label="Loading section"
    >
      <div className="w-6 h-6 border-2 border-signal border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const {
    booktokph, phbookclub, goodreads, fullFeed,
    lastUpdated, status, mode, error,
    activeVibeFilter, setActiveVibeFilter,
    isDarkMode, setIsDarkMode,
  } = useBookData();

  return (
    <>
      {/* Global Noise Overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Skip-to-content link for keyboard users */}
      <a
        href="#trending-board"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:bg-signal focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-heading focus:text-sm focus:font-bold"
      >
        Skip to trending books
      </a>

      {/* Navbar (always visible) */}
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main>
        {/* Hero loads eagerly — it's above the fold */}
        <Hero lastUpdated={lastUpdated} />

        {/* Book of the Week */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <BookOfTheWeek fullFeed={fullFeed} />
          </Suspense>
        </ErrorBoundary>

        {/* Cross-Platform Convergence */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <ConvergenceDetector fullFeed={fullFeed} />
          </Suspense>
        </ErrorBoundary>

        {/* Trending Board (with filters, sparklines, momentum, etc.) */}
        <ErrorBoundary
          title="Trend data unavailable"
          message="BookPulse couldn't load the live rankings. The data pipeline may need a moment. Try refreshing."
        >
          <Suspense fallback={<SectionSkeleton />}>
            <TrendingBoard
              booktokph={booktokph}
              phbookclub={phbookclub}
              goodreads={goodreads}
              status={status}
              mode={mode}
              error={error}
              activeVibeFilter={activeVibeFilter}
              setActiveVibeFilter={setActiveVibeFilter}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Features (existing) */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <Features booktokph={booktokph} phbookclub={phbookclub} goodreads={goodreads} />
          </Suspense>
        </ErrorBoundary>

        {/* Data Protocol (existing) */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <DataProtocol />
          </Suspense>
        </ErrorBoundary>

        {/* Email Digest */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <EmailDigest />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
