import type { TavilyResponse, TavilyResult } from "@/lib/prep/types";

const MAX_SOURCES = 8;
const RELEVANCE_THRESHOLD = 0.3;

export function SourcesFooter({
  results,
}: {
  results: Record<string, TavilyResponse>;
}) {
  const entries = Object.entries(results);
  if (entries.length === 0) return null;

  const top = pickRelevantSources(results);

  return (
    <details className="mt-10 bg-card border border-border rounded-xl" open>
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground select-none">
        Relevant sources ({top.length})
      </summary>
      <div className="px-5 pb-5">
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No clearly relevant sources surfaced from the searches. The summary
            above relies on weak or indirect signals — treat it as a starting
            point and verify independently.
          </p>
        ) : (
          <ul className="space-y-2">
            {top.map((r) => (
              <li key={r.url} className="text-sm">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[oklch(0.85_0.14_220)] hover:underline break-words"
                >
                  {r.title || r.url}
                </a>{" "}
                <span className="text-xs text-muted-foreground">
                  · {domainOf(r.url)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

function pickRelevantSources(
  results: Record<string, TavilyResponse>
): TavilyResult[] {
  const bestByUrl = new Map<string, TavilyResult>();
  for (const resp of Object.values(results)) {
    for (const r of resp.results || []) {
      if (!r.url) continue;
      const prev = bestByUrl.get(r.url);
      if (!prev || (r.score ?? 0) > (prev.score ?? 0)) {
        bestByUrl.set(r.url, r);
      }
    }
  }
  const all = Array.from(bestByUrl.values()).sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );
  const relevant = all.filter((r) => (r.score ?? 0) >= RELEVANCE_THRESHOLD);
  // If Tavily returned scores, filter by threshold; otherwise fall back to top N.
  const hasScores = all.some((r) => typeof r.score === "number");
  const pool = hasScores ? relevant : all;
  return pool.slice(0, MAX_SOURCES);
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
