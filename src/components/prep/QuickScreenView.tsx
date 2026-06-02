import type { QuickScreen, TavilyResponse, TavilyResult } from "@/lib/prep/types";
import { useState } from "react";
import {
  Flame,
  Link as LinkIcon,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ====================================================================
   Color tokens (two accents only beyond white/gray):
     GREEN  = oklch(0.74 0.17 150)   positive
     AMBER  = oklch(0.78 0.16 75)    moderate risk
     RED    = oklch(0.62 0.22 22)    critical risk / no
   Body text is foreground; muted-foreground for secondary.
   ==================================================================== */

const GREEN = "oklch(0.74 0.17 150)";
const AMBER = "oklch(0.78 0.16 75)";
const RED = "oklch(0.62 0.22 22)";

/** Render-safety: coerce any model value to a string for React text nodes.
 *  Objects/arrays/null/undefined become "" so we never throw
 *  "Objects are not valid as a React child". */
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

export function QuickScreenView({
  founder,
  company,
  data,
  raw,
  results,
  onNew,
  onDeep,
}: {
  founder: string;
  company: string;
  data: QuickScreen | null;
  raw?: string;
  results: Record<string, TavilyResponse>;
  onNew: () => void;
  onDeep: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const text = data?.convictionSummary || data?.searchSummary || raw || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const subject =
    [
      titleCase(company) || company || "",
      data?.meta?.round || "",
    ]
      .filter(Boolean)
      .join(" · ") || titleCase(founder) || "—";

  const verdictTag = txt(data?.verdictLabel || derivedVerdictLabel(txt(data?.quickVerdict))).toUpperCase() || "UNCLEAR";
  const tone = verdictTone(verdictTag);

  const headline =
    txt(data?.verdictHeadline) ||
    derivedHeadline(txt(data?.quickVerdict), txt(data?.companyOneLiner));

  const convictionSummary =
    txt(data?.convictionSummary) ||
    txt(data?.searchSummary) ||
    raw ||
    "";

  const founderProfile = data?.founderProfile;
  const founderName = txt(founderProfile?.name) || titleCase(founder) || "";
  const founderInitials =
    txt(founderProfile?.initials) || initialsOf(founderName);
  const founderCreds = Array.isArray(founderProfile?.credentials)
    ? founderProfile!.credentials!
    : deriveFounderCreds(data);

  const founderScores = (founderProfile?.scores && typeof founderProfile.scores === "object"
    ? founderProfile.scores
    : {}) as Record<string, unknown>;

  const conviction = data?.conviction;
  const convictionScore = num(conviction?.score);
  const cat = (conviction?.categoryScores && typeof conviction.categoryScores === "object"
    ? conviction.categoryScores
    : {}) as Record<string, unknown>;

  const market = data?.market;
  const greenSignals = data?.greenSignals || deriveGreenSignals(data);
  const riskSignals = data?.riskSignals || deriveRiskSignals(data);
  const questionsToAsk = data?.questionsToAsk || deriveQuestions(data);

  const sourceGroups = buildSourceGroups(results);

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8"
      style={{ fontSize: 14, lineHeight: 1.6 }}
    >
      {/* 1. Page header */}
      <header className="mb-6">
        <SectionLabel>Quick VC screen</SectionLabel>
        <h1 className="mt-1.5 text-3xl md:text-4xl text-foreground font-semibold tracking-tight">
          {subject}
        </h1>
        {data?.meta && <MetaPills meta={data.meta} />}
      </header>

      {/* 2-4. Three-column main row */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Founder card */}
        <aside className="col-span-12 lg:col-span-3">
          <Card>
            <SectionLabel>Founder &amp; team</SectionLabel>
            <div className="mt-4 flex items-start gap-3">
              <Avatar initials={founderInitials} color="primary" />
              <div className="min-w-0">
                <div className="text-foreground font-semibold leading-tight">
                  {founderName || "—"}
                </div>
                <div className="text-muted-foreground text-[13px]">
                  {txt(founderProfile?.title)}
                </div>
              </div>
            </div>

            {founderCreds.length > 0 && (
              <ul className="mt-4 space-y-2">
                {founderCreds.slice(0, 5).map((c, i) => (
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

            {hasAnyScore(founderScores) && (
              <div className="mt-5 space-y-2.5">
                <ScoreBar label="Founder–Mkt Fit" value={num(founderScores.founderMarketFit)} />
                <ScoreBar label="Domain Expertise" value={num(founderScores.domainExpertise)} />
                <ScoreBar label="Sales / GTM" value={num(founderScores.salesGtm)} />
                <ScoreBar label="Technical Depth" value={num(founderScores.technicalDepth)} />
                <ScoreBar label="Resilience / Grit" value={num(founderScores.resilience)} />
              </div>
            )}

            {data?.coFounder && (
              <div className="mt-5 border border-border rounded-lg p-3 flex items-center gap-3">
                <Avatar
                  initials={data.coFounder.initials || initialsOf(txt(data.coFounder.name))}
                  color="muted"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground text-[13px] font-medium truncate">
                    {txt(data.coFounder.name)}
                  </div>
                  <div className="text-muted-foreground text-[12px] truncate">
                    {txt(data.coFounder.title)}
                    {data.coFounder.credentials ? ` · ${txt(data.coFounder.credentials)}` : ""}
                  </div>
                </div>
                {data.coFounder.fit && (
                  <span
                    className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded border"
                    style={{ color: GREEN, borderColor: GREEN }}
                  >
                    ✓ FIT
                  </span>
                )}
              </div>
            )}

            {data?.criticalGap && (
              <div
                className="mt-3 rounded-lg border p-3 flex gap-2 items-start"
                style={{ borderColor: AMBER, background: `color-mix(in oklab, ${AMBER} 8%, transparent)` }}
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: AMBER }} />
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: AMBER }}>
                    {txt(data.criticalGap.title)}
                  </div>
                  <div className="text-[12px] text-foreground/80">
                    {txt(data.criticalGap.note)}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </aside>

        {/* Verdict card */}
        <section className="col-span-12 lg:col-span-6">
          <Card accentBorder={tone.color}>
            <div
              className="text-[11px] uppercase tracking-[0.14em] font-bold"
              style={{ color: tone.color }}
            >
              {txt(verdictTag)}
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-foreground tracking-tight">
              {txt(headline)}
            </h2>
            {convictionSummary && (
              <p className="mt-3 italic text-foreground/90">
                &ldquo;{txt(convictionSummary)}&rdquo;
              </p>
            )}

            {questionsToAsk.length > 0 && (
              <div className="mt-5">
                <SectionLabel>Questions to ask in the meeting</SectionLabel>
                <ol className="mt-3 space-y-2.5">
                  {questionsToAsk.slice(0, 5).map((q, i) => (
                    <li key={i} className="flex gap-3 text-[14px]">
                      <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-md border border-border text-[11px] text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-foreground">
                          {txt(q.topic)}:
                        </span>{" "}
                        <span className="text-foreground/90">{txt(q.question)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </section>

        {/* Conviction score card */}
        <aside className="col-span-12 lg:col-span-3">
          <Card>
            {convictionScore != null ? (
              <>
                <div
                  className="text-5xl font-semibold tabular-nums leading-none"
                  style={{ color: GREEN }}
                >
                  {num(convictionScore) ?? ""}
                </div>
                <div className="mt-1.5 text-[12px] text-muted-foreground">
                  / 100 conviction score
                </div>
              </>
            ) : (
              <div className="text-[12px] text-muted-foreground">No conviction score</div>
            )}

            {hasAnyScore(cat) && (
              <>
                <div className="mt-5">
                  <SectionLabel>Category scores</SectionLabel>
                </div>
                <div className="mt-3 space-y-2.5">
                  <ScoreBar label="Team" value={num(cat.team)} />
                  <ScoreBar label="Market" value={num(cat.market)} />
                  <ScoreBar label="Traction" value={num(cat.traction)} />
                  <ScoreBar label="Business" value={num(cat.business)} />
                  <ScoreBar label="Risk / Legal" value={num(cat.riskLegal)} />
                </div>
              </>
            )}

            {(conviction?.weighting || convictionScore != null) && (
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {txt(conviction?.weighting) || "Weighted"}
                </span>
                {convictionScore != null && (
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: GREEN }}
                  >
                    {num(convictionScore) ?? ""}
                  </span>
                )}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* 5. Market opportunity */}
      {market && hasAnyMarketSignal(market) && <MarketCard market={market} />}

      {/* 6. Signals two-column */}
      {(greenSignals.length > 0 || riskSignals.length > 0) && (
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 md:col-span-6">
            <Card>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4" style={{ color: GREEN }} />
                <SectionLabel style={{ color: GREEN }}>Green signals</SectionLabel>
              </div>
              <ul className="mt-4 space-y-3">
                {greenSignals.slice(0, 6).map((s, i) => (
                  <SignalRow key={i} label={s.label} text={s.text} kind="good" />
                ))}
                {greenSignals.length === 0 && (
                  <li className="text-[13px] text-muted-foreground">No clear green signals.</li>
                )}
              </ul>
            </Card>
          </div>
          <div className="col-span-12 md:col-span-6">
            <Card>
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4" style={{ color: AMBER }} />
                <SectionLabel style={{ color: AMBER }}>Risk signals</SectionLabel>
              </div>
              <ul className="mt-4 space-y-3">
                {riskSignals.slice(0, 6).map((s, i) => (
                  <SignalRow
                    key={i}
                    label={s.label}
                    text={s.text}
                    kind={s.severity === "critical" ? "critical" : "moderate"}
                  />
                ))}
                {riskSignals.length === 0 && (
                  <li className="text-[13px] text-muted-foreground">No flagged risks.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* 7. Sources */}
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

      {/* 8. Bottom action bar */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <button
          onClick={onDeep}
          className="h-10 px-5 rounded-md font-medium text-background"
          style={{ background: GREEN }}
        >
          Dive into full analysis →
        </button>
        <button
          onClick={onNew}
          className="h-10 px-4 rounded-md border border-border text-foreground/85 hover:bg-secondary/50"
        >
          Start new prep
        </button>
        <button
          className="h-10 px-4 rounded-md border border-border text-foreground/85 hover:bg-secondary/50"
          onClick={onNew}
          title="Coming soon"
        >
          Open diligence checklist
        </button>
        <button
          onClick={copy}
          className="h-10 px-4 rounded-md text-foreground/70 hover:bg-secondary/50 ml-auto"
        >
          {copied ? "Copied" : "Copy summary"}
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
  const color = v >= 70 ? GREEN : v >= 50 ? AMBER : RED;
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

function MetaPills({ meta }: { meta: NonNullable<QuickScreen["meta"]> }) {
  const items: { label: string; danger?: boolean; flame?: boolean }[] = [];
  const push = (v: unknown, opts: { danger?: boolean; flame?: boolean } = {}) => {
    const s = txt(v);
    if (s) items.push({ label: s, ...opts });
  };
  push(meta.round);
  push(meta.valuation);
  push(meta.sector);
  push(meta.founded);
  push(meta.competingTermSheets, { danger: true, flame: true });
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-[12px]"
          style={
            p.danger
              ? {
                  borderColor: AMBER,
                  color: AMBER,
                  background: `color-mix(in oklab, ${AMBER} 10%, transparent)`,
                }
              : { borderColor: "var(--border)", color: "var(--foreground)" }
          }
        >
          {p.flame && <Flame className="size-3.5" />}
          {p.label}
        </span>
      ))}
    </div>
  );
}

function MarketCard({ market }: { market: NonNullable<QuickScreen["market"]> }) {
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

  const directionStr = txt(market.direction).toLowerCase();
  const isExpanding = directionStr.includes("expand");
  const isContracting = directionStr.includes("contract");
  const dirColor = isContracting ? RED : GREEN;
  const dirLabel = isContracting
    ? "Contracting ↓"
    : isExpanding
      ? "Expanding ↑"
      : txt(market.direction);

  const tw = txt(market.tailwind);
  const hw = txt(market.headwind);
  const cw = tw
    ? { label: "Tailwind:", text: tw, color: GREEN }
    : hw
      ? { label: "Headwind:", text: hw, color: RED }
      : null;
  const growth = txt(market.growthPctYoY);

  return (
    <div className="mb-4">
      <Card>
        <SectionLabel>Market opportunity</SectionLabel>
        <div className="mt-4 grid grid-cols-12 gap-5">
          {(market.growthPctYoY || dirLabel) && (
            <div className="col-span-12 md:col-span-3 flex md:block items-center gap-4">
              {market.growthPctYoY && (
                <>
                  <div className="text-[12px] text-muted-foreground">Market growth</div>
                  <div
                    className="text-3xl font-semibold leading-tight"
                    style={{ color: GREEN }}
                  >
                    {market.growthPctYoY} <span className="text-[12px] text-muted-foreground font-normal">YoY</span>
                  </div>
                </>
              )}
              {dirLabel && (
                <span
                  className="mt-3 inline-flex items-center px-2.5 h-7 rounded-full border text-[11px] uppercase tracking-wider font-semibold"
                  style={{
                    borderColor: dirColor,
                    color: dirColor,
                    background: `color-mix(in oklab, ${dirColor} 10%, transparent)`,
                  }}
                >
                  {dirLabel}
                </span>
              )}
            </div>
          )}

          {bars.length > 0 && (
            <div className="col-span-12 md:col-span-5 space-y-2">
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

          {cw && (
            <div className="col-span-12 md:col-span-4">
              <div
                className="rounded-lg border-l-2 bg-secondary/30 p-3"
                style={{ borderLeftColor: cw.color }}
              >
                <span className="font-semibold" style={{ color: cw.color }}>
                  {cw.label}{" "}
                </span>
                <span className="text-foreground/90">{cw.text}</span>
              </div>
            </div>
          )}
        </div>
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

/* =====================================================================
   Helpers: derivations from base QuickScreen for graceful fallbacks
   ===================================================================== */

function derivedVerdictLabel(v?: string): string {
  const k = (v || "").toLowerCase();
  if (k.includes("interest") || k.includes("lean") || k.includes("meet")) return "PASS";
  if (k === "pass" || k.includes("decline") || k === "no") return "NO";
  if (k.includes("maybe") || k.includes("watch") || k.includes("monitor") || k.includes("conditional"))
    return "CONDITIONAL";
  return "UNCLEAR";
}

function derivedHeadline(v: string | undefined, oneLiner?: string): string {
  const label = derivedVerdictLabel(v);
  if (label === "PASS") return "Worth a meeting";
  if (label === "NO") return "Pass — signals don't justify a first meeting";
  if (label === "CONDITIONAL") return "Conditional interest — validate before committing";
  return oneLiner || "Mixed signals — review summary";
}

function verdictTone(label: string): { color: string } {
  const k = label.toUpperCase();
  if (k.includes("STRONG") || k === "PASS") return { color: GREEN };
  if (k === "NO" || k.includes("DECLINE")) return { color: RED };
  if (k.includes("CONDITIONAL") || k.includes("MAYBE")) return { color: AMBER };
  return { color: "var(--muted-foreground)" };
}

function deriveFounderCreds(d: QuickScreen | null): string[] {
  const out: string[] = [];
  const fc = d?.founderCredibility?.signals;
  if (Array.isArray(fc)) out.push(...fc.slice(0, 5));
  return out;
}

function deriveGreenSignals(d: QuickScreen | null): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  for (const r of d?.reasonsToBeInterested || []) {
    out.push({ label: shortLabel(r), text: r });
  }
  return out.slice(0, 6);
}

function deriveRiskSignals(d: QuickScreen | null): { label: string; text: string; severity?: string }[] {
  const out: { label: string; text: string; severity?: string }[] = [];
  for (const r of d?.redFlagsOrUnknowns || []) {
    out.push({ label: shortLabel(r), text: r, severity: "moderate" });
  }
  return out.slice(0, 6);
}

function deriveQuestions(d: QuickScreen | null): { topic: string; question: string }[] {
  if (!d?.theOneQuestion) return [];
  return [{ topic: "Key question", question: d.theOneQuestion }];
}

function shortLabel(s: string): string {
  const w = s.split(/\s+/).slice(0, 3).join(" ");
  return truncate(w.replace(/[.,;:]$/, ""), 22);
}

function hasAnyScore(o: Record<string, unknown> | undefined): boolean {
  if (!o) return false;
  return Object.values(o).some((v) => num(v) !== undefined);
}

function hasAnyMarketSignal(m: NonNullable<QuickScreen["market"]>): boolean {
  return !!(m.growthPctYoY || m.direction || m.tam || m.sam || m.som || m.tailwind || m.headwind);
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
      .slice(0, 6);
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

export function formatQuick(_founder: string, _company: string, d: QuickScreen): string {
  return d.convictionSummary || d.searchSummary || "";
}
