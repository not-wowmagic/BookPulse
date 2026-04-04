import { lazy, Suspense } from "react";
import Hero from "./components/Hero";
import ErrorBoundary from "./components/ErrorBoundary";
import { useBookData } from "./hooks/useBookData";

/* Lazy-load below-fold sections for faster initial paint */
const TrendingBoard = lazy(() => import("./components/TrendingBoard"));
const DataProtocol = lazy(() => import("./components/DataProtocol"));
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
  const { booktokph, phbookclub, goodreads, lastUpdated, region, setRegion } = useBookData();

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

      <main>
        {/* Hero loads eagerly — it's above the fold */}
        <Hero lastUpdated={lastUpdated} />

        {/* Below-fold: lazy loaded + error-resilient */}
        <ErrorBoundary
          title="Trend data unavailable"
          message="BookPulse couldn't load the live rankings. The data pipeline may need a moment. Try refreshing."
        >
          <Suspense fallback={<SectionSkeleton />}>
            <TrendingBoard
              booktokph={booktokph}
              phbookclub={phbookclub}
              goodreads={goodreads}
              activeRegion={region}
              setRegion={setRegion}
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <DataProtocol />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
