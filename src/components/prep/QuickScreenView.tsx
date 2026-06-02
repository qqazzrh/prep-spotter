import type { QuickScreen, TavilyResponse, TavilyResult } from "@/lib/prep/types";
import { useState } from "react";
import {
  User,
  Package,
  TrendingUp,
  DollarSign,
  Target,
  AlertTriangle,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";

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
    const text = data?.searchSummary || raw || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const subject = [founder, company].filter(Boolean).join(" · ") || "—";
  const verdict = (data?.quickVerdict || "unclear").toString();
  const tone = verdictTone(verdict);
  const headline = verdictHeadline(verdict, data);
  const prose = buildVerdictProse(data, raw);

  const positives = toList(data?.reasonsToBeInterested).slice(0, 4);
  const cautions = toList(data?.redFlagsOrUnknowns).slice(0, 4);
  const neutrals = buildNeutralSignals(data);

  const summaryRows = buildSummaryRows(data);
  const sourceGroups = buildSourceGroups(results);

  return (
    <div
      className="max-w-3xl mx-auto px-4 py-10"
      style={{ fontSize: 14, lineHeight: 1.6 }}
    >
      {/* Header */}
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Quick VC screen
        </div>
        <h1 className="text-2xl text-foreground font-medium">{subject}</h1>
      </header>

      {/* Verdict card */}
      <section
        className={[
          "border border-border rounded-xl bg-card p-5 mb-6 border-l-4",
          tone.border,
        ].join(" ")}
      >
        <div
          className={[
            "text-[11px] uppercase tracking-[0.12em] font-semibold mb-1.5",
            tone.label,
          ].join(" ")}
        >
          {tone.tag}
        </div>
        <h2 className="text-lg text-foreground font-medium mb-2">{headline}</h2>
        <p className="text-foreground/90">{prose}</p>

        {(positives.length || cautions.length || neutrals.length) > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {positives.map((s, i) => (
              <Pill key={`p${i}`} kind="positive">
                {s}
              </Pill>
            ))}
            {cautions.map((s, i) => (
              <Pill key={`c${i}`} kind="caution">
                {s}
              </Pill>
            ))}
            {neutrals.map((s, i) => (
              <Pill key={`n${i}`} kind="neutral">
                {s}
              </Pill>
            ))}
          </div>
        )}
      </section>

      {/* Research summary */}
      <section className="border border-border rounded-xl bg-card p-5 mb-6">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-4">
          Research summary
        </div>
        {summaryRows.length > 0 ? (
          <ul className="space-y-3">
            {summaryRows.map((r) => (
              <li key={r.label} className="flex gap-3">
                <r.Icon className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">{r.label}.</span>{" "}
                  <span className="text-foreground/90">{r.text}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : raw ? (
          <pre className="whitespace-pre-wrap text-foreground/90">{raw}</pre>
        ) : (
          <p className="text-muted-foreground">No summary available.</p>
        )}
      </section>

      {/* Sources grouped by topic */}
      {sourceGroups.length > 0 && (
        <section className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
            Sources
          </div>
          <div className="space-y-2">
            {sourceGroups.map((g, idx) => (
              <SourceGroup key={g.title} group={g} defaultOpen={idx === 0} />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onDeep}
          className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
        >
          Dive into deep VC search
        </button>
        <button
          onClick={onNew}
          className="h-10 px-4 rounded-md border border-border text-foreground/80 hover:bg-secondary/50"
        >
          Start new prep
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

/* ---------------- Verdict helpers ---------------- */

function verdictTone(v: string) {
  const k = v.toLowerCase();
  if (
    ["interesting", "strong interest", "lean in", "worth meeting", "meet once"].some(
      (x) => k.includes(x)
    )
  ) {
    return {
      tag: "Pass — worth a meeting",
      border: "border-l-[oklch(0.72_0.17_150)]",
      label: "text-[oklch(0.72_0.17_150)]",
    };
  }
  if (["pass", "no", "decline"].some((x) => k === x || k.includes(x))) {
    return {
      tag: "No — decline",
      border: "border-l-[oklch(0.62_0.22_22)]",
      label: "text-[oklch(0.62_0.22_22)]",
    };
  }
  if (
    ["maybe", "watchlist", "monitor", "conditional", "unclear"].some((x) =>
      k.includes(x)
    )
  ) {
    return {
      tag: "Conditional interest",
      border: "border-l-[oklch(0.78_0.16_75)]",
      label: "text-[oklch(0.78_0.16_75)]",
    };
  }
  return {
    tag: v || "Unclear",
    border: "border-l-border",
    label: "text-muted-foreground",
  };
}

function verdictHeadline(v: string, d: QuickScreen | null): string {
  const k = v.toLowerCase();
  if (k.includes("interest") || k.includes("lean") || k.includes("meet")) {
    return "Worth a meeting — take a first call to validate the thesis";
  }
  if (k === "pass" || k.includes("decline") || k === "no") {
    return "Pass — signals don't justify a first meeting";
  }
  if (k.includes("maybe") || k.includes("watch") || k.includes("monitor") || k.includes("conditional")) {
    return "Conditional interest — validate before committing time";
  }
  return d?.companyOneLiner || "Mixed signals — review summary before deciding";
}

function buildVerdictProse(d: QuickScreen | null, raw?: string): string {
  if (!d) return raw ? "Model returned unstructured output — see raw summary below." : "No summary available.";
  if (d.searchSummary) return d.searchSummary;
  const parts = [
    d.companyOneLiner,
    d.founderCredibility?.summary,
    d.fundingSignal?.summary,
  ].filter(Boolean);
  return parts.join(" ");
}

function buildNeutralSignals(d: QuickScreen | null): string[] {
  if (!d) return [];
  const out: string[] = [];
  if (d.marketCategory?.summary) out.push(d.marketCategory.summary);
  if (d.fundingSignal?.stage) out.push(`Stage: ${d.fundingSignal.stage}`);
  if (d.companyClarity?.isClear === false) out.push("Company description unclear");
  return out.slice(0, 3);
}

/* ---------------- Pills ---------------- */

function Pill({
  kind,
  children,
}: {
  kind: "positive" | "caution" | "neutral";
  children: React.ReactNode;
}) {
  const styles: Record<typeof kind, string> = {
    positive:
      "bg-[oklch(0.85_0.14_220)]/10 text-[oklch(0.78_0.16_220)] border-[oklch(0.85_0.14_220)]/30",
    caution:
      "bg-[oklch(0.78_0.16_75)]/10 text-[oklch(0.72_0.16_75)] border-[oklch(0.78_0.16_75)]/30",
    neutral:
      "bg-secondary/50 text-muted-foreground border-border",
  };
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] leading-5",
        styles[kind],
      ].join(" ")}
    >
      {truncate(String(children), 60)}
    </span>
  );
}

/* ---------------- Summary rows ---------------- */

function buildSummaryRows(d: QuickScreen | null) {
  if (!d) return [];
  const rows: { label: string; text: string; Icon: typeof User }[] = [];
  const founderSummary = summaryOf(d.founderCredibility);
  if (founderSummary) {
    rows.push({ label: "Founder", text: founderSummary, Icon: User });
  }
  const product = d.companyOneLiner || summaryOf(d.companyClarity);
  if (product) rows.push({ label: "Product", text: product, Icon: Package });
  const fundingSummary = summaryOf(d.fundingSignal);
  if (fundingSummary) {
    rows.push({ label: "Funding", text: fundingSummary, Icon: DollarSign });
  }
  const tractionParts = toList(d.recentMomentum)
    .slice(0, 2)
    .map((m) => (typeof m === "string" ? m : `${m.signal}${m.date ? ` (${m.date})` : ""}`));
  if (tractionParts.length) {
    rows.push({ label: "Traction", text: tractionParts.join("; "), Icon: TrendingUp });
  }
  const marketSummary = summaryOf(d.marketCategory);
  if (marketSummary) {
    rows.push({ label: "Market", text: marketSummary, Icon: Target });
  }
  const redFlags = toList(d.redFlagsOrUnknowns);
  if (redFlags.length) {
    rows.push({
      label: "Identity noise",
      text: redFlags.slice(0, 2).join("; "),
      Icon: AlertTriangle,
    });
  }
  return rows.slice(0, 6);
}

/* ---------------- Sources grouping ---------------- */

type SourceGroupT = {
  title: string;
  queries: string[];
  items: TavilyResult[];
};

function buildSourceGroups(
  results: Record<string, TavilyResponse>
): SourceGroupT[] {
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

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export function formatQuick(_founder: string, _company: string, d: QuickScreen): string {
  return d.searchSummary || "";
}
