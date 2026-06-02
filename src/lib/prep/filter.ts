import type { TavilyResult } from "./types";

function relevanceTokens(name: string): string[] {
  return name.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
}

export function filterRelevant(
  results: TavilyResult[],
  founder: string,
  company: string
): TavilyResult[] {
  const founderTokens = relevanceTokens(founder);
  const companyTokens = relevanceTokens(company);

  if (founderTokens.length === 0 && companyTokens.length === 0) return results;

  const relevant = results.filter((r) => {
    const text = `${r.title} ${r.content}`.toLowerCase();
    // If a name was provided, the result must mention it; if not provided, skip that check
    const matchesFounder = founderTokens.length === 0 || founderTokens.some((t) => text.includes(t));
    const matchesCompany = companyTokens.length === 0 || companyTokens.some((t) => text.includes(t));
    return matchesFounder && matchesCompany;
  });

  return relevant.length > 0 ? relevant : results;
}
