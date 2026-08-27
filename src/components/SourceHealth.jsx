import { useEffect, useState } from "react";
import { fetchSourceHealth } from "../services/historyApi";
const pht = (value) => value ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value)) : "Never";
const LABELS = { not_configured: "Not configured", never_run: "Never run" };
export default function SourceHealth() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => { const controller = new AbortController(); fetchSourceHealth({ signal: controller.signal }).then((data) => setState({ loading: false, data, error: null })).catch((e) => e.name !== "AbortError" && setState({ loading: false, data: null, error: e.message })); return () => controller.abort(); }, []);
  return <section className="source-health" aria-labelledby="source-health-title"><div className="container-bp"><p className="detail-kicker">Pipeline status</p><h2 id="source-health-title">Source health</h2>
    {state.loading && <p role="status">Loading persisted ingestion status…</p>}{state.error && <p role="alert">Source status is unavailable. The latest published ranking remains unchanged.</p>}
    {state.data && <><div className="health-grid">{state.data.sources.map((source) => <article key={source.source}><span className={`health-dot health-dot--${source.state}`} /><h3>{source.source}</h3><strong>{LABELS[source.state] || source.state}</strong><p>Last success: {pht(source.lastSuccessAtUtc)} PHT</p><p>{source.latestRecordCount == null ? "Record count unavailable" : `${source.latestRecordCount} records in latest success`}</p></article>)}</div><p className="health-policy">{state.data.outagePolicy}</p></>}
  </div></section>;
}
