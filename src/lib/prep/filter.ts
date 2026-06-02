import type { TavilyResult } from "./types";

function nameVariants(name: string): string[] {
  if (!name.trim()) return [];
  const base = name.toLowerCase();
  // "NuraCare" → "nura care" so we match both spellings in external sources
  const spaced = base.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Individual words only if long enough to be distinctive (5+ chars)
  const longWords = spaced.split(/\s+/).filter((w) => w.length >= 5);
  return [...new Set([base, spaced, ...longWords])];
}

function hits(text: string, variants: string[]): boolean {
  return variants.length === 0 || variants.some((v) => text.includes(v));
}

export function filterRelevant(
  results: TavilyResult[],
  founder: string,
  company: string
): TavilyResult[] {
  const founderV = nameVariants(founder);
  const companyV = nameVariants(company);

  if (founderV.length === 0 && companyV.length === 0) return results;

  const relevant = results.filter((r) => {
    const title = r.title.toLowerCase();
    const full = `${r.title} ${r.content}`.toLowerCase();

    // At least one name must appear in the title (not just buried in scraped content)
    const titleMatch = hits(title, founderV) || hits(title, companyV);
    // Both names must appear somewhere in the full text
    const fullMatch = hits(full, founderV) && hits(full, companyV);

    return titleMatch && fullMatch;
  });

  return relevant.length > 0 ? relevant : results;
}
