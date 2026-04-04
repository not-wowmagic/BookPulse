import Hero from "./components/Hero";
import TrendingBoard from "./components/TrendingBoard";
import DataProtocol from "./components/DataProtocol";
import Footer from "./components/Footer";
import { useBookData } from "./hooks/useBookData";

export default function App() {
  const { booktokph, phbookclub, goodreads, lastUpdated } = useBookData();

  return (
    <>
      {/* Global Noise Overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Sections */}
      <main>
        <Hero lastUpdated={lastUpdated} />
        <TrendingBoard booktokph={booktokph} phbookclub={phbookclub} goodreads={goodreads} />
        <DataProtocol />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
