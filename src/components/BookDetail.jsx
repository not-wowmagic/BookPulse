import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { fetchBookHistory } from "../services/historyApi";

const pht = (value) => value ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value)) : "Not available";

function SeriesChart({ series }) {
  const points = series.flatMap((item) => item.points.map((point) => ({ ...point, label: `${item.source} · ${item.signalType}` })));
  if (points.length < 2) return <p className="detail-note">Not enough persisted points to draw a trend line.</p>;
  const times = points.map((p) => new Date(p.capturedAtUtc).getTime());
  const minT = Math.min(...times), maxT = Math.max(...times);
  const coordinates = (item) => {
    const values = item.points.map((point) => Number(point.value));
    const minV = Math.min(...values), maxV = Math.max(...values);
    return (point) => {
    const x = maxT === minT ? 150 : 10 + ((new Date(point.capturedAtUtc) - minT) / (maxT - minT)) * 280;
    const y = maxV === minV ? 60 : 110 - ((Number(point.value) - minV) / (maxV - minV)) * 100;
    return `${x},${y}`;
    };
  };
  return <><svg className="history-chart" viewBox="0 0 300 120" role="img" aria-label={`Trend chart containing ${points.length} persisted observations`}>{series.map((item, index) => <polyline key={`${item.source}-${item.signalType}`} points={[...item.points].sort((a,b) => new Date(a.capturedAtUtc) - new Date(b.capturedAtUtc)).map(coordinates(item)).join(" ")} fill="none" stroke="currentColor" strokeOpacity={Math.max(.35, 1 - index * .2)} strokeWidth="3" />)}</svg><p className="detail-note">Each signal line is scaled independently; unlike units are not compared.</p></>;
}

export default function BookDetail({ book, onClose }) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); const escape = (event) => event.key === "Escape" && onClose(); window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, [onClose]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", data: null, error: null });
    fetchBookHistory(book.canonicalKey || book.id, { signal: controller.signal }).then((data) => setState({ status: "ready", data, error: null })).catch((error) => {
      if (error.name !== "AbortError") setState({ status: "error", data: null, error: error.message });
    });
    return () => controller.abort();
  }, [book]);
  const h = state.data;
  return <div className="detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="book-detail" role="dialog" aria-modal="true" aria-labelledby="book-detail-title">
      <button ref={closeRef} className="detail-close" onClick={onClose} aria-label="Close book history"><X /></button>
      <p className="detail-kicker">Persisted trend history</p>
      <h2 id="book-detail-title">{book.title}</h2><p className="detail-author">{book.author}</p>
      {state.status === "loading" && <p role="status" className="detail-state">Loading historical observations…</p>}
      {state.status === "error" && <p role="alert" className="detail-state">{state.error}</p>}
      {h && <>
        <div className="detail-metrics">
          <div><small>Current score</small><strong>{h.current.score ?? "—"}</strong></div>
          <div><small>Snapshot score movement</small><strong>{h.current.scoreChange == null ? "—" : `${h.current.scoreChange > 0 ? "+" : ""}${h.current.scoreChange}`}</strong></div>
          <div><small>Current rank</small><strong>{h.current.rank ?? "—"}</strong></div>
          <div><small>Snapshot rank movement</small><strong>{h.current.rankChange == null ? "—" : `${h.current.rankChange > 0 ? "+" : ""}${h.current.rankChange}`}</strong></div>
          <div><small>Peak score</small><strong>{h.peakScore ?? "—"}</strong></div><div><small>Peak rank</small><strong>{h.peakRank ?? "—"}</strong></div>
        </div>
        {!h.sufficientHistory && <p className="detail-warning">Insufficient history — metrics will become more meaningful after additional successful snapshots.</p>}
        <SeriesChart series={h.series || []} />
        <p className="detail-note">First observed: {pht(h.firstSeenAtUtc)} PHT</p>
        <h3>Source breakdown</h3>
        {(h.series || []).length ? <ul className="detail-sources">{h.series.map((s) => <li key={`${s.source}-${s.signalType}`}><strong>{s.source}</strong><span>{s.signalType} · {s.unit} · {s.points.length} point{s.points.length === 1 ? "" : "s"}</span><small>Fresh as of {pht(s.points.at(-1)?.capturedAtUtc)} PHT</small></li>)}</ul> : <p className="detail-state">No persisted observations are available.</p>}
      </>}
    </aside>
  </div>;
}
