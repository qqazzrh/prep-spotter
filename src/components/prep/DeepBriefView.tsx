import type { DeepBrief, TavilyResponse, TavilyResult } from "@/lib/prep/types";
import { useState } from "react";
import {
  Link as LinkIcon,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Hourglass,
} from "lucide-react";

/* ====================================================================
   Deep Diligence Brief — dense IC-dashboard layout.
   Reference: NovaMed AI mock (dark, multi-column, colored stat tiles,
   TAM/SAM/SOM bars, use-of-funds split, conviction score panel).
   ==================================================================== */

const BLUE = "oklch(0.78 0.13 225)";
const GREEN = "oklch(0.74 0.17 150)";
const AMBER = "oklch(0.80 0.15 75)";
const RED = "oklch(0.66 0.22 25)";
const PURPLE = "oklch(0.72 0.17 305)";

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

  const subject = titleCase(company) || company || titleCase(founder) || "—";
  const tagline = txt(data.companySnapshot?.whatTheyDo) ||
    txt(data.executiveSummary?.summary).split(/(?<=[.!?])\s+/)[0];

  // Top-right meta from funding benchmark
  const fundingStr = txt(data.fundingBenchmark?.companyFunding);
  const { raiseAsk, preMoneyVal } = splitFunding(fundingStr);

  // Lead founder & co
  const lead = data.foundingTeam?.knownTeamMembers?.[0];
  const co = data.foundingTeam?.knownTeamMembers?.[1];
  const founderName = txt(lead?.name) || titleCase(founder) || "—";
  const founderTitle = txt(lead?.role) || "CEO";
  const founderInitials = initialsOf(founderName);
  const founderCreds = (data.founderMarketFit?.strengths || []).slice(0, 4);
  const teamGap = (data.foundingTeam?.teamGaps || [])[0];

  // Derived skill bars (Founder–Mkt, Domain, Sales, Technical, Resilience)
  const scores = deriveScores(data);
  const skill = {
    fmf: clampScore(scores.team + 5),
    domain: clampScore(scores.team),
    sales: clampScore(scores.business),
    technical: clampScore(scores.business - 10),
    grit: clampScore(scores.team + 3),
  };

  // Traction tiles — first 6 signals → metric cards
  const tractionTiles = buildTractionTiles(data);

  // Competitors with threat dots
  const competitors = (data.competitorLandscape?.competitors || []).slice(0, 4);

  // Market
  const market = data.marketSizing;

  // Verdict + conviction
  const recRaw = txt(data.investmentView?.recommendation) || txt(data.executiveSummary?.investmentView);
  const verdictTag = verdictLabel(recRaw);
  const tone = verdictTone(verdictTag);
  const overall = Math.round(
    (scores.team + scores.market + scores.traction + scores.business + scores.riskLegal) / 5
  );

  // Signals
  const greens = (data.investmentView?.topReasonsToInvest || []).slice(0, 8);
  const risks = (data.risksAndRedFlags || []).slice(0, 8);

  const sourceGroups = buildSourceGroups(results);

  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6" style={{ fontSize: 13, lineHeight: 1.55 }}>
      {/* ============ TOP HEADER BAR ============ */}
      <Tile className="mb-3 px-5 py-4 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{ color: BLUE }}
          >
            {subject}
          </h1>
          {tagline && (
            <div className="text-muted-foreground text-[13px] mt-0.5 truncate">
              {tagline}
            </div>
          )}
        </div>

        <Pills data={data} />

        <div className="flex items-end gap-6 ml-auto">
          {raiseAsk && (
            <HeaderStat value={raiseAsk} label="Raise ask" color={BLUE} />
          )}
          {preMoneyVal && (
            <HeaderStat value={preMoneyVal} label="Pre-money val" color={GREEN} />
          )}
          <div className="text-right">
            <div className="text-[15px] font-semibold text-foreground">
              {titleCase(verdictTag)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Reviewed {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </Tile>

      {/* ============ MAIN GRID — 12 cols, 3 / 6 / 3 ============ */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* ===== LEFT COL: Founder & team ===== */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <Tile className="p-5">
            <SectionLabel>Founder &amp; team</SectionLabel>

            <div className="mt-4 flex items-start gap-3">
              <Avatar initials={founderInitials} color={BLUE} />
              <div className="min-w-0">
                <div className="text-foreground font-semibold leading-tight">
                  {founderName}
                </div>
                <div className="text-muted-foreground text-[12px]">
                  {founderTitle}
                </div>
              </div>
            </div>

            {founderCreds.length > 0 && (
              <ul className="mt-4 space-y-2">
                {founderCreds.map((c, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] text-foreground/90">
                    <span
                      className="mt-1.5 inline-block size-1.5 rotate-45 shrink-0"
                      style={{ background: BLUE }}
                      aria-hidden
                    />
                    <span>{txt(c)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 space-y-2">
              <SkillBar label="Founder–Mkt Fit" value={skill.fmf} />
              <SkillBar label="Domain Expertise" value={skill.domain} />
              <SkillBar label="Sales Ability" value={skill.sales} />
              <SkillBar label="Technical Depth" value={skill.technical} />
              <SkillBar label="Resilience / Grit" value={skill.grit} />
            </div>

            {co && (
              <div className="mt-5 border border-border rounded-lg p-3 flex items-center gap-3">
                <Avatar initials={initialsOf(txt(co.name))} color={PURPLE} small />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground text-[13px] font-semibold truncate">
                    {txt(co.name)}
                  </div>
                  <div className="text-muted-foreground text-[11.5px] truncate">
                    {txt(co.role)}
                  </div>
                </div>
                <span
                  className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded border"
                  style={{ color: GREEN, borderColor: GREEN }}
                >
                  ✓ FIT
                </span>
              </div>
            )}

            {teamGap && (
              <div
                className="mt-3 rounded-lg border p-3 flex gap-2 items-start"
                style={{
                  borderColor: AMBER,
                  background: `color-mix(in oklab, ${AMBER} 8%, transparent)`,
                }}
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: AMBER }} />
                <div>
                  <div className="text-[11.5px] font-semibold" style={{ color: AMBER }}>
                    {shortLabel(txt(teamGap), 36)}
                  </div>
                  <div className="text-[11.5px] text-foreground/80">
                    {txt(teamGap)}
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </aside>

        {/* ===== CENTER COL: Traction + competitive landscape ===== */}
        <section className="col-span-12 lg:col-span-6 space-y-3">
          {tractionTiles.length > 0 && (
            <Tile className="p-5">
              <SectionLabel>Traction &amp; key metrics</SectionLabel>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {tractionTiles.map((t, i) => (
                  <StatTile key={i} {...t} />
                ))}
              </div>
            </Tile>
          )}

          <Tile className="p-5">
            <SectionLabel>Competitive landscape</SectionLabel>
            {data.competitorLandscape?.summary && (
              <p className="mt-3 text-[13px] text-foreground/90">
                {txt(data.competitorLandscape.summary)}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>Threat:</span>
              <ThreatLegend dot={GREEN} label="Low" />
              <ThreatLegend dot={AMBER} label="Med" />
              <ThreatLegend dot={RED} label="High" />
            </div>

            {competitors.length > 0 && (
              <ul className="mt-3 space-y-2">
                {competitors.map((c, i) => (
                  <CompetitorRow key={i} c={c} />
                ))}
              </ul>
            )}

            {(data.competitorLandscape?.differentiation || data.competitorLandscape?.moatPotential) && (
              <div
                className="mt-4 rounded-lg border-l-2 p-3"
                style={{
                  borderLeftColor: GREEN,
                  background: `color-mix(in oklab, ${GREEN} 8%, transparent)`,
                }}
              >
                {data.competitorLandscape?.differentiation && (
                  <div className="text-[12.5px]">
                    <span className="font-semibold" style={{ color: GREEN }}>
                      ✓ Differentiation:{" "}
                    </span>
                    <span className="text-foreground/90">
                      {txt(data.competitorLandscape.differentiation)}
                    </span>
                  </div>
                )}
                {data.competitorLandscape?.moatPotential && (
                  <div className="text-[12.5px] mt-1">
                    <span className="font-semibold" style={{ color: GREEN }}>
                      Moat:{" "}
                    </span>
                    <span className="text-foreground/90">
                      {txt(data.competitorLandscape.moatPotential)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Tile>

          {/* Executive summary + diligence questions */}
          <Tile className="p-5" accentBorder={tone.color}>
            <div
              className="text-[10px] uppercase tracking-[0.16em] font-bold"
              style={{ color: tone.color }}
            >
              {verdictTag}
            </div>
            <h2 className="mt-1 text-xl font-semibold text-foreground tracking-tight">
              {derivedHeadline(verdictTag)}
            </h2>
            {data.executiveSummary?.summary && (
              <p className="mt-2 italic text-foreground/90 text-[13.5px]">
                &ldquo;{txt(data.executiveSummary.summary)}&rdquo;
              </p>
            )}
            {data.executiveSummary?.whyNow && (
              <div className="mt-3">
                <SectionLabel>Why now</SectionLabel>
                <p className="mt-1 text-[13px] text-foreground/90">
                  {txt(data.executiveSummary.whyNow)}
                </p>
              </div>
            )}
            {(data.diligenceQuestions || []).length > 0 && (
              <div className="mt-4">
                <SectionLabel>Diligence questions</SectionLabel>
                <ol className="mt-2 space-y-2">
                  {data.diligenceQuestions!.slice(0, 6).map((q, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px]">
                      <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-md border border-border text-[10px] text-muted-foreground tabular-nums">
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
          </Tile>
        </section>

        {/* ===== RIGHT COL: Market / Business / Funds / Legal ===== */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <Tile className="p-5">
            <SectionLabel>Market opportunity</SectionLabel>
            <MarketBlock market={market} />
          </Tile>

          <Tile className="p-5">
            <SectionLabel>Business model</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat
                value={data.businessModel?.pricingModel}
                label="Pricing"
                color={BLUE}
              />
              <MiniStat
                value={data.businessModel?.salesMotion}
                label="Sales motion"
                color={PURPLE}
              />
              <MiniStat
                value={data.businessModel?.likelyBuyer}
                label="Likely buyer"
                color={GREEN}
              />
              <MiniStat
                value={data.fundingBenchmark?.valuationSignal}
                label="Val signal"
                color={AMBER}
              />
            </div>
            {data.businessModel?.summary && (
              <p className="mt-3 text-[12px] text-foreground/85">
                {txt(data.businessModel.summary)}
              </p>
            )}
          </Tile>

          {(data.fundingBenchmark?.benchmarkAgainstSimilarCompanies || raiseAsk) && (
            <Tile className="p-5">
              <SectionLabel>Funding benchmark{raiseAsk ? ` (${raiseAsk})` : ""}</SectionLabel>
              <div className="mt-3 space-y-2 text-[12.5px]">
                {fundingStr && (
                  <div>
                    <span className="text-muted-foreground">Round: </span>
                    <span className="text-foreground/90">{fundingStr}</span>
                  </div>
                )}
                {data.fundingBenchmark?.benchmarkAgainstSimilarCompanies && (
                  <div>
                    <span className="text-muted-foreground">Benchmark: </span>
                    <span className="text-foreground/90">
                      {txt(data.fundingBenchmark.benchmarkAgainstSimilarCompanies)}
                    </span>
                  </div>
                )}
                {data.fundingBenchmark?.valuationSignal && (
                  <div>
                    <span className="text-muted-foreground">Signal: </span>
                    <span className="text-foreground/90">
                      {txt(data.fundingBenchmark.valuationSignal)}
                    </span>
                  </div>
                )}
              </div>
            </Tile>
          )}
        </aside>
      </div>

      {/* ============ BOTTOM ROW — Signals + Conviction ============ */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <Tile className="col-span-12 md:col-span-4 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" style={{ color: GREEN }} />
            <SectionLabel style={{ color: GREEN }}>Green signals</SectionLabel>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-1.5">
            {greens.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] text-foreground/90">
                <span
                  className="mt-1.5 inline-block size-1.5 rounded-full shrink-0"
                  style={{ background: GREEN }}
                />
                <span>{txt(s)}</span>
              </li>
            ))}
            {greens.length === 0 && (
              <li className="text-[12.5px] text-muted-foreground">No clear green signals.</li>
            )}
          </ul>
        </Tile>

        <Tile className="col-span-12 md:col-span-5 p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4" style={{ color: RED }} />
            <SectionLabel style={{ color: RED }}>Risk signals</SectionLabel>
          </div>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {risks.map((r, i) => {
              const sev = (txt(r.severity) || "medium").toLowerCase();
              const c = sev === "high" || sev === "critical" ? RED : sev === "low" ? GREEN : AMBER;
              return (
                <li key={i} className="flex gap-2 text-[12.5px] text-foreground/90">
                  <span
                    className="mt-1.5 inline-block size-1.5 rounded-full shrink-0"
                    style={{ background: c }}
                  />
                  <span>{txt(r.risk)}</span>
                </li>
              );
            })}
            {risks.length === 0 && (
              <li className="text-[12.5px] text-muted-foreground">No flagged risks.</li>
            )}
          </ul>
        </Tile>

        <Tile className="col-span-12 md:col-span-3 p-5 flex flex-col items-center justify-center text-center">
          <div
            className="text-6xl font-bold tabular-nums leading-none"
            style={{ color: scoreColor(overall) }}
          >
            {overall}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">/ 100 conviction score</div>
          <div
            className="mt-4 text-[12px] font-bold uppercase tracking-[0.18em]"
            style={{ color: tone.color }}
          >
            {verdictTag}
          </div>
          {data.investmentView?.reasoning && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              → {truncate(txt(data.investmentView.reasoning), 60)}
            </div>
          )}
        </Tile>
      </div>

      {/* ============ DETAIL ROW — Founder-mkt fit / Traction / Published ============ */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <Tile className="col-span-12 md:col-span-6 p-5">
          <SectionLabel>Founder-market fit</SectionLabel>
          {data.founderMarketFit?.summary && (
            <p className="mt-3 text-[13px] text-foreground/90">
              {txt(data.founderMarketFit.summary)}
            </p>
          )}
          {(data.founderMarketFit?.concerns || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: AMBER }}>
                Concerns
              </div>
              <ul className="mt-1.5 space-y-1 text-[12.5px] text-foreground/85">
                {data.founderMarketFit!.concerns.slice(0, 4).map((c, i) => (
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
          <SourceLinks urls={data.founderMarketFit?.sourceUrls} />
        </Tile>

        <Tile className="col-span-12 md:col-span-6 p-5">
          <SectionLabel>Traction validation</SectionLabel>
          {data.tractionValidation?.summary && (
            <p className="mt-3 text-[13px] text-foreground/90">
              {txt(data.tractionValidation.summary)}
            </p>
          )}
          {(data.tractionValidation?.signals || []).length > 0 && (
            <ul className="mt-3 space-y-2.5">
              {data.tractionValidation!.signals.slice(0, 5).map((s, i) => {
                const conf = (txt(s.confidence) || "medium").toLowerCase();
                const c = conf === "high" ? GREEN : conf === "low" ? RED : AMBER;
                return (
                  <li key={i} className="border-l-2 pl-3" style={{ borderColor: c }}>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium text-[12.5px]">
                        {txt(s.signal)}
                      </span>
                      <span
                        className="text-[9.5px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border"
                        style={{ color: c, borderColor: c }}
                      >
                        {conf}
                      </span>
                    </div>
                    <div className="text-[12px] text-foreground/75 mt-0.5">
                      {txt(s.evidence)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>
      </div>

      {(data.publishedMaterialAndSocialPresence?.notableMaterials || []).length > 0 && (
        <Tile className="p-5 mb-3">
          <SectionLabel>Published material &amp; social presence</SectionLabel>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.publishedMaterialAndSocialPresence!.notableMaterials.slice(0, 9).map(
              (m, i) => (
                <li key={i} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      {txt(m.type)}
                    </span>
                  </div>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-foreground hover:underline text-[12.5px] font-medium"
                    style={{ color: BLUE }}
                  >
                    {txt(m.title)}
                  </a>
                  <div className="text-[11.5px] text-muted-foreground mt-1">
                    {txt(m.whyItMatters)}
                  </div>
                </li>
              )
            )}
          </ul>
        </Tile>
      )}

      {/* ============ SOURCES ============ */}
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

      {/* ============ ACTIONS ============ */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <button
          onClick={onNew}
          className="h-10 px-5 rounded-md font-medium text-background"
          style={{ background: BLUE }}
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

function Tile({
  children,
  className,
  accentBorder,
}: {
  children: React.ReactNode;
  className?: string;
  accentBorder?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card ${className || ""}`}
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
      className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground"
      style={style}
    >
      {children}
    </div>
  );
}

function Avatar({
  initials,
  color,
  small,
}: {
  initials: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      className={`${small ? "size-9 text-[11px]" : "size-11 text-[13px]"} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{
        background: `color-mix(in oklab, ${color} 22%, var(--card))`,
        color: color,
        border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
      }}
    >
      {initials || "—"}
    </div>
  );
}

function HeaderStat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold tabular-nums leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

function Pills({ data }: { data: DeepBrief }) {
  const pills: { label: string; color: string }[] = [];
  const fb = txt(data.fundingBenchmark?.companyFunding);
  const round = parseRound(fb);
  if (round) pills.push({ label: round, color: BLUE });

  const sector = inferSector(data);
  if (sector) pills.push({ label: sector, color: GREEN });

  const model = txt(data.businessModel?.pricingModel) || txt(data.businessModel?.summary);
  const modelShort = inferModel(model);
  if (modelShort) pills.push({ label: modelShort, color: PURPLE });

  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {pills.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center px-3 h-7 rounded-full border text-[11px] font-semibold uppercase tracking-wider"
          style={{
            borderColor: `color-mix(in oklab, ${p.color} 50%, transparent)`,
            color: p.color,
            background: `color-mix(in oklab, ${p.color} 10%, transparent)`,
          }}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  const color = scoreColor(value);
  return (
    <div className="grid grid-cols-[110px_1fr_28px] items-center gap-2">
      <div className="text-[11.5px] text-muted-foreground truncate">{label}</div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, color-mix(in oklab, ${color} 50%, transparent), ${color})`,
          }}
        />
      </div>
      <div className="text-[11.5px] tabular-nums text-right font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

type TractionTile = {
  value: string;
  label: string;
  sub?: string;
  color: string;
  trend?: "up" | "down";
};

function StatTile({ value, label, sub, color, trend }: TractionTile) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, var(--border))`,
        background: `color-mix(in oklab, ${color} 6%, var(--card))`,
      }}
    >
      <div className="text-2xl font-bold tabular-nums leading-tight" style={{ color }}>
        {value}
      </div>
      <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
      {sub && (
        <div className="text-[11px] text-foreground/80 mt-1.5 flex items-center gap-1">
          {trend === "up" && <span style={{ color: GREEN }}>▲</span>}
          {trend === "down" && <span style={{ color: RED }}>▼</span>}
          <span className="truncate">{sub}</span>
        </div>
      )}
    </div>
  );
}

function ThreatLegend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function CompetitorRow({
  c,
}: {
  c: { name: string; category: string; funding: string; whyRelevant: string };
}) {
  const threat = inferThreat(c);
  const threatColor = threat === "high" ? RED : threat === "low" ? GREEN : AMBER;
  // Three dot indicator visual
  const dotIdx = threat === "high" ? 2 : threat === "low" ? 0 : 1;

  return (
    <li className="border border-border rounded-lg px-3 py-2.5 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground font-semibold text-[13px]">{txt(c.name)}</span>
          {c.category && (
            <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {txt(c.category)}
            </span>
          )}
          {c.funding && (
            <span className="text-[11px] text-muted-foreground">· {txt(c.funding)}</span>
          )}
        </div>
        <div className="text-[12px] text-muted-foreground mt-0.5">
          {txt(c.whyRelevant)}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-2 rounded-full"
            style={{
              background: i === dotIdx ? threatColor : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)",
            }}
          />
        ))}
      </div>
    </li>
  );
}

function MarketBlock({ market }: { market: DeepBrief["marketSizing"] }) {
  const tamS = txt(market?.tam);
  const samS = txt(market?.sam);
  const somS = txt(market?.som);
  const tamN = parseDollars(tamS);
  const samN = parseDollars(samS);
  const somN = parseDollars(somS);
  const maxN = Math.max(tamN, samN, somN) || 1;
  const growth = txt(market?.marketGrowth);
  const vs = txt(market?.isVentureScale);
  const hasBars = !!(tamS || samS || somS);

  return (
    <div>
      {growth && (
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[11px] text-muted-foreground">Market growth</span>
          <span className="text-2xl font-bold tabular-nums" style={{ color: GREEN }}>
            {growth}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ml-auto" style={{ color: GREEN, borderColor: GREEN }}>
            Tailwind ↑
          </span>
        </div>
      )}
      {hasBars && (
        <div className="mt-3 space-y-1.5">
          {tamS && <MarketBar label="TAM" value={tamS} pct={(tamN / maxN) * 100} color={GREEN} />}
          {samS && <MarketBar label="SAM" value={samS} pct={(samN / maxN) * 100} color={PURPLE} />}
          {somS && <MarketBar label="SOM" value={somS} pct={(somN / maxN) * 100} color={BLUE} />}
        </div>
      )}
      {vs && (
        <div
          className="mt-3 rounded-lg border-l-2 px-3 py-2 text-[12px]"
          style={{
            borderLeftColor: GREEN,
            background: `color-mix(in oklab, ${GREEN} 8%, transparent)`,
          }}
        >
          <span className="font-semibold" style={{ color: GREEN }}>
            Venture-scale:{" "}
          </span>
          <span className="text-foreground/90">{vs}</span>
        </div>
      )}
    </div>
  );
}

function MarketBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[36px_1fr_auto] items-center gap-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(3, pct)}%`,
            background: `linear-gradient(90deg, color-mix(in oklab, ${color} 50%, transparent), ${color})`,
          }}
        />
      </div>
      <div className="text-[11.5px] tabular-nums font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  value,
  label,
  color,
}: {
  value?: string;
  label: string;
  color: string;
}) {
  if (!txt(value)) {
    return (
      <div className="border border-border rounded-lg p-2.5">
        <div className="text-[13px] text-muted-foreground">—</div>
        <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {label}
        </div>
      </div>
    );
  }
  return (
    <div className="border border-border rounded-lg p-2.5">
      <div className="text-[13px] font-semibold leading-tight" style={{ color }}>
        {truncate(txt(value), 18)}
      </div>
      <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function SourceLinks({ urls }: { urls?: string[] }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="mt-3 text-[11px]">
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
  const k = (rec || "").toLowerCase();
  if (!k) return "UNCLEAR";
  if (k.includes("strong invest") || k.includes("strong pass")) return "STRONG PASS";
  if (k.includes("invest")) return "PASS";
  if (k.includes("decline") || k === "no" || k === "pass on") return "NO";
  if (k.includes("monitor") || k.includes("watch")) return "MONITOR";
  if (k.includes("conditional") || k.includes("maybe")) return "CONDITIONAL";
  return rec.toUpperCase();
}

function derivedHeadline(label: string): string {
  if (label.includes("STRONG")) return "Conviction to move forward";
  if (label === "PASS") return "Worth proceeding to partner meeting";
  if (label === "NO") return "Decline — signals don't justify investment";
  if (label === "MONITOR") return "Monitor — revisit on next milestone";
  if (label === "CONDITIONAL") return "Conditional — validate before committing";
  return "Mixed signals — review brief";
}

function verdictTone(label: string): { color: string } {
  const k = label.toUpperCase();
  if (k.includes("STRONG") || k === "PASS") return { color: GREEN };
  if (k === "NO" || k.includes("DECLINE")) return { color: RED };
  if (k.includes("CONDITIONAL") || k.includes("MONITOR") || k.includes("MAYBE"))
    return { color: AMBER };
  return { color: "var(--muted-foreground)" };
}

function clampScore(n: number): number {
  return Math.max(20, Math.min(98, Math.round(n)));
}

function scoreColor(v: number): string {
  return v >= 75 ? GREEN : v >= 55 ? AMBER : RED;
}

function deriveScores(d: DeepBrief): {
  team: number;
  market: number;
  traction: number;
  business: number;
  riskLegal: number;
} {
  const clamp = (n: number) => Math.max(20, Math.min(95, Math.round(n)));
  const members = d.foundingTeam?.knownTeamMembers?.length || 0;
  const strengths = d.founderMarketFit?.strengths?.length || 0;
  const concerns = d.founderMarketFit?.concerns?.length || 0;
  const gaps = d.foundingTeam?.teamGaps?.length || 0;
  const team = clamp(50 + members * 8 + strengths * 5 - concerns * 6 - gaps * 5);

  const vs = (d.marketSizing?.isVentureScale || "").toLowerCase();
  const hasTam = !!d.marketSizing?.tam;
  const marketBase = vs.includes("yes") ? 82 : vs.includes("no") ? 35 : 60;
  const market = clamp(marketBase + (hasTam ? 8 : 0));

  const signals = d.tractionValidation?.signals || [];
  const high = signals.filter((s) => (s.confidence || "").toLowerCase() === "high").length;
  const med = signals.filter((s) => (s.confidence || "").toLowerCase() === "medium").length;
  const traction = clamp(40 + high * 14 + med * 8 + Math.min(signals.length, 4) * 3);

  const bm = d.businessModel;
  let business = 50;
  if (bm?.pricingModel) business += 12;
  if (bm?.likelyBuyer) business += 8;
  if (bm?.salesMotion) business += 8;
  if (bm?.summary) business += 8;
  if (bm?.scalabilityConcern) business -= 8;
  if (d.competitorLandscape?.moatPotential) business += 6;
  business = clamp(business);

  const risks = d.risksAndRedFlags || [];
  const highRisk = risks.filter((r) => (r.severity || "").toLowerCase() === "high").length;
  const medRisk = risks.filter((r) => (r.severity || "").toLowerCase() === "medium").length;
  const riskLegal = clamp(88 - highRisk * 18 - medRisk * 8 - Math.max(0, risks.length - 5) * 3);

  return { team, market, traction, business, riskLegal };
}

function buildTractionTiles(d: DeepBrief): TractionTile[] {
  const palette = [GREEN, BLUE, GREEN, BLUE, AMBER, AMBER];
  const out: TractionTile[] = [];
  const signals = d.tractionValidation?.signals || [];
  for (const s of signals.slice(0, 6)) {
    const sig = txt(s.signal);
    const ev = txt(s.evidence);
    const { value, label } = extractMetric(sig, ev);
    out.push({
      value,
      label,
      sub: truncate(ev, 36),
      color: palette[out.length] || BLUE,
      trend: /up|grow|increas|\b\+/i.test(sig + " " + ev) ? "up" : undefined,
    });
  }
  return out;
}

function extractMetric(signal: string, evidence: string): { value: string; label: string } {
  // Try to find a numeric/$ value in signal or evidence
  const combined = `${signal} ${evidence}`;
  const m =
    combined.match(/\$\d[\d.,]*\s*[KMBT]?/i) ||
    combined.match(/\d[\d.,]*\s*%/) ||
    combined.match(/\b\d[\d.,]*\s*(mo|months|x|customers|users|clients|orgs)\b/i) ||
    combined.match(/\b\d[\d.,]+\b/);
  if (m) {
    const value = m[0].trim();
    // Label = the rest of the signal name w/o the number
    const label = shortLabel(signal.replace(m[0], "").trim() || signal, 22);
    return { value, label: label.toUpperCase() };
  }
  return { value: truncate(signal, 12), label: shortLabel(signal, 22).toUpperCase() };
}

function splitFunding(s: string): { raiseAsk: string; preMoneyVal: string } {
  if (!s) return { raiseAsk: "", preMoneyVal: "" };
  // try "Raise $8M / Pre $40M" or "$8M seed @ $40M pre"
  const raise = s.match(/\$\d[\d.,]*\s*[KMBT]?/i);
  const pre = s.match(/(?:pre|val|post)[^$]*?(\$\d[\d.,]*\s*[KMBT]?)/i);
  return {
    raiseAsk: raise ? raise[0] : "",
    preMoneyVal: pre ? pre[1] : "",
  };
}

function parseRound(s: string): string {
  const m = s.match(/\b(pre[-\s]?seed|seed|series\s+[a-d]|growth|bridge)\b/i);
  return m ? m[0].toUpperCase() : "";
}

function inferSector(d: DeepBrief): string {
  const blob = (
    txt(d.companySnapshot?.whatTheyDo) +
    " " +
    txt(d.companySnapshot?.customer) +
    " " +
    txt(d.companySnapshot?.problem)
  ).toLowerCase();
  const map: [RegExp, string][] = [
    [/health|clinic|medical|patient|biotech|pharma/, "HEALTHTECH"],
    [/fintech|payment|bank|lending|finance/, "FINTECH"],
    [/edu|learning|student|course/, "EDTECH"],
    [/climate|carbon|energy|solar|battery/, "CLIMATETECH"],
    [/security|cyber|vuln|threat/, "CYBERSEC"],
    [/dev|api|developer|infra|cloud|platform/, "DEVTOOLS"],
    [/commerce|retail|shop|brand|consumer/, "CONSUMER"],
    [/legal|law|contract/, "LEGALTECH"],
    [/logistics|supply|freight|warehouse/, "LOGISTICS"],
    [/ai|llm|model|agent/, "AI"],
  ];
  for (const [re, label] of map) if (re.test(blob)) return label;
  return "";
}

function inferModel(s: string): string {
  const k = s.toLowerCase();
  if (k.includes("saas")) return "AI / SAAS";
  if (k.includes("marketplace")) return "MARKETPLACE";
  if (k.includes("transaction") || k.includes("take rate")) return "TRANSACTIONAL";
  if (k.includes("subscription")) return "SUBSCRIPTION";
  if (k.includes("usage") || k.includes("metered")) return "USAGE-BASED";
  if (k.includes("enterprise")) return "ENTERPRISE";
  return "";
}

function inferThreat(c: {
  category: string;
  funding: string;
  whyRelevant: string;
}): "low" | "medium" | "high" {
  const blob = `${c.category} ${c.funding} ${c.whyRelevant}`.toLowerCase();
  if (/(microsoft|google|amazon|meta|apple|public|ipo|unicorn|\$\d+b)/.test(blob)) return "high";
  if (/(exit|shutdown|legacy|wound down|no presence)/.test(blob)) return "low";
  if (/(direct|leader|funded|series\s+[c-z]|raised)/.test(blob)) return "high";
  if (/(adjacent|niche|early)/.test(blob)) return "low";
  return "medium";
}

function shortLabel(s: string, n: number): string {
  const w = s.split(/\s+/).slice(0, 4).join(" ");
  return truncate(w.replace(/[.,;:]$/, ""), n);
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
   Sources grouping
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

// keep imported icon used to satisfy bundler
void Hourglass;

/* =====================================================================
   Plain-text export
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
