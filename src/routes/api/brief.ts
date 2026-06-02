import { createFileRoute } from "@tanstack/react-router";
import type { TavilyResponse } from "@/lib/prep/types";

const QUICK_SYSTEM =
  "You are an experienced venture capitalist and startup research analyst. Given raw web search results about a founder and/or company, create a concise first-pass VC screen. Be direct, skeptical, evidence-based, and avoid hype. Flag unknowns clearly. Produce structured JSON with these exact keys: searchSummary, companyOneLiner, founderCredibility, companyClarity, recentMomentum, fundingSignal, marketCategory, competitors, reasonsToBeInterested, redFlagsOrUnknowns, quickVerdict, theOneQuestion. The 'searchSummary' field must be a single short paragraph (2-4 sentences, ~60 words) starting with 'Across N searches' that synthesizes what was actually found. Respond with ONLY a single JSON object, no prose, no markdown fences.";

const DEEP_SYSTEM =
  "You are an experienced venture capitalist. Given raw web search results about a founder and/or company, create a deep VC diligence brief. Be skeptical, evidence-based, and practical. Separate verified facts from assumptions. Flag missing information. Keep prose tight — short bullets over long paragraphs. Produce structured JSON with these exact keys: searchSummary, executiveSummary, founderMarketFit, foundingTeam, publishedMaterialAndSocialPresence, companySnapshot, tractionValidation, marketSizing, competitorLandscape, fundingBenchmark, businessModel, risksAndRedFlags, diligenceQuestions, investmentView. The 'searchSummary' field must be a single short paragraph (2-4 sentences, ~60 words) starting with 'Across N searches' that synthesizes what was actually found. Respond with ONLY a single JSON object, no prose, no markdown fences.";

function buildUserMessage(
  founder: string,
  company: string,
  results: Record<string, TavilyResponse>,
  mode: "quick" | "deep"
) {
  const perQueryResults = mode === "deep" ? 2 : 4;
  const perResultChars = mode === "deep" ? 350 : 700;
  const trimmed: Record<string, unknown> = {};
  for (const [q, r] of Object.entries(results)) {
    trimmed[q] = {
      answer: (r.answer || "").slice(0, 300),
      results: (r.results || []).slice(0, perQueryResults).map((x) => ({
        title: x.title,
        url: x.url,
        content: (x.content || "").slice(0, perResultChars),
      })),
    };
  }
  return `Founder: ${founder || "(not provided)"}\nCompany: ${company || "(not provided)"}\n\nRaw search results (JSON):\n${JSON.stringify(trimmed)}`;
}

export const Route = createFileRoute("/api/brief")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });
        }
        const body = (await request.json()) as {
          mode: "quick" | "deep";
          founder: string;
          company: string;
          results: Record<string, TavilyResponse>;
        };
        if (body.mode !== "quick" && body.mode !== "deep") {
          return new Response("invalid mode", { status: 400 });
        }

        const system = body.mode === "quick" ? QUICK_SYSTEM : DEEP_SYSTEM;
        const user = buildUserMessage(body.founder, body.company, body.results, body.mode);

        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: body.mode === "quick" ? 2000 : 3500,
            system,
            stream: true,
            messages: [{ role: "user", content: user }],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(`Anthropic ${upstream.status}: ${text.slice(0, 300)}`, {
            status: 502,
          });
        }

        // Transform Anthropic SSE → plain text stream of content deltas.
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let buf = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                let idx: number;
                while ((idx = buf.indexOf("\n")) !== -1) {
                  let line = buf.slice(0, idx);
                  buf = buf.slice(idx + 1);
                  if (line.endsWith("\r")) line = line.slice(0, -1);
                  if (!line.startsWith("data: ")) continue;
                  const payload = line.slice(6).trim();
                  if (!payload) continue;
                  try {
                    const evt = JSON.parse(payload);
                    if (
                      evt.type === "content_block_delta" &&
                      evt.delta?.type === "text_delta" &&
                      typeof evt.delta.text === "string"
                    ) {
                      controller.enqueue(encoder.encode(evt.delta.text));
                    }
                  } catch {
                    // ignore partial / non-JSON
                  }
                }
              }
            } catch (e) {
              controller.error(e);
              return;
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
