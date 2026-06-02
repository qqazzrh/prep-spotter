import type { QuickScreen, TavilyResponse } from "@/lib/prep/types";
import { VerdictBadge } from "./VerdictBadge";
import { SourcesFooter } from "./SourcesFooter";
import { useState } from "react";

const UNKNOWN = "Unknown from public sources.";

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
    const text = data ? formatQuick(founder, company, data) : raw || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Header founder={founder} company={company} verdict={data?.quickVerdict || "unclear"} label="Quick VC Screen" />

      {!data && raw && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <p className="text-sm text-[oklch(0.85_0.14_220)] mb-3">
            Structured parsing failed, showing raw brief.
          </p>
          <pre className="whitespace-pre-wrap text-sm text-foreground">{raw}</pre>
        </div>
      )}

      {data && (
        <div className="space-y-5">
          <Section title="Company one-liner">
            <p className="text-foreground leading-relaxed">{data.companyOneLiner || UNKNOWN}</p>
          </Section>

          <Section title="Founder credibility">
            <p className="text-foreground leading-relaxed">{data.founderCredibility?.summary || UNKNOWN}</p>
            <Bullets items={data.founderCredibility?.signals} />
            <Sources urls={data.founderCredibility?.sourceUrls} />
          </Section>

          <Section title="Company clarity">
            <p className="text-foreground leading-relaxed">{data.companyClarity?.summary || UNKNOWN}</p>
            <Sources urls={data.companyClarity?.sourceUrls} />
          </Section>

          <Section title="Recent momentum">
            {data.recentMomentum?.length ? (
              <ul className="space-y-2">
                {data.recentMomentum.map((m, i) => (
                  <li key={i} className="text-foreground">
                    <span className="text-muted-foreground text-xs mr-2">{m.date}</span>
                    {m.signal}
                    <Sources urls={m.sourceUrls} inline />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{UNKNOWN}</p>
            )}
          </Section>

          <Section title="Funding signal">
            <p className="text-foreground leading-relaxed">{data.fundingSignal?.summary || UNKNOWN}</p>
            <div className="text-sm text-muted-foreground mt-1">
              Stage: <span className="text-foreground">{data.fundingSignal?.stage || "unknown"}</span>
            </div>
            {data.fundingSignal?.knownInvestors?.length ? (
              <div className="text-sm text-muted-foreground mt-1">
                Investors: <span className="text-foreground">{data.fundingSignal.knownInvestors.join(", ")}</span>
              </div>
            ) : null}
            <Sources urls={data.fundingSignal?.sourceUrls} />
          </Section>

          <Section title="Market and competitors">
            <p className="text-foreground leading-relaxed">{data.marketCategory?.summary || UNKNOWN}</p>
            <div className="text-sm text-muted-foreground mt-1">
              Venture-scale potential: <span className="text-foreground">{data.marketCategory?.isVentureScalePotential || "unclear"}</span>
            </div>
            {data.competitors?.length ? (
              <ul className="mt-3 space-y-1">
                {data.competitors.map((c, i) => (
                  <li key={i} className="text-foreground text-sm">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-muted-foreground"> — {c.whyRelevant}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Sources urls={data.marketCategory?.sourceUrls} />
          </Section>

          <Section title="Why this could be interesting">
            <Bullets items={data.reasonsToBeInterested} fallback={UNKNOWN} />
          </Section>

          <Section title="Red flags and unknowns">
            <Bullets items={data.redFlagsOrUnknowns} fallback="None surfaced from public sources." />
          </Section>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              The one question
            </div>
            <p className="text-[oklch(0.85_0.14_220)] text-2xl md:text-3xl font-semibold leading-snug">
              {data.theOneQuestion || UNKNOWN}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={onNew} className="px-4 h-11 rounded-lg border border-border text-foreground hover:bg-secondary">
          Start new prep
        </button>
        <button onClick={onDeep} className="px-4 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-95">
          Run Deep Diligence
        </button>
        <button onClick={copy} className="px-4 h-11 rounded-lg border border-border text-foreground hover:bg-secondary">
          {copied ? "Copied" : "Copy quick screen"}
        </button>
      </div>

      <SourcesFooter results={results} />
    </div>
  );
}

function Header({ founder, company, verdict, label }: { founder: string; company: string; verdict: string; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6 flex flex-wrap items-center gap-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xl font-bold text-foreground mt-0.5">
          {[founder, company].filter(Boolean).join(" · ") || "—"}
        </div>
      </div>
      <div className="ml-auto">
        <VerdictBadge verdict={verdict} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Bullets({ items, fallback }: { items?: string[]; fallback?: string }) {
  if (!items || items.length === 0) return fallback ? <p className="text-muted-foreground">{fallback}</p> : null;
  return (
    <ul className="list-disc list-inside space-y-1 text-foreground">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

function Sources({ urls, inline }: { urls?: string[]; inline?: boolean }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={inline ? "inline ml-2" : "mt-2 text-xs text-muted-foreground"}>
      {!inline && <span>Sources: </span>}
      {urls.map((u, i) => (
        <a
          key={i}
          href={u}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[oklch(0.85_0.14_220)] hover:underline mr-2 text-xs"
        >
          [{i + 1}]
        </a>
      ))}
    </div>
  );
}

export function formatQuick(founder: string, company: string, d: QuickScreen): string {
  const lines: string[] = [];
  lines.push(`PREP — QUICK VC SCREEN`);
  lines.push([founder, company].filter(Boolean).join(" · "));
  lines.push(`Verdict: ${d.quickVerdict}`);
  lines.push("");
  lines.push(`One-liner: ${d.companyOneLiner}`);
  lines.push("");
  lines.push(`Founder credibility: ${d.founderCredibility?.summary}`);
  if (d.founderCredibility?.signals?.length)
    lines.push("- " + d.founderCredibility.signals.join("\n- "));
  lines.push("");
  lines.push(`Company clarity: ${d.companyClarity?.summary}`);
  lines.push("");
  if (d.recentMomentum?.length) {
    lines.push("Recent momentum:");
    d.recentMomentum.forEach((m) => lines.push(`- ${m.date}: ${m.signal}`));
    lines.push("");
  }
  lines.push(`Funding: ${d.fundingSignal?.summary} (stage: ${d.fundingSignal?.stage})`);
  lines.push("");
  lines.push(`Market: ${d.marketCategory?.summary}`);
  if (d.competitors?.length) {
    lines.push("Competitors:");
    d.competitors.forEach((c) => lines.push(`- ${c.name}: ${c.whyRelevant}`));
  }
  lines.push("");
  if (d.reasonsToBeInterested?.length) {
    lines.push("Why interesting:");
    lines.push("- " + d.reasonsToBeInterested.join("\n- "));
  }
  if (d.redFlagsOrUnknowns?.length) {
    lines.push("Red flags / unknowns:");
    lines.push("- " + d.redFlagsOrUnknowns.join("\n- "));
  }
  lines.push("");
  lines.push(`The one question: ${d.theOneQuestion}`);
  return lines.join("\n");
}
