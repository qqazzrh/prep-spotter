import type { DeepBrief, TavilyResponse } from "@/lib/prep/types";
import { VerdictBadge } from "./VerdictBadge";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";


const UNKNOWN = "Unknown from public sources.";

export function DeepBriefView({
  founder,
  company,
  data,
  raw,
  results,
  onNew,
}: {
  founder: string;
  company: string;
  data: DeepBrief | null;
  raw?: string;
  results: Record<string, TavilyResponse>;
  onNew: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const summary = getDeepSearchSummary(data, results, raw);

  const text = data ? formatDeep(founder, company, data) : raw || "";

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };


  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-card border border-border rounded-xl p-5 mb-6 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Deep Diligence Brief</div>
          <div className="text-xl font-bold text-foreground mt-0.5">
            {[founder, company].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="ml-auto">
          <VerdictBadge verdict={data?.investmentView?.recommendation || data?.executiveSummary?.investmentView || "unclear"} />
        </div>
      </div>

      {/* Research summary on top */}
      <div className="bg-card border-l-4 border-l-[oklch(0.85_0.14_220)] border border-border rounded-xl p-6 mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Research summary
        </div>
        <p className="text-foreground leading-relaxed text-base md:text-lg whitespace-pre-line">
          {summary}
        </p>
        {data && <SummaryHighlights data={data} />}
      </div>

      {/* Graph: risks by severity + traction confidence + competitors + scores */}
      {data && <DiligenceCharts data={data} />}

      {/* Expandable, clickable sources per query */}
      <ExpandableSources results={results} />

      {data && (
        <ol className="space-y-5 list-none">



          <Section n={1} title="Executive summary">
            <p className="text-foreground leading-relaxed">{data.executiveSummary?.summary || UNKNOWN}</p>
            <Kv k="Investment view" v={data.executiveSummary?.investmentView} />
            <Kv k="Why now" v={data.executiveSummary?.whyNow} />
          </Section>

          <Section n={2} title="Founder-market fit">
            <p className="text-foreground leading-relaxed">{data.founderMarketFit?.summary || UNKNOWN}</p>
            <SubList label="Strengths" items={data.founderMarketFit?.strengths} />
            <SubList label="Concerns" items={data.founderMarketFit?.concerns} />
            <Sources urls={data.founderMarketFit?.sourceUrls} />
          </Section>

          <Section n={3} title="Founding team">
            <p className="text-foreground leading-relaxed">{data.foundingTeam?.summary || UNKNOWN}</p>
            {data.foundingTeam?.knownTeamMembers?.length ? (
              <ul className="mt-2 space-y-1.5">
                {data.foundingTeam.knownTeamMembers.map((m, i) => (
                  <li key={i} className="text-sm text-foreground">
                    <span className="font-semibold">{m.name}</span>{" "}
                    <span className="text-muted-foreground">— {m.role}</span>
                    <div className="text-muted-foreground text-xs">{m.background}</div>
                  </li>
                ))}
              </ul>
            ) : null}
            <SubList label="Team gaps" items={data.foundingTeam?.teamGaps} />
            <Sources urls={data.foundingTeam?.sourceUrls} />
          </Section>

          <Section n={4} title="Published material and social presence">
            <p className="text-foreground leading-relaxed">{data.publishedMaterialAndSocialPresence?.summary || UNKNOWN}</p>
            {data.publishedMaterialAndSocialPresence?.notableMaterials?.length ? (
              <ul className="mt-2 space-y-1.5">
                {data.publishedMaterialAndSocialPresence.notableMaterials.map((m, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-muted-foreground text-xs uppercase mr-2">{m.type}</span>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[oklch(0.85_0.14_220)] hover:underline">
                      {m.title}
                    </a>
                    <div className="text-muted-foreground text-xs">{m.whyItMatters}</div>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section n={5} title="Company snapshot">
            <Kv k="What they do" v={data.companySnapshot?.whatTheyDo} />
            <Kv k="Customer" v={data.companySnapshot?.customer} />
            <Kv k="Problem" v={data.companySnapshot?.problem} />
            <Kv k="Product" v={data.companySnapshot?.product} />
            <Sources urls={data.companySnapshot?.sourceUrls} />
          </Section>

          <Section n={6} title="Traction validation">
            <p className="text-foreground leading-relaxed">{data.tractionValidation?.summary || UNKNOWN}</p>
            {data.tractionValidation?.signals?.length ? (
              <ul className="mt-2 space-y-2">
                {data.tractionValidation.signals.map((s, i) => (
                  <li key={i} className="text-sm">
                    <div className="text-foreground font-medium">{s.signal}</div>
                    <div className="text-muted-foreground">{s.evidence}</div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
                      confidence: {s.confidence}
                    </div>
                    <Sources urls={s.sourceUrls} />
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section n={7} title="Market sizing — TAM, SAM, SOM">
            <Kv k="TAM" v={data.marketSizing?.tam} />
            <Kv k="SAM" v={data.marketSizing?.sam} />
            <Kv k="SOM" v={data.marketSizing?.som} />
            <Kv k="Market growth" v={data.marketSizing?.marketGrowth} />
            <Kv k="Venture-scale" v={data.marketSizing?.isVentureScale} />
            <Sources urls={data.marketSizing?.sourceUrls} />
          </Section>

          <Section n={8} title="Competitor landscape">
            <p className="text-foreground leading-relaxed">{data.competitorLandscape?.summary || UNKNOWN}</p>
            {data.competitorLandscape?.competitors?.length ? (
              <ul className="mt-2 space-y-1.5">
                {data.competitorLandscape.competitors.map((c, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-foreground">{c.name}</span>{" "}
                    <span className="text-muted-foreground text-xs">[{c.category}]</span>
                    <div className="text-muted-foreground">{c.whyRelevant} · funding: {c.funding}</div>
                  </li>
                ))}
              </ul>
            ) : null}
            <Kv k="Differentiation" v={data.competitorLandscape?.differentiation} />
            <Kv k="Moat potential" v={data.competitorLandscape?.moatPotential} />
          </Section>

          <Section n={9} title="Funding benchmark">
            <Kv k="Company funding" v={data.fundingBenchmark?.companyFunding} />
            <Kv k="Benchmark" v={data.fundingBenchmark?.benchmarkAgainstSimilarCompanies} />
            <Kv k="Valuation signal" v={data.fundingBenchmark?.valuationSignal} />
            <Sources urls={data.fundingBenchmark?.sourceUrls} />
          </Section>

          <Section n={10} title="Business model">
            <p className="text-foreground leading-relaxed">{data.businessModel?.summary || UNKNOWN}</p>
            <Kv k="Pricing" v={data.businessModel?.pricingModel} />
            <Kv k="Likely buyer" v={data.businessModel?.likelyBuyer} />
            <Kv k="Sales motion" v={data.businessModel?.salesMotion} />
            <Kv k="Scalability concern" v={data.businessModel?.scalabilityConcern} />
          </Section>

          <Section n={11} title="Risks and red flags">
            {data.risksAndRedFlags?.length ? (
              <ul className="space-y-2">
                {data.risksAndRedFlags.map((r, i) => (
                  <li key={i}>
                    <div className="text-foreground">
                      <span className="text-xs uppercase tracking-wider mr-2 text-[oklch(0.7_0.2_22)]">
                        {r.severity}
                      </span>
                      {r.risk}
                    </div>
                    <div className="text-muted-foreground text-sm">{r.whyItMatters}</div>
                    <Sources urls={r.sourceUrls} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None surfaced from public sources.</p>
            )}
          </Section>

          <Section n={12} title="Diligence questions">
            {data.diligenceQuestions?.length ? (
              <ul className="space-y-2">
                {data.diligenceQuestions.map((q, i) => (
                  <li key={i}>
                    <div className="text-foreground">{q.question}</div>
                    <div className="text-muted-foreground text-sm">Why: {q.whyAsk}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{UNKNOWN}</p>
            )}
          </Section>

          <Section n={13} title="Investment view">
            <Kv k="Recommendation" v={data.investmentView?.recommendation} />
            <p className="text-foreground leading-relaxed mt-2">{data.investmentView?.reasoning}</p>
            <SubList label="Top reasons to invest" items={data.investmentView?.topReasonsToInvest} />
            <SubList label="Top reasons to pause" items={data.investmentView?.topReasonsToPause} />
          </Section>
        </ol>
      )}

      <div className="mt-8 flex flex-wrap gap-3 items-center">
        <button onClick={onNew} className="px-4 h-11 rounded-lg border border-border text-foreground hover:bg-secondary">
          Start new prep
        </button>
        <button onClick={copy} className="px-4 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-95">
          {copied ? "Copied" : "Copy brief"}
        </button>
      </div>
    </div>
  );
}

const SEVERITY_COLOR: Record<string, string> = {
  high: "oklch(0.65 0.22 25)",
  medium: "oklch(0.78 0.16 65)",
  low: "oklch(0.78 0.14 145)",
};
const CONFIDENCE_COLOR: Record<string, string> = {
  high: "oklch(0.78 0.14 145)",
  medium: "oklch(0.78 0.16 65)",
  low: "oklch(0.65 0.22 25)",
};

function getDeepSearchSummary(
  data: DeepBrief | null,
  results: Record<string, TavilyResponse>,
  raw?: string
) {
  if (data?.searchSummary?.trim()) return data.searchSummary.trim();

  const entries = Object.entries(results);
  const searchCount = entries.length;
  const sourceCount = new Set(
    entries.flatMap(([, response]) => (response.results || []).map((result) => result.url))
  ).size;
  const queryLabels = entries
    .slice(0, 3)
    .map(([query]) => query)
    .filter(Boolean);

  if (searchCount > 0) {
    const scope = queryLabels.length ? ` covering ${queryLabels.join(", ")}` : "";
    return `Across ${searchCount} searches${scope}, FounderLens found ${sourceCount} unique public sources. The structured summary was not returned by the model, so use the expandable sources below as the verified evidence base and treat any missing sections as unknowns until follow-up diligence confirms them.`;
  }

  if (raw?.trim()) {
    return raw.trim().slice(0, 500);
  }

  return "Across 0 searches, no public sources were available to synthesize. Try adding both founder and company name, then rerun Deep Diligence.";
}

function DiligenceCharts({ data }: { data: DeepBrief }) {
  const riskBuckets = ["high", "medium", "low"];
  const risks = riskBuckets.map((sev) => ({
    name: sev,
    value: (data.risksAndRedFlags || []).filter(
      (r) => (r.severity || "").toLowerCase() === sev
    ).length,
  }));
  const sigBuckets = ["high", "medium", "low"];
  const signals = sigBuckets.map((c) => ({
    name: c,
    value: (data.tractionValidation?.signals || []).filter(
      (s) => (s.confidence || "").toLowerCase() === c
    ).length,
  }));

  const hasRisks = risks.some((r) => r.value > 0);
  const hasSignals = signals.some((s) => s.value > 0);
  if (!hasRisks && !hasSignals) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {hasRisks && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Risks by severity
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={risks}>
                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                <YAxis allowDecimals={false} stroke="currentColor" className="text-muted-foreground text-xs" />
                <Tooltip cursor={{ fill: "oklch(0.3 0 0 / 0.2)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {risks.map((r) => (
                    <Cell key={r.name} fill={SEVERITY_COLOR[r.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {hasSignals && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Traction signals by confidence
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signals}>
                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                <YAxis allowDecimals={false} stroke="currentColor" className="text-muted-foreground text-xs" />
                <Tooltip cursor={{ fill: "oklch(0.3 0 0 / 0.2)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {signals.map((s) => (
                    <Cell key={s.name} fill={CONFIDENCE_COLOR[s.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
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

function ExpandableSources({ results }: { results: Record<string, TavilyResponse> }) {
  const entries = Object.entries(results);
  if (entries.length === 0) return null;
  const totalSources = new Set(
    entries.flatMap(([, r]) => (r.results || []).map((x) => x.url))
  ).size;
  return (
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
  );
}


function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        {n}. {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </li>
  );
}

function Kv({ k, v }: { k: string; v?: string }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{k}: </span>
      <span className="text-foreground">{v || UNKNOWN}</span>
    </div>
  );
}

function SubList({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <ul className="list-disc list-inside text-foreground space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}

function Sources({ urls }: { urls?: string[] }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="mt-1 text-xs">
      <span className="text-muted-foreground">Sources: </span>
      {urls.map((u, i) => (
        <a key={i} href={u} target="_blank" rel="noopener noreferrer"
          className="text-[oklch(0.85_0.14_220)] hover:underline mr-2">
          [{i + 1}]
        </a>
      ))}
    </div>
  );
}

export function formatDeep(founder: string, company: string, d: DeepBrief): string {
  const L: string[] = [];
  L.push("PREP — DEEP DILIGENCE BRIEF");
  L.push([founder, company].filter(Boolean).join(" · "));
  L.push("");
  L.push("Executive summary:");
  L.push(d.executiveSummary?.summary || "");
  L.push(`Investment view: ${d.executiveSummary?.investmentView}`);
  L.push(`Why now: ${d.executiveSummary?.whyNow}`);
  L.push("");
  L.push("Founder-market fit:");
  L.push(d.founderMarketFit?.summary || "");
  L.push("");
  L.push("Founding team:");
  L.push(d.foundingTeam?.summary || "");
  (d.foundingTeam?.knownTeamMembers || []).forEach(m =>
    L.push(`- ${m.name} (${m.role}): ${m.background}`)
  );
  L.push("");
  L.push("Company snapshot:");
  L.push(`What: ${d.companySnapshot?.whatTheyDo}`);
  L.push(`Customer: ${d.companySnapshot?.customer}`);
  L.push(`Problem: ${d.companySnapshot?.problem}`);
  L.push(`Product: ${d.companySnapshot?.product}`);
  L.push("");
  L.push("Traction:");
  L.push(d.tractionValidation?.summary || "");
  (d.tractionValidation?.signals || []).forEach(s =>
    L.push(`- ${s.signal} (${s.confidence}): ${s.evidence}`)
  );
  L.push("");
  L.push(`Market — TAM: ${d.marketSizing?.tam}, SAM: ${d.marketSizing?.sam}, SOM: ${d.marketSizing?.som}, growth: ${d.marketSizing?.marketGrowth}, venture-scale: ${d.marketSizing?.isVentureScale}`);
  L.push("");
  L.push("Competitors:");
  L.push(d.competitorLandscape?.summary || "");
  (d.competitorLandscape?.competitors || []).forEach(c =>
    L.push(`- ${c.name} [${c.category}, funding ${c.funding}]: ${c.whyRelevant}`)
  );
  L.push(`Differentiation: ${d.competitorLandscape?.differentiation}`);
  L.push(`Moat: ${d.competitorLandscape?.moatPotential}`);
  L.push("");
  L.push(`Funding benchmark: ${d.fundingBenchmark?.companyFunding} | ${d.fundingBenchmark?.benchmarkAgainstSimilarCompanies} | signal: ${d.fundingBenchmark?.valuationSignal}`);
  L.push("");
  L.push("Business model:");
  L.push(d.businessModel?.summary || "");
  L.push(`Pricing: ${d.businessModel?.pricingModel} | Buyer: ${d.businessModel?.likelyBuyer} | Motion: ${d.businessModel?.salesMotion}`);
  L.push(`Scalability concern: ${d.businessModel?.scalabilityConcern}`);
  L.push("");
  L.push("Risks:");
  (d.risksAndRedFlags || []).forEach(r =>
    L.push(`- [${r.severity}] ${r.risk} — ${r.whyItMatters}`)
  );
  L.push("");
  L.push("Diligence questions:");
  (d.diligenceQuestions || []).forEach(q => L.push(`- ${q.question} (why: ${q.whyAsk})`));
  L.push("");
  L.push(`Investment view: ${d.investmentView?.recommendation}`);
  L.push(d.investmentView?.reasoning || "");
  if (d.investmentView?.topReasonsToInvest?.length) {
    L.push("Top reasons to invest:");
    d.investmentView.topReasonsToInvest.forEach(r => L.push(`- ${r}`));
  }
  if (d.investmentView?.topReasonsToPause?.length) {
    L.push("Top reasons to pause:");
    d.investmentView.topReasonsToPause.forEach(r => L.push(`- ${r}`));
  }
  return L.join("\n");
}
