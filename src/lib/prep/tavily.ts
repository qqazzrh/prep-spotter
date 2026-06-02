import type { TavilyResponse } from "./types";

export async function tavilySearch(query: string): Promise<TavilyResponse> {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_TAVILY_API_KEY");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      include_answer: true,
      search_depth: "advanced",
      max_results: 8,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}
