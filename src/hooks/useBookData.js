import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { runEnrichmentPipeline } from "../services/engine";
import { generateCinematicPoster } from "../utils/seo";

export function useBookData() {
  const [rawResults, setRawResults] = useState({ booktokph: [], phbookclub: [], goodreads: [] });
  const [region, setRegion] = useState("National");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const isRunning = useRef(false);

  const appendLog = useCallback((message) => {
    setTelemetryLogs((prev) => [...prev, message]);
  }, []);

  const refreshData = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    
    await new Promise(res => setTimeout(res, 500));
    
    setTelemetryLogs([]);
    
    try {
      const result = await runEnrichmentPipeline(appendLog);
      setRawResults(result);
      if (result.booktokph.length > 0) {
         setLastUpdated(new Date());
         
         // Generate cinematic posters metadata for the #1 book overall (e.g. from fullFeed if possible, or just top of BookTokPH)
         if (result.fullFeed && result.fullFeed.length > 0) {
           generateCinematicPoster(result.fullFeed[0]);
         } else {
           generateCinematicPoster(result.booktokph[0]);
         }
      }
    } catch (err) {
      appendLog(`Error in pipeline: ${err.message}`);
    } finally {
      isRunning.current = false;
    }
  }, [appendLog]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Derive region-specific sorted lists
  const deriveRegionList = useCallback((list, activeRegion) => {
    if (!list) return [];
    return [...list].sort((a, b) => {
      const scoreA = a.regionScores ? a.regionScores[activeRegion] : a.velocityScore;
      const scoreB = b.regionScores ? b.regionScores[activeRegion] : b.velocityScore;
      return (scoreB || 0) - (scoreA || 0);
    }).map(book => ({
      ...book,
      trendScore: book.regionScores ? book.regionScores[activeRegion] : book.velocityScore,
    }));
  }, []);

  const booktokph = useMemo(() => deriveRegionList(rawResults.booktokph, region), [rawResults.booktokph, region, deriveRegionList]);
  const phbookclub = useMemo(() => deriveRegionList(rawResults.phbookclub, region), [rawResults.phbookclub, region, deriveRegionList]);
  const goodreads = useMemo(() => deriveRegionList(rawResults.goodreads, region), [rawResults.goodreads, region, deriveRegionList]);

  return { booktokph, phbookclub, goodreads, lastUpdated, telemetryLogs, refreshData, region, setRegion };
}
