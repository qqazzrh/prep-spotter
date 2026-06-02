import { createServerFn } from "@tanstack/react-start";
import type { TavilyResponse, QuickScreen, DeepBrief } from "./types";

const QUICK_SYSTEM =
  "You are an experienced venture capitalist and startup research analyst. Given raw web search results about a founder and/or company, create a concise first-pass VC screen. Be direct, skeptical, evidence-based, no hype. Flag unknowns. Produce ONE JSON object with these required keys: searchSummary, companyOneLiner, founderCredibility, companyClarity, recentMomentum, fundingSignal, marketCategory, competitors, reasonsToBeInterested, redFlagsOrUnknowns, quickVerdict, theOneQuestion. 'searchSummary' is one 2-4 sentence paragraph starting 'Across N searches' that synthesizes the strongest signals, biggest gaps, and overall picture. Plain-spoken, sentence case.\n\nALSO include these optional rich keys when evidence supports them (omit a key entirely if you'd be guessing): meta {round, valuation, sector, founded, competingTermSheets}; founderProfile {initials, name, title, credentials[], scores {founderMarketFit, domainExpertise, salesGtm, technicalDepth, resilience} all 0-100}; coFounder {initials, name, title, credentials, fit}; criticalGap {title, note}; verdictLabel ('STRONG PASS'|'CONDITIONAL'|'PASS'|'NO'); verdictHeadline (short sentence-case headline); convictionSummary (3-4 sentence quoted conviction summary, sentence case, the most important text on the page); questionsToAsk [{topic, question}] (max 5); conviction {score 0-100, categoryScores {team, market, traction, business, riskLegal} 0-100, weighting}; market {growthPctYoY, direction 'expanding'|'contracting', tam, sam, som, tailwind, headwind}; greenSignals [{label, text}] max 6; riskSignals [{label, text, severity 'moderate'|'critical'}] max 6.\n\nReturn ONLY one complete JSON object, no prose, no markdown fences.";


const DEEP_SYSTEM =
  "You are an experienced venture capitalist who has invested in successful startups. Given raw web search results about a founder and/or company, create a deep VC diligence brief. Be skeptical, evidence-based, and practical. Separate verified facts from assumptions. Flag missing information. Produce structured JSON with these exact keys: searchSummary, executiveSummary, founderMarketFit, foundingTeam, publishedMaterialAndSocialPresence, companySnapshot, tractionValidation, marketSizing, competitorLandscape, fundingBenchmark, businessModel, risksAndRedFlags, diligenceQuestions, investmentView. The 'searchSummary' field must be a single short paragraph (2-4 sentences, ~60 words) starting with 'Across N searches' (where N is the number of search queries provided) that synthesizes what was actually found across the searches — the strongest signals, the biggest gaps, and the overall picture. Be plain-spoken and concrete, no hype. Respond with ONLY a single JSON object, no prose, no markdown fences.";



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
    trimmed[q] = {
      answer: (r.answer || "").slice(0, 400),
      results: (r.results || []).slice(0, perQueryResults).map((x) => ({
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

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasObject(value: Record<string, unknown>, key: string) {
  return isObject(value[key]);
}

function hasArray(value: Record<string, unknown>, key: string) {
  return Array.isArray(value[key]);
}

function childHasArray(value: Record<string, unknown>, child: string, key: string) {
  return isObject(value[child]) && Array.isArray(value[child][key]);
}

function isDeepBriefShape(value: unknown): value is DeepBrief {
  if (!isObject(value)) return false;
  return (
    hasObject(value, "executiveSummary") &&
    hasObject(value, "founderMarketFit") &&
    hasObject(value, "foundingTeam") &&
    hasObject(value, "companySnapshot") &&
    hasObject(value, "tractionValidation") &&
    hasObject(value, "marketSizing") &&
    hasObject(value, "competitorLandscape") &&
    hasObject(value, "fundingBenchmark") &&
    hasObject(value, "businessModel") &&
    hasObject(value, "investmentView") &&
    hasArray(value, "risksAndRedFlags") &&
    hasArray(value, "diligenceQuestions") &&
    childHasArray(value, "foundingTeam", "knownTeamMembers") &&
    childHasArray(value, "foundingTeam", "teamGaps") &&
    childHasArray(value, "publishedMaterialAndSocialPresence", "notableMaterials") &&
    childHasArray(value, "tractionValidation", "signals") &&
    childHasArray(value, "competitorLandscape", "competitors") &&
    childHasArray(value, "investmentView", "topReasonsToInvest") &&
    childHasArray(value, "investmentView", "topReasonsToPause")
  );
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
  if (isDeepBriefShape(parsed)) {
    return { kind: "ok", data: parsed as DeepBrief, raw: out.raw };
  }
  return { kind: "raw", raw: out.raw };
}


