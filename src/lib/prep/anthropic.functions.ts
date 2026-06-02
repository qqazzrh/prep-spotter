import { createServerFn } from "@tanstack/react-start";
import type { TavilyResponse, QuickScreen, DeepBrief } from "./types";

const QUICK_SYSTEM =
  "You are an experienced venture capitalist and startup research analyst. Given raw web search results about a founder and/or company, create a concise first-pass VC screen. The goal is to help a VC decide whether this is interesting enough for deeper diligence. Be direct, skeptical, evidence-based, and avoid hype. Flag unknowns clearly. Produce structured JSON with these exact keys: companyOneLiner, founderCredibility, companyClarity, recentMomentum, fundingSignal, marketCategory, competitors, reasonsToBeInterested, redFlagsOrUnknowns, quickVerdict, theOneQuestion. Respond with ONLY a single JSON object, no prose, no markdown fences.";

const DEEP_SYSTEM =
  "You are an experienced venture capitalist who has invested in successful startups. Given raw web search results about a founder and/or company, create a deep VC diligence brief. Be skeptical, evidence-based, and practical. Separate verified facts from assumptions. Flag missing information. Produce structured JSON with these exact keys: executiveSummary, founderMarketFit, foundingTeam, publishedMaterialAndSocialPresence, companySnapshot, tractionValidation, marketSizing, competitorLandscape, fundingBenchmark, businessModel, risksAndRedFlags, diligenceQuestions, investmentView. Respond with ONLY a single JSON object, no prose, no markdown fences.";

function buildUserMessage(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>
) {
  const trimmed: Record<string, unknown> = {};
  for (const [q, r] of Object.entries(results)) {
    trimmed[q] = {
      answer: r.answer,
      results: (r.results || []).slice(0, 8).map((x) => ({
        title: x.title,
        url: x.url,
        content: (x.content || "").slice(0, 1500),
      })),
    };
  }
  return `Founder: ${founder || "(not provided)"}\nCompany: ${company || "(not provided)"}\n\nRaw search results (JSON):\n${JSON.stringify(trimmed)}`;
}

export type AnthropicOutcome<T> =
  | { kind: "ok"; data: T; raw: string }
  | { kind: "raw"; raw: string }
  | { kind: "error"; error: string };

async function callAnthropic(system: string, user: string): Promise<string> {
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
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
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
  .handler(async ({ data }): Promise<AnthropicOutcome<unknown>> => {
    try {
      const system = data.mode === "quick" ? QUICK_SYSTEM : DEEP_SYSTEM;
      const raw = await callAnthropic(
        system,
        buildUserMessage(data.founder, data.company, data.results)
      );
      const parsed = extractJson(raw);
      if (parsed && typeof parsed === "object") {
        return { kind: "ok", data: parsed, raw };
      }
      return { kind: "raw", raw };
    } catch (e) {
      return { kind: "error", error: e instanceof Error ? e.message : String(e) };
    }
  });

export async function generateQuickScreen(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>
): Promise<AnthropicOutcome<QuickScreen>> {
  return (await generateBriefFn({
    data: { mode: "quick", founder, company, results },
  })) as AnthropicOutcome<QuickScreen>;
}

export async function generateDeepBrief(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>
): Promise<AnthropicOutcome<DeepBrief>> {
  return (await generateBriefFn({
    data: { mode: "deep", founder, company, results },
  })) as AnthropicOutcome<DeepBrief>;
}
