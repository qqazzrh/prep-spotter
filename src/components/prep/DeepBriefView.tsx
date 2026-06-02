import type { DeepBrief, TavilyResponse, TavilyResult } from "@/lib/prep/types";
import { useState } from "react";
import {
  Link as LinkIcon,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

/* ====================================================================
   Deep Diligence Brief — same visual language as QuickScreenView,
   but expanded with the full DeepBrief schema.
   ==================================================================== */

const GREEN = "oklch(0.74 0.17 150)";
const AMBER = "oklch(0.78 0.16 75)";
const RED = "oklch(0.62 0.22 22)";

const UNKNOWN = "Unknown from public sources.";

function txt(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}
function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

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
  const copy = async () => {
    const text = data ? formatDeep(founder, company, data) : "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Parse failure → clean error state, never dump raw JSON.
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Deep diligence brief
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {titleCase(company) || company || titleCase(founder) || "Result"}
        </h1>
        <p className="mt-6 text-[14px] leading-[1.6] text-foreground/80">
          The model returned a response we couldn&rsquo;t parse into the
          brief schema. This usually clears up on a retry.
        </p>
        {raw && (
          <details className="mt-6 text-left">
            <summary className="text-[12px] text-muted-foreground cursor-pointer">
              Show raw model output
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-card p-3 text-[12px] text-foreground/70">
              {raw}
            </pre>
          </details>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={onNew}
            className="rounded-md border border-border px-4 py-2 text-[14px] text-foreground hover:bg-card"
          >
            Start new prep
          </button>
        </div>
      </div>
    );
  }

  const subject =
    titleCase(company) || company || titleCase(founder) || "—";

  const recRaw = txt(data.investmentView?.recommendation) || txt(data.executiveSummary?.investmentView);
  const verdictTag = verdictLabel(recRaw);
  const tone = verdictTone(verdictTag);

  const headline =
    txt(data.executiveSummary?.summary).split(/(?<=[.!?])\s+/)[0] ||
    derivedHeadline(verdictTag);

  // Derive a 0–100 conviction score from filled-in sections.
  const scores = deriveScores(data);
  const overall = Math.round(
    (scores.team + scores.market + scores.traction + scores.business + scores.riskLegal) / 5
  );

  // Founder card
  const lead = data.foundingTeam?.knownTeamMembers?.[0];
  const founderName = txt(lead?.name) || titleCase(founder) || "";
  const founderTitle = txt(lead?.role);
  const founderInitials = initialsOf(founderName);
  const founderCreds = (data.founderMarketFit?.strengths || []).slice(0, 5);

  // Signals
  const greens = (data.investmentView?.topReasonsToInvest || []).map((s) => ({
    label: shortLabel(txt(s)),
    text: txt(s),
  }));
  const risks = (data.risksAndRedFlags || []).map((r) => ({
    label: shortLabel(txt(r.risk)),
    text: txt(r.risk) + (txt(r.whyItMatters) ? ` — ${txt(r.whyItMatters)}` : ""),
    severity: (txt(r.severity) || "moderate").toLowerCase(),
  }));

  // Market card data
  const market = data.marketSizing;
  const hasMarket = !!(market?.tam || market?.sam || market?.som || market?.marketGrowth);

  const sourceGroups = buildSourceGroups(results);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ fontSize: 14, lineHeight: 1.6 }}>
      {/* 1. Header */}
      <header className="mb-6">
        <SectionLabel>Deep diligence brief</SectionLabel>
        <h1 className="mt-1.5 text-3xl md:text-4xl text-foreground font-semibold tracking-tight">
          {subject}
        </h1>
        <MetaPills data={data} />
      </header>

      {/* 2-4. Hero row */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Founder & team */}
        <aside className="col-span-12 lg:col-span-3">
          <Card>
            <SectionLabel>Founder &amp; team</SectionLabel>
            <div className="mt-4 flex items-start gap-3">
              <Avatar initials={founderInitials} color="primary" />
              <div className="min-w-0">
                <div className="text-foreground font-semibold leading-tight">
                  {founderName || "—"}
                </div>
                <div className="text-muted-foreground text-[13px]">{founderTitle}</div>
              </div>
            </div>

            {founderCreds.length > 0 && (
              <ul className="mt-4 space-y-2">
                {founderCreds.map((c, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-foreground/90">
                    <span
                      className="mt-1.5 inline-block size-1.5 rotate-45 shrink-0"
                      style={{ background: GREEN }}
                      aria-hidden
                    />
                    <span>{txt(c)}</span>
                  </li>
                ))}
              </ul>
            )}

            {(data.foundingTeam?.knownTeamMembers || []).slice(1, 4).map((m, i) => (
              <div
                key={i}
                className="mt-3 border border-border rounded-lg p-3 flex items-center gap-3"
              >
                <Avatar initials={initialsOf(txt(m.name))} color="muted" />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground text-[13px] font-medium truncate">
                    {txt(m.name)}
                  </div>
                  <div className="text-muted-foreground text-[12px] truncate">
                    {txt(m.role)}
                    {m.background ? ` · ${txt(m.background)}` : ""}
                  </div>
                </div>
              </div>
            ))}

            {(data.foundingTeam?.teamGaps || []).length > 0 && (
              <div
                className="mt-3 rounded-lg border p-3 flex gap-2 items-start"
                style={{
                  borderColor: AMBER,
                  background: `color-mix(in oklab, ${AMBER} 8%, transparent)`,
                }}
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: AMBER }} />
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: AMBER }}>
                    Team gaps
                  </div>
                  <ul className="text-[12px] text-foreground/80 space-y-0.5 mt-0.5">
                    {data.foundingTeam!.teamGaps.slice(0, 3).map((g, i) => (
                      <li key={i}>• {txt(g)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(data.founderMarketFit?.concerns || []).length > 0 && (
              <div className="mt-3">
                <SectionLabel>Founder-market concerns</SectionLabel>
                <ul className="mt-2 space-y-1 text-[12px] text-foreground/80">
                  {data.founderMarketFit!.concerns.slice(0, 3).map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="mt-1.5 inline-block size-1.5 rotate-45 shrink-0"
                        style={{ background: AMBER }}
                      />
                      <span>{txt(c)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </aside>

        {/* Verdict + executive summary + diligence questions */}
        <section className="col-span-12 lg:col-span-6">
          <Card accentBorder={tone.color}>
            <div
              className="text-[11px] uppercase tracking-[0.14em] font-bold"
              style={{ color: tone.color }}
            >
              {verdictTag}
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-foreground tracking-tight">
              {headline}
            </h2>
            {data.executiveSummary?.summary && (
              <p className="mt-3 italic text-foreground/90">
                &ldquo;{txt(data.executiveSummary.summary)}&rdquo;
              </p>
            )}

            {data.executiveSummary?.whyNow && (
              <div className="mt-4">
                <SectionLabel>Why now</SectionLabel>
                <p className="mt-1.5 text-[14px] text-foreground/90">
                  {txt(data.executiveSummary.whyNow)}
                </p>
              </div>
            )}

            {data.investmentView?.reasoning && (
              <div className="mt-4">
                <SectionLabel>Reasoning</SectionLabel>
                <p className="mt-1.5 text-[14px] text-foreground/90">
                  {txt(data.investmentView.reasoning)}
                </p>
              </div>
            )}

            {(data.diligenceQuestions || []).length > 0 && (
              <div className="mt-5">
                <SectionLabel>Diligence questions</SectionLabel>
                <ol className="mt-3 space-y-2.5">
                  {data.diligenceQuestions!.slice(0, 6).map((q, i) => (
                    <li key={i} className="flex gap-3 text-[14px]">
                      <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-md border border-border text-[11px] text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-foreground/95">{txt(q.question)}</span>
                        {q.whyAsk && (
                          <span className="text-muted-foreground"> — {txt(q.whyAsk)}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </section>

        {/* Conviction / scores */}
        <aside className="col-span-12 lg:col-span-3">
          <Card>
            <div
              className="text-5xl font-semibold tabular-nums leading-none"
              style={{ color: scoreColor(overall) }}
            >
              {overall}
            </div>
            <div className="mt-1.5 text-[12px] text-muted-foreground">
              / 100 diligence score
            </div>

            <div className="mt-5">
              <SectionLabel>Category scores</SectionLabel>
            </div>
            <div className="mt-3 space-y-2.5">
              <ScoreBar label="Team" value={scores.team} />
              <ScoreBar label="Market" value={scores.market} />
              <ScoreBar label="Traction" value={scores.traction} />
              <ScoreBar label="Business" value={scores.business} />
              <ScoreBar label="Risk / Legal" value={scores.riskLegal} />
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Equal-weighted</span>
              <span
                className="text-[13px] font-semibold tabular-nums"
                style={{ color: scoreColor(overall) }}
              >
                {overall}
              </span>
            </div>
          </Card>
        </aside>
      </div>

      {/* 5. Market opportunity */}
      {hasMarket && <MarketCard market={market!} />}

      {/* 6. Green + Risk signals */}
      {(greens.length > 0 || risks.length > 0) && (
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 md:col-span-6">
            <Card>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4" style={{ color: GREEN }} />
                <SectionLabel style={{ color: GREEN }}>Reasons to invest</SectionLabel>
              </div>
              <ul className="mt-4 space-y-3">
                {greens.slice(0, 8).map((s, i) => (
                  <SignalRow key={i} label={s.label} text={s.text} kind="good" />
                ))}
                {greens.length === 0 && (
                  <li className="text-[13px] text-muted-foreground">No clear green signals.</li>
                )}
              </ul>
              {(data.investmentView?.topReasonsToPause || []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                  <SectionLabel>Reasons to pause</SectionLabel>
                  <ul className="mt-2 space-y-1.5 text-[13px] text-foreground/85">
                    {data.investmentView!.topReasonsToPause.slice(0, 5).map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span
                          className="mt-1.5 inline-block size-1.5 rotate-45 shrink-0"
                          style={{ background: AMBER }}
                        />
                        <span>{txt(r)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
          <div className="col-span-12 md:col-span-6">
            <Card>
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4" style={{ color: AMBER }} />
                <SectionLabel style={{ color: AMBER }}>Risks &amp; red flags</SectionLabel>
              </div>
              <ul className="mt-4 space-y-3">
                {risks.slice(0, 8).map((s, i) => (
                  <SignalRow
                    key={i}
                    label={s.label}
                    text={s.text}
                    kind={
                      s.severity === "high" || s.severity === "critical"
                        ? "critical"
                        : s.severity === "low"
                          ? "good"
                          : "moderate"
                    }
                  />
                ))}
                {risks.length === 0 && (
                  <li className="text-[13px] text-muted-foreground">No flagged risks.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* 7. Detail grid */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Company snapshot */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <SectionLabel>Company snapshot</SectionLabel>
            <div className="mt-3 space-y-2">
              <Kv k="What they do" v={data.companySnapshot?.whatTheyDo} />
              <Kv k="Customer" v={data.companySnapshot?.customer} />
              <Kv k="Problem" v={data.companySnapshot?.problem} />
              <Kv k="Product" v={data.companySnapshot?.product} />
            </div>
            <SourceLinks urls={data.companySnapshot?.sourceUrls} />
          </Card>
        </div>

        {/* Business model */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <SectionLabel>Business model</SectionLabel>
            {data.businessModel?.summary && (
              <p className="mt-3 text-[14px] text-foreground/90">
                {txt(data.businessModel.summary)}
              </p>
            )}
            <div className="mt-3 space-y-2">
              <Kv k="Pricing" v={data.businessModel?.pricingModel} />
              <Kv k="Likely buyer" v={data.businessModel?.likelyBuyer} />
              <Kv k="Sales motion" v={data.businessModel?.salesMotion} />
              <Kv k="Scalability concern" v={data.businessModel?.scalabilityConcern} />
            </div>
          </Card>
        </div>

        {/* Traction validation */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <SectionLabel>Traction validation</SectionLabel>
            {data.tractionValidation?.summary && (
              <p className="mt-3 text-[14px] text-foreground/90">
                {txt(data.tractionValidation.summary)}
              </p>
            )}
            {(data.tractionValidation?.signals || []).length > 0 && (
              <ul className="mt-3 space-y-3">
                {data.tractionValidation!.signals.map((s, i) => {
                  const conf = (txt(s.confidence) || "medium").toLowerCase();
                  const c = conf === "high" ? GREEN : conf === "low" ? RED : AMBER;
                  return (
                    <li key={i} className="border-l-2 pl-3" style={{ borderColor: c }}>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium text-[13px]">
                          {txt(s.signal)}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border"
                          style={{ color: c, borderColor: c }}
                        >
                          {conf}
                        </span>
                      </div>
                      <div className="text-[13px] text-foreground/80 mt-0.5">
                        {txt(s.evidence)}
                      </div>
                      <SourceLinks urls={s.sourceUrls} compact />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Competitor landscape */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <SectionLabel>Competitor landscape</SectionLabel>
            {data.competitorLandscape?.summary && (
              <p className="mt-3 text-[14px] text-foreground/90">
                {txt(data.competitorLandscape.summary)}
              </p>
            )}
            {(data.competitorLandscape?.competitors || []).length > 0 && (
              <ul className="mt-3 space-y-2">
                {data.competitorLandscape!.competitors.slice(0, 6).map((c, i) => (
                  <li key={i} className="text-[13px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{txt(c.name)}</span>
                      {c.category && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                          {txt(c.category)}
                        </span>
                      )}
                      {c.funding && (
                        <span className="text-[11px] text-muted-foreground">
                          · {txt(c.funding)}
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-[12px]">
                      {txt(c.whyRelevant)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 space-y-2">
              <Kv k="Differentiation" v={data.competitorLandscape?.differentiation} />
              <Kv k="Moat potential" v={data.competitorLandscape?.moatPotential} />
            </div>
          </Card>
        </div>

        {/* Funding benchmark */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <SectionLabel>Funding benchmark</SectionLabel>
            <div className="mt-3 space-y-2">
              <Kv k="Company funding" v={data.fundingBenchmark?.companyFunding} />
              <Kv k="Benchmark" v={data.fundingBenchmark?.benchmarkAgainstSimilarCompanies} />
              <Kv k="Valuation signal" v={data.fundingBenchmark?.valuationSignal} />
            </div>
            <SourceLinks urls={data.fundingBenchmark?.sourceUrls} />
          </Card>
        </div>

        {/* Founder-market fit */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <SectionLabel>Founder-market fit</SectionLabel>
            {data.founderMarketFit?.summary && (
              <p className="mt-3 text-[14px] text-foreground/90">
                {txt(data.founderMarketFit.summary)}
              </p>
            )}
            {(data.founderMarketFit?.strengths || []).length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: GREEN }}>
                  Strengths
                </div>
                <ul className="mt-1.5 space-y-1 text-[13px] text-foreground/90">
                  {data.founderMarketFit!.strengths.slice(0, 5).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="mt-1.5 inline-block size-1.5 rotate-45 shrink-0"
                        style={{ background: GREEN }}
                      />
                      <span>{txt(s)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <SourceLinks urls={data.founderMarketFit?.sourceUrls} />
          </Card>
        </div>
      </div>

      {/* 8. Published material */}
      {(data.publishedMaterialAndSocialPresence?.notableMaterials || []).length > 0 && (
        <div className="mb-4">
          <Card>
            <SectionLabel>Published material &amp; social presence</SectionLabel>
            {data.publishedMaterialAndSocialPresence?.summary && (
              <p className="mt-3 text-[14px] text-foreground/90">
                {txt(data.publishedMaterialAndSocialPresence.summary)}
              </p>
            )}
            <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.publishedMaterialAndSocialPresence!.notableMaterials.slice(0, 8).map(
                (m, i) => (
                  <li
                    key={i}
                    className="border border-border rounded-lg p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {txt(m.type)}
                      </span>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:underline text-[13px] font-medium truncate"
                      >
                        {txt(m.title)}
                      </a>
                      <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      {txt(m.whyItMatters)}
                    </div>
                  </li>
                )
              )}
            </ul>
          </Card>
        </div>
      )}

      {/* 9. Sources */}
      {sourceGroups.length > 0 && (
        <section className="mb-6">
          <SectionLabel>Sources</SectionLabel>
          <div className="mt-3 space-y-2">
            {sourceGroups.map((g, idx) => (
              <SourceGroup key={g.title} group={g} defaultOpen={idx === 0} />
            ))}
          </div>
        </section>
      )}

      {/* 10. Bottom action bar */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <button
          onClick={onNew}
          className="h-10 px-5 rounded-md font-medium text-background"
          style={{ background: GREEN }}
        >
          Start new prep
        </button>
        <button
          onClick={copy}
          className="h-10 px-4 rounded-md text-foreground/70 hover:bg-secondary/50 ml-auto"
        >
          {copied ? "Copied" : "Copy brief"}
        </button>
      </div>
    </div>
  );
}

/* =====================================================================
   Building blocks
   ===================================================================== */

function Card({
  children,
  accentBorder,
}: {
  children: React.ReactNode;
  accentBorder?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 h-full"
      style={accentBorder ? { borderLeft: `3px solid ${accentBorder}` } : undefined}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground"
      style={style}
    >
      {children}
    </div>
  );
}

function Avatar({
  initials,
  color,
}: {
  initials: string;
  color: "primary" | "muted";
}) {
  const bg =
    color === "primary"
      ? "var(--primary)"
      : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)";
  return (
    <div
      className="size-11 rounded-full flex items-center justify-center text-[13px] font-semibold text-primary-foreground shrink-0"
      style={{ background: bg }}
    >
      {initials || "—"}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;
  const v = Math.max(0, Math.min(100, value));
  const color = scoreColor(v);
  return (
    <div className="grid grid-cols-[110px_1fr_28px] items-center gap-2">
      <div className="text-[12px] text-muted-foreground truncate">{label}</div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${v}%`,
            background: `linear-gradient(90deg, color-mix(in oklab, ${color} 60%, transparent), ${color})`,
          }}
        />
      </div>
      <div className="text-[12px] tabular-nums text-right" style={{ color }}>
        {v}
      </div>
    </div>
  );
}

function MetaPills({ data }: { data: DeepBrief }) {
  const items: string[] = [];
  if (data.fundingBenchmark?.companyFunding) items.push(txt(data.fundingBenchmark.companyFunding));
  if (data.marketSizing?.tam) items.push(`TAM ${txt(data.marketSizing.tam)}`);
  if (data.marketSizing?.isVentureScale) items.push(`Venture-scale: ${txt(data.marketSizing.isVentureScale)}`);
  if (data.businessModel?.pricingModel) items.push(txt(data.businessModel.pricingModel));
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-[12px]"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

function MarketCard({ market }: { market: DeepBrief["marketSizing"] }) {
  const tamS = txt(market.tam);
  const samS = txt(market.sam);
  const somS = txt(market.som);
  const tamN = parseDollars(tamS);
  const samN = parseDollars(samS);
  const somN = parseDollars(somS);
  const maxN = Math.max(tamN, samN, somN) || 1;
  const bars: { label: string; value: string; pct: number; color: string }[] = [];
  if (tamS) bars.push({ label: "TAM", value: tamS, pct: (tamN / maxN) * 100, color: GREEN });
  if (samS) bars.push({ label: "SAM", value: samS, pct: (samN / maxN) * 100, color: GREEN });
  if (somS) bars.push({ label: "SOM", value: somS, pct: (somN / maxN) * 100, color: GREEN });

  const growth = txt(market.marketGrowth);
  const vs = txt(market.isVentureScale);

  return (
    <div className="mb-4">
      <Card>
        <SectionLabel>Market opportunity</SectionLabel>
        <div className="mt-4 grid grid-cols-12 gap-5">
          {(growth || vs) && (
            <div className="col-span-12 md:col-span-3">
              {growth && (
                <>
                  <div className="text-[12px] text-muted-foreground">Market growth</div>
                  <div className="text-2xl font-semibold leading-tight" style={{ color: GREEN }}>
                    {growth}
                  </div>
                </>
              )}
              {vs && (
                <span
                  className="mt-3 inline-flex items-center px-2.5 h-7 rounded-full border text-[11px] uppercase tracking-wider font-semibold"
                  style={{
                    borderColor: GREEN,
                    color: GREEN,
                    background: `color-mix(in oklab, ${GREEN} 10%, transparent)`,
                  }}
                >
                  Venture-scale: {vs}
                </span>
              )}
            </div>
          )}

          {bars.length > 0 && (
            <div className="col-span-12 md:col-span-9 space-y-2">
              {bars.map((b) => (
                <div
                  key={b.label}
                  className="grid grid-cols-[40px_1fr_auto] items-center gap-3"
                >
                  <div className="text-[12px] text-muted-foreground">{b.label}</div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, b.pct)}%`,
                        background: `linear-gradient(90deg, color-mix(in oklab, ${b.color} 55%, transparent), ${b.color})`,
                      }}
                    />
                  </div>
                  <div className="text-[13px] font-semibold tabular-nums" style={{ color: b.color }}>
                    {b.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <SourceLinks urls={market.sourceUrls} />
      </Card>
    </div>
  );
}

function SignalRow({
  label,
  text,
  kind,
}: {
  label: string;
  text: string;
  kind: "good" | "moderate" | "critical";
}) {
  const colorMap = { good: GREEN, moderate: AMBER, critical: RED } as const;
  const c = colorMap[kind];
  return (
    <li className="grid grid-cols-[150px_1fr] gap-3 items-start">
      <span
        className="inline-flex items-center justify-center px-2 h-6 rounded-md text-[11px] font-semibold border whitespace-nowrap overflow-hidden text-ellipsis"
        style={{
          borderColor: c,
          color: c,
          background: `color-mix(in oklab, ${c} 12%, transparent)`,
        }}
        title={label}
      >
        {truncate(label, 22)}
      </span>
      <span className="text-foreground/90 text-[13px]">{text}</span>
    </li>
  );
}

function Kv({ k, v }: { k: string; v?: string }) {
  return (
    <div className="text-[13px]">
      <span className="text-muted-foreground">{k}: </span>
      <span className="text-foreground/90">{txt(v) || UNKNOWN}</span>
    </div>
  );
}

function SourceLinks({ urls, compact }: { urls?: string[]; compact?: boolean }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={compact ? "mt-1 text-[11px]" : "mt-3 text-[11px]"}>
      <span className="text-muted-foreground">Sources: </span>
      {urls.slice(0, 6).map((u, i) => (
        <a
          key={i}
          href={u}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:underline mr-2"
          title={u}
        >
          [{i + 1}]
        </a>
      ))}
    </div>
  );
}

/* =====================================================================
   Helpers
   ===================================================================== */

function verdictLabel(rec: string): string {
  const k = rec.toLowerCase();
  if (!k) return "UNCLEAR";
  if (k.includes("strong invest") || k.includes("invest")) return "INVEST";
  if (k.includes("pass") || k.includes("decline") || k === "no") return "PASS";
  if (k.includes("monitor") || k.includes("watch")) return "MONITOR";
  if (k.includes("conditional") || k.includes("maybe")) return "CONDITIONAL";
  return rec.toUpperCase();
}

function derivedHeadline(label: string): string {
  if (label === "INVEST") return "Conviction to move forward";
  if (label === "PASS") return "Pass — signals don't justify investment";
  if (label === "MONITOR") return "Monitor — revisit on next milestone";
  if (label === "CONDITIONAL") return "Conditional — validate before committing";
  return "Mixed signals — review brief";
}

function verdictTone(label: string): { color: string } {
  const k = label.toUpperCase();
  if (k.includes("INVEST")) return { color: GREEN };
  if (k.includes("PASS") || k.includes("DECLINE")) return { color: RED };
  if (k.includes("CONDITIONAL") || k.includes("MAYBE") || k.includes("MONITOR"))
    return { color: AMBER };
  return { color: "var(--muted-foreground)" };
}

function scoreColor(v: number): string {
  return v >= 70 ? GREEN : v >= 50 ? AMBER : RED;
}

function deriveScores(d: DeepBrief): {
  team: number;
  market: number;
  traction: number;
  business: number;
  riskLegal: number;
} {
  const clamp = (n: number) => Math.max(15, Math.min(95, Math.round(n)));

  // Team: known members + strengths − concerns
  const members = d.foundingTeam?.knownTeamMembers?.length || 0;
  const strengths = d.founderMarketFit?.strengths?.length || 0;
  const concerns = d.founderMarketFit?.concerns?.length || 0;
  const gaps = d.foundingTeam?.teamGaps?.length || 0;
  const team = clamp(45 + members * 8 + strengths * 5 - concerns * 6 - gaps * 5);

  // Market
  const vs = (d.marketSizing?.isVentureScale || "").toLowerCase();
  const hasTam = !!d.marketSizing?.tam;
  const marketBase = vs.includes("yes") ? 80 : vs.includes("no") ? 35 : 55;
  const market = clamp(marketBase + (hasTam ? 8 : 0));

  // Traction
  const signals = d.tractionValidation?.signals || [];
  const high = signals.filter((s) => (s.confidence || "").toLowerCase() === "high").length;
  const med = signals.filter((s) => (s.confidence || "").toLowerCase() === "medium").length;
  const traction = clamp(35 + high * 15 + med * 8 + Math.min(signals.length, 4) * 3);

  // Business: pricing/buyer/motion known minus scalability concern
  const bm = d.businessModel;
  let business = 45;
  if (bm?.pricingModel) business += 12;
  if (bm?.likelyBuyer) business += 8;
  if (bm?.salesMotion) business += 8;
  if (bm?.summary) business += 8;
  if (bm?.scalabilityConcern) business -= 8;
  if (d.competitorLandscape?.moatPotential) business += 6;
  business = clamp(business);

  // Risk / Legal: fewer & lower-severity is better
  const risks = d.risksAndRedFlags || [];
  const highRisk = risks.filter((r) => (r.severity || "").toLowerCase() === "high").length;
  const medRisk = risks.filter((r) => (r.severity || "").toLowerCase() === "medium").length;
  const riskLegal = clamp(85 - highRisk * 18 - medRisk * 8 - Math.max(0, risks.length - 5) * 3);

  return { team, market, traction, business, riskLegal };
}

function shortLabel(s: string): string {
  const w = s.split(/\s+/).slice(0, 3).join(" ");
  return truncate(w.replace(/[.,;:]$/, ""), 22);
}

function parseDollars(s?: string): number {
  if (!s) return 0;
  const m = s.match(/([\d.]+)\s*([kmbt])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  return n * (mult[(m[2] || "").toLowerCase()] || 1);
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || ""
  );
}

function titleCase(s: string): string {
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/* =====================================================================
   Sources grouping (shared visual language with QuickScreenView)
   ===================================================================== */

type SourceGroupT = {
  title: string;
  queries: string[];
  items: TavilyResult[];
};

function buildSourceGroups(results: Record<string, TavilyResponse>): SourceGroupT[] {
  const groupsMap = new Map<
    string,
    { queries: Set<string>; byUrl: Map<string, TavilyResult> }
  >();

  for (const [query, resp] of Object.entries(results)) {
    const title = categorize(query);
    if (!groupsMap.has(title)) {
      groupsMap.set(title, { queries: new Set(), byUrl: new Map() });
    }
    const g = groupsMap.get(title)!;
    g.queries.add(query);
    for (const r of resp.results || []) {
      if (!r.url) continue;
      const prev = g.byUrl.get(r.url);
      if (!prev || (r.score ?? 0) > (prev.score ?? 0)) g.byUrl.set(r.url, r);
    }
  }

  const order = [
    "Founder background",
    "Product and customers",
    "Funding and investors",
    "Momentum and traction",
    "Market and competitors",
    "Risks and red flags",
    "Other",
  ];
  const groups: SourceGroupT[] = [];
  for (const title of order) {
    const g = groupsMap.get(title);
    if (!g) continue;
    const items = Array.from(g.byUrl.values())
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 8);
    if (items.length === 0) continue;
    groups.push({ title, queries: Array.from(g.queries), items });
  }
  return groups;
}

function categorize(q: string): string {
  const s = q.toLowerCase();
  if (/(lawsuit|controversy|fraud|criticism|breach|complaints|layoffs|shutdown)/.test(s))
    return "Risks and red flags";
  if (/(funding|investors|valuation|seed|series|raised|benchmark)/.test(s))
    return "Funding and investors";
  if (/(competitors|alternatives|tam|sam|som|market|cagr|category)/.test(s))
    return "Market and competitors";
  if (/(revenue|arr|growth|traction|hiring|partnerships|recent news|product launch|interview|podcast|profile)/.test(s))
    return "Momentum and traction";
  if (/(product|customers|case study|reviews|g2|product hunt|what does|pricing|business model)/.test(s))
    return "Product and customers";
  if (/(founder|ceo|linkedin|biography|background|cofounder|patents|publications|github|scholar|twitter|x |substack|blog|exit|acquisition|ipo|prior)/.test(s))
    return "Founder background";
  return "Other";
}

function SourceGroup({
  group,
  defaultOpen,
}: {
  group: SourceGroupT;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="text-foreground font-medium">{group.title}</div>
          <div className="text-[11px] italic text-muted-foreground truncate mt-0.5">
            {group.queries.slice(0, 2).join(" · ")}
            {group.queries.length > 2 ? ` · +${group.queries.length - 2} more` : ""}
          </div>
        </div>
        <ChevronDown
          className={[
            "size-4 text-muted-foreground mt-1 shrink-0 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1.5">
          {group.items.map((r, i) => (
            <li key={i} className="flex items-center gap-2 min-w-0">
              <LinkIcon className="size-3.5 text-muted-foreground shrink-0" />
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline truncate flex-1"
                title={r.title || r.url}
              >
                {r.title || r.url}
              </a>
              <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">
                {domainOf(r.url)}
              </span>
            </li>
          ))}
        </ul>
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

/* =====================================================================
   Plain-text export (preserved for copy-to-clipboard)
   ===================================================================== */

export function formatDeep(founder: string, company: string, d: DeepBrief): string {
  const L: string[] = [];
  L.push("PREP — DEEP DILIGENCE BRIEF");
  L.push([founder, company].filter(Boolean).join(" · "));
  L.push("");
  L.push("Executive summary:");
  L.push(d.executiveSummary?.summary || "");
  L.push(`Investment view: ${d.executiveSummary?.investmentView || ""}`);
  L.push(`Why now: ${d.executiveSummary?.whyNow || ""}`);
  L.push("");
  L.push("Founder-market fit:");
  L.push(d.founderMarketFit?.summary || "");
  L.push("");
  L.push("Founding team:");
  L.push(d.foundingTeam?.summary || "");
  (d.foundingTeam?.knownTeamMembers || []).forEach((m) =>
    L.push(`- ${m.name} (${m.role}): ${m.background}`)
  );
  L.push("");
  L.push("Company snapshot:");
  L.push(`What: ${d.companySnapshot?.whatTheyDo || ""}`);
  L.push(`Customer: ${d.companySnapshot?.customer || ""}`);
  L.push(`Problem: ${d.companySnapshot?.problem || ""}`);
  L.push(`Product: ${d.companySnapshot?.product || ""}`);
  L.push("");
  L.push("Traction:");
  L.push(d.tractionValidation?.summary || "");
  (d.tractionValidation?.signals || []).forEach((s) =>
    L.push(`- ${s.signal} (${s.confidence}): ${s.evidence}`)
  );
  L.push("");
  L.push(
    `Market — TAM: ${d.marketSizing?.tam || ""}, SAM: ${d.marketSizing?.sam || ""}, SOM: ${d.marketSizing?.som || ""}, growth: ${d.marketSizing?.marketGrowth || ""}, venture-scale: ${d.marketSizing?.isVentureScale || ""}`
  );
  L.push("");
  L.push("Competitors:");
  L.push(d.competitorLandscape?.summary || "");
  (d.competitorLandscape?.competitors || []).forEach((c) =>
    L.push(`- ${c.name} [${c.category}, funding ${c.funding}]: ${c.whyRelevant}`)
  );
  L.push(`Differentiation: ${d.competitorLandscape?.differentiation || ""}`);
  L.push(`Moat: ${d.competitorLandscape?.moatPotential || ""}`);
  L.push("");
  L.push(
    `Funding benchmark: ${d.fundingBenchmark?.companyFunding || ""} | ${d.fundingBenchmark?.benchmarkAgainstSimilarCompanies || ""} | signal: ${d.fundingBenchmark?.valuationSignal || ""}`
  );
  L.push("");
  L.push("Business model:");
  L.push(d.businessModel?.summary || "");
  L.push(
    `Pricing: ${d.businessModel?.pricingModel || ""} | Buyer: ${d.businessModel?.likelyBuyer || ""} | Motion: ${d.businessModel?.salesMotion || ""}`
  );
  L.push(`Scalability concern: ${d.businessModel?.scalabilityConcern || ""}`);
  L.push("");
  L.push("Risks:");
  (d.risksAndRedFlags || []).forEach((r) =>
    L.push(`- [${r.severity}] ${r.risk} — ${r.whyItMatters}`)
  );
  L.push("");
  L.push("Diligence questions:");
  (d.diligenceQuestions || []).forEach((q) => L.push(`- ${q.question} (why: ${q.whyAsk})`));
  L.push("");
  L.push(`Investment view: ${d.investmentView?.recommendation || ""}`);
  L.push(d.investmentView?.reasoning || "");
  if (d.investmentView?.topReasonsToInvest?.length) {
    L.push("Top reasons to invest:");
    d.investmentView.topReasonsToInvest.forEach((r) => L.push(`- ${r}`));
  }
  if (d.investmentView?.topReasonsToPause?.length) {
    L.push("Top reasons to pause:");
    d.investmentView.topReasonsToPause.forEach((r) => L.push(`- ${r}`));
  }
  return L.join("\n");
}
