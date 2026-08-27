import { useEffect, useState } from "react";
import { fetchBreakouts } from "../services/historyApi";

const REASONS = {
  multi_source_breakout: "Momentum is increasing across multiple sources.",
  single_source_spike: "A concentrated source spike is driving this signal.",
  recovery_or_growth: "Attention is recovering or growing above its baseline.",
  established_popularity: "Established attention remains elevated without breakout evidence.",
};

export default function BreakoutRadar({ onSelectBook }) {
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  useEffect(() => {
    const controller = new AbortController();
    fetchBreakouts({ signal: controller.signal }).then((payload) => setState({ status: payload.status, items: payload.items || [], error: null }))
      .catch((error) => error.name !== "AbortError" && setState({ status: "error", items: [], error: error.message }));
    return () => controller.abort();
  }, []);
  return <section className="breakout-radar" aria-labelledby="breakout-title"><div className="container-bp">
    <p className="detail-kicker">Unusual growth</p><h2 id="breakout-title">Breakout Radar</h2>
    <p className="detail-note">Ranks acceleration relative to persisted baseline—not overall popularity.</p>
    {state.status === "loading" && <p role="status">Calculating from persisted observations…</p>}
    {state.status === "error" && <p role="alert">{state.error}</p>}
    {state.status === "warming" && <p>No books have sufficient genuine history for breakout analysis yet.</p>}
    {state.items.length > 0 && <ol className="breakout-list">{state.items.map((item) => <li key={item.canonicalKey}>
      <button type="button" onClick={() => onSelectBook(item)}>
        <span className="font-data">{item.breakoutScore}</span><strong>{item.title}</strong><small>{item.author}</small>
        <p>{REASONS[item.breakoutReason] || item.breakoutReason}</p><small>Sources: {item.provenance.join(", ")}</small>
      </button>
    </li>)}</ol>}
  </div></section>;
}
