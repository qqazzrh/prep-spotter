import type { QuickScreen, TavilyResponse } from "@/lib/prep/types";
import { VerdictBadge } from "./VerdictBadge";
import { useState } from "react";

export function QuickScreenView({
  founder,
  company,
  data,
  raw,
  results,
  onNew,
  onDeep,
}: {
  founder: string;
  company: string;
  data: QuickScreen | null;
  raw?: string;
  results: Record<string, TavilyResponse>;
  onNew: () => void;
  onDeep: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(results);
  const totalSources = new Set(
    entries.flatMap(([, r]) => (r.results || []).map((x) => x.url))
  ).size;

  const copy = async () => {
    const text = data?.searchSummary || raw || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-card border border-border rounded-xl p-5 mb-6 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Quick VC Screen</div>
          <div className="text-xl font-bold text-foreground mt-0.5">
            {[founder, company].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="ml-auto">
          <VerdictBadge verdict={data?.quickVerdict || "unclear"} />
        </div>
      </div>

      {/* Summary at top */}
      <div className="bg-card border-l-4 border-l-[oklch(0.85_0.14_220)] border border-border rounded-xl p-6 mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Research summary
        </div>
        {data?.searchSummary ? (
          <p className="text-foreground leading-relaxed text-base md:text-lg">
            {data.searchSummary}
          </p>
        ) : raw ? (
          <pre className="whitespace-pre-wrap text-sm text-foreground">{raw}</pre>
        ) : (
          <p className="text-muted-foreground">No summary available.</p>
        )}
      </div>

      {/* Sources — each query expandable, all links clickable */}
      {entries.length > 0 && (
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Sources ({totalSources}) across {entries.length} searches
          </div>
          <div className="space-y-2">
            {entries.map(([query, resp], idx) => (
              <details
                key={query}
                open={idx === 0}
                className="bg-card border border-border rounded-xl group"
              >
                <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-foreground select-none flex items-center justify-between">
                  <span className="truncate">{query}</span>
                  <span className="text-xs text-muted-foreground ml-3 shrink-0">
                    {(resp.results || []).length} results
                  </span>
                </summary>
                <ul className="px-5 pb-4 space-y-2">
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
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={onDeep}
          className="px-6 h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-95"
        >
          Dive into Deep VC Search →
        </button>
        <button
          onClick={onNew}
          className="px-4 h-12 rounded-lg border border-border text-foreground hover:bg-secondary"
        >
          Start new prep
        </button>
        <button
          onClick={copy}
          className="px-4 h-12 rounded-lg border border-border text-foreground hover:bg-secondary ml-auto"
        >
          {copied ? "Copied" : "Copy summary"}
        </button>
      </div>
    </div>
  );
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function formatQuick(_founder: string, _company: string, d: QuickScreen): string {
  return d.searchSummary || "";
}
