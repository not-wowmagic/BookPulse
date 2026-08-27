const SOURCE_ROWS = [
  {
    source: "Reddit — r/phbookclub",
    availability: "Available when authorized",
    signal: "Discussion count per matched post",
    scope: "A Philippine book community; not a population-wide sample.",
  },
  {
    source: "TikTok",
    availability: "Not configured",
    signal: "No production observations",
    scope: "Research API approval is required; BookPulse does not scrape TikTok.",
  },
  {
    source: "Goodreads",
    availability: "Unavailable",
    signal: "No production observations",
    scope: "No supported new API-key route exists for this use case.",
  },
];

const METHOD_STEPS = [
  ["Collect", "Authorized adapters collect bounded provider records on the scheduled ingestion run."],
  ["Identify", "Normalized title and author form a stable canonical key; provider records are deduplicated."],
  ["Observe", "Every value keeps its source, signal type, unit, capture time, and available provider provenance."],
  ["Score", "Deterministic components separate current attention, momentum, breadth, freshness, and confidence."],
  ["Publish", "Only a sufficiently covered run replaces the persisted latest-known-good snapshot."],
];

export default function Methodology() {
  return (
    <section
      id="methodology"
      aria-labelledby="methodology-title"
      className="mx-4 my-32 rounded-[2rem] border-2 border-black bg-[#F5F3EE] px-6 py-12 text-[#111111] md:mx-8 md:px-12 lg:px-16"
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#E63B2E]">
        Methodology / version 1
      </p>
      <h2 id="methodology-title" className="mt-4 max-w-4xl font-heading text-4xl font-bold leading-none md:text-6xl">
        What a BookPulse number means
      </h2>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#6B6B6B] md:text-lg">
        BookPulse measures attention observed in configured book communities. It does not measure sales,
        reading quality, or all Filipino readers. API timestamps stay in UTC; the interface presents update
        times in Philippine time.
      </p>

      <ol className="mt-12 grid gap-4 md:grid-cols-5">
        {METHOD_STEPS.map(([title, description], index) => (
          <li key={title} className="rounded-[2rem] border border-black/20 bg-[#E8E4DD] p-6">
            <span className="font-mono text-xs text-[#E63B2E]">0{index + 1}</span>
            <h3 className="mt-3 font-heading text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{description}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 overflow-x-auto rounded-[2rem] border border-black/20">
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <caption className="sr-only">Production source availability and signal semantics</caption>
          <thead className="bg-[#111111] font-mono text-xs uppercase tracking-wider text-[#F5F3EE]">
            <tr>
              <th className="p-4">Source</th>
              <th className="p-4">Availability</th>
              <th className="p-4">Observed signal</th>
              <th className="p-4">Geographic meaning</th>
            </tr>
          </thead>
          <tbody>
            {SOURCE_ROWS.map((row) => (
              <tr key={row.source} className="border-t border-black/20 align-top">
                <th scope="row" className="p-4 font-heading text-sm font-bold">{row.source}</th>
                <td className="p-4 font-mono text-xs">{row.availability}</td>
                <td className="p-4 text-sm">{row.signal}</td>
                <td className="p-4 text-sm text-[#6B6B6B]">{row.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="font-heading text-2xl font-bold">Signal and score rules</h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#6B6B6B]">
            <li>Counts, cumulative counters, engagement, and ranking positions remain distinct signal types.</li>
            <li>Missing observations stay missing; BookPulse does not fill chart gaps or convert them to zero.</li>
            <li>Snapshot movement compares two persisted rankings and is not presented as a seven-day change.</li>
            <li>Score explanations expose component inputs, weights, contributions, and data sufficiency.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-2xl font-bold">Failures and demo mode</h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#6B6B6B]">
            <li>A partial source outage leaves the latest known-good published ranking in place.</li>
            <li>Freshness and source health disclose delayed, stale, failing, and unconfigured sources.</li>
            <li>Demo observations are allowed only in explicit demo mode and the interface labels that mode.</li>
            <li>Production never substitutes demo observations for an unavailable provider.</li>
          </ul>
        </div>
      </div>

      <p className="mt-10 border-t border-black/20 pt-6 font-mono text-xs leading-relaxed text-[#6B6B6B]">
        Collection is scheduled every 15 minutes, but provider latency, configuration, and failed runs can make
        the published snapshot older. “Philippines-first” describes source selection—not statistical
        representation of the Philippine population.
      </p>
    </section>
  );
}
