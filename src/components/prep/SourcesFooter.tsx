import type { TavilyResponse } from "@/lib/prep/types";

export function SourcesFooter({
  results,
}: {
  results: Record<string, TavilyResponse>;
}) {
  const entries = Object.entries(results);
  if (entries.length === 0) return null;
  return (
    <details className="mt-10 bg-card border border-border rounded-xl">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground select-none">
        All sources ({totalUnique(results)})
      </summary>
      <div className="px-5 pb-5 space-y-5">
        {entries.map(([query, resp]) => (
          <div key={query}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {query}
            </div>
            <ul className="space-y-1.5">
              {(resp.results || []).map((r, i) => (
                <li key={i} className="text-sm">
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
          </div>
        ))}
      </div>
    </details>
  );
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function totalUnique(results: Record<string, TavilyResponse>) {
  const s = new Set<string>();
  for (const r of Object.values(results)) {
    for (const x of r.results || []) s.add(x.url);
  }
  return s.size;
}
