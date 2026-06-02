import { createServerFn } from "@tanstack/react-start";
import type { TavilyResult, TavilyResponse, QuickScreen, DeepBrief } from "./types";

const QUICK_SYSTEM =
  "You are an experienced venture capitalist and startup research analyst. Given raw web search results about a founder and/or company, create a concise first-pass VC screen. The goal is to help a VC decide whether this is interesting enough for deeper diligence. Be direct, skeptical, evidence-based, and avoid hype. Flag unknowns clearly. Produce structured JSON with these exact keys: searchSummary, companyOneLiner, founderCredibility, companyClarity, recentMomentum, fundingSignal, marketCategory, competitors, reasonsToBeInterested, redFlagsOrUnknowns, quickVerdict, theOneQuestion. The 'searchSummary' field must be a single short paragraph (2-4 sentences, ~60 words) starting with 'Across N searches' (where N is the number of search queries provided) that synthesizes what was actually found across the searches — the strongest signals, the biggest gaps, and the overall picture. Be plain-spoken and concrete, no hype. Respond with ONLY a single JSON object, no prose, no markdown fences.";

const DEEP_SYSTEM =
  "You are an experienced venture capitalist who has invested in successful startups. Given raw web search results about a founder and/or company, create a deep VC diligence brief. Be skeptical, evidence-based, and practical. Separate verified facts from assumptions. Flag missing information. Produce structured JSON with these exact keys: searchSummary, executiveSummary, founderMarketFit, foundingTeam, publishedMaterialAndSocialPresence, companySnapshot, tractionValidation, marketSizing, competitorLandscape, fundingBenchmark, businessModel, risksAndRedFlags, diligenceQuestions, investmentView. The 'searchSummary' field must be a single short paragraph (2-4 sentences, ~60 words) starting with 'Across N searches' (where N is the number of search queries provided) that synthesizes what was actually found across the searches — the strongest signals, the biggest gaps, and the overall picture. Be plain-spoken and concrete, no hype. Respond with ONLY a single JSON object, no prose, no markdown fences.";


function relevanceTokens(name: string): string[] {
  return name.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
}

function filterRelevant(
  results: TavilyResult[],
  founder: string,
  company: string
): TavilyResult[] {
  const founderTokens = relevanceTokens(founder);
  const companyTokens = relevanceTokens(company);
  if (founderTokens.length === 0 && companyTokens.length === 0) return results;

  const relevant = results.filter((r) => {
    const text = `${r.title} ${r.content}`.toLowerCase();
    return (
      founderTokens.some((t) => text.includes(t)) ||
      companyTokens.some((t) => text.includes(t))
    );
  });

  return relevant.length > 0 ? relevant : results;
}

function buildUserMessage(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>,
  mode: "quick" | "deep"
) {
  const perQueryResults = mode === "deep" ? 3 : 4;
  const perResultChars = mode === "deep" ? 450 : 700;
  const trimmed: Record<string, unknown> = {};
  for (const [q, r] of Object.entries(results)) {
    const filtered = filterRelevant(r.results || [], founder, company);
    trimmed[q] = {
      answer: (r.answer || "").slice(0, 400),
      results: filtered.slice(0, perQueryResults).map((x) => ({
        title: x.title,
        url: x.url,
        content: (x.content || "").slice(0, perResultChars),
      })),
    };
  }
  return `Founder: ${founder || "(not provided)"}\nCompany: ${company || "(not provided)"}\n\nRaw search results (JSON):\n${JSON.stringify(trimmed)}`;
}

export type AnthropicOutcome<T> =
  | { kind: "ok"; data: T; raw: string }
  | { kind: "raw"; raw: string }
  | { kind: "error"; error: string };

async function callAnthropic(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = (json?.content || [])
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");
  return text;
}

function extractJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const generateBriefFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      mode: "quick" | "deep";
      founder: string;
      company: string;
      results: Record<string, TavilyResponse>;
    }) => {
      if (!data || (data.mode !== "quick" && data.mode !== "deep")) {
        throw new Error("invalid mode");
      }
      return data;
    }
  )
  .handler(async ({ data }) => {
    try {
      const system = data.mode === "quick" ? QUICK_SYSTEM : DEEP_SYSTEM;
      const raw = await callAnthropic(
        system,
        buildUserMessage(data.founder, data.company, data.results, data.mode),
        data.mode === "quick" ? 2000 : 3500
      );
      const parsed = extractJson(raw);
      if (parsed && typeof parsed === "object") {
        return { kind: "ok" as const, parsedJson: JSON.stringify(parsed), raw };
      }
      return { kind: "raw" as const, raw };
    } catch (e) {
      return { kind: "error" as const, error: e instanceof Error ? e.message : String(e) };
    }
  });

async function streamBrief(
  mode: "quick" | "deep",
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>,
  onDelta?: (chunk: string, accumulated: string) => void
): Promise<{ kind: "raw"; raw: string } | { kind: "error"; error: string }> {
  try {
    const resp = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, founder, company, results }),
    });
    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => "");
      return { kind: "error", error: `HTTP ${resp.status}: ${text.slice(0, 200)}` };
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      raw += chunk;
      onDelta?.(chunk, raw);
    }
    return { kind: "raw", raw };
  } catch (e) {
    return { kind: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function generateQuickScreen(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>,
  onDelta?: (chunk: string, accumulated: string) => void
): Promise<AnthropicOutcome<QuickScreen>> {
  const out = await streamBrief("quick", founder, company, results, onDelta);
  if (out.kind === "error") return out;
  const parsed = extractJson(out.raw);
  if (parsed && typeof parsed === "object") {
    return { kind: "ok", data: parsed as QuickScreen, raw: out.raw };
  }
  return { kind: "raw", raw: out.raw };
}

export async function generateDeepBrief(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>,
  onDelta?: (chunk: string, accumulated: string) => void
): Promise<AnthropicOutcome<DeepBrief>> {
  const out = await streamBrief("deep", founder, company, results, onDelta);
  if (out.kind === "error") return out;
  const parsed = extractJson(out.raw);
  if (parsed && typeof parsed === "object") {
    return { kind: "ok", data: parsed as DeepBrief, raw: out.raw };
  }
  return { kind: "raw", raw: out.raw };
}


