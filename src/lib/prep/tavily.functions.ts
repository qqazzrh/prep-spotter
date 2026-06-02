import { createServerFn } from "@tanstack/react-start";
import type { TavilyResponse } from "./types";

export const tavilySearchFn = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    if (!data || typeof data.query !== "string" || data.query.length === 0) {
      throw new Error("query is required");
    }
    if (data.query.length > 500) throw new Error("query too long");
    return data;
  })
  .handler(async ({ data }): Promise<TavilyResponse> => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("Missing TAVILY_API_KEY");

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: data.query,
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
  });

export async function tavilySearch(query: string): Promise<TavilyResponse> {
  return tavilySearchFn({ data: { query } });
}
