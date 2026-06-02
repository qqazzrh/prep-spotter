import type { DeepBrief, TavilyResponse } from "@/lib/prep/types";
import { VerdictBadge } from "./VerdictBadge";
import { SourcesFooter } from "./SourcesFooter";
import { useState } from "react";
import { elevenLabsTTS } from "@/lib/prep/elevenlabs";

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hideListen, setHideListen] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const text = data ? formatDeep(founder, company, data) : raw || "";

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const listen = async () => {
    if (!text) return;
    setLoadingAudio(true);
    try {
      const url = await elevenLabsTTS(text);
      setAudioUrl(url);
    } catch {
      setHideListen(true);
    } finally {
      setLoadingAudio(false);
    }
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

      {!data && raw && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <p className="text-sm text-[oklch(0.85_0.14_220)] mb-3">Structured parsing failed, showing raw brief.</p>
          <pre className="whitespace-pre-wrap text-sm text-foreground">{raw}</pre>
        </div>
      )}

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
        {!hideListen && (
          <button
            onClick={listen}
            disabled={loadingAudio}
            className="px-4 h-11 rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-60"
          >
            {loadingAudio ? "Generating audio…" : "Listen"}
          </button>
        )}
        {audioUrl && (
          <audio src={audioUrl} controls autoPlay className="h-11" />
        )}
      </div>

      <SourcesFooter results={results} />
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
