import { createFileRoute } from "@tanstack/react-router";
import { usePrepSession } from "@/components/prep/usePrepSession";
import { InputScreen } from "@/components/prep/InputScreen";
import { ResearchFeed } from "@/components/prep/ResearchFeed";
import { StatusCard } from "@/components/prep/StatusCard";
import { QuickScreenView } from "@/components/prep/QuickScreenView";
import { DeepBriefView } from "@/components/prep/DeepBriefView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FounderLens — Know if a founder is worth your time" },
      { name: "description", content: "Fast VC research: founder + company first-pass screen and deep diligence brief, with sources." },
      { property: "og:title", content: "FounderLens" },
      { property: "og:description", content: "Know if a founder is worth your time before the meeting." },
    ],
  }),
  component: PrepApp,
});

function PrepApp() {
  const s = usePrepSession();

  if (s.phase === "input") {
    return (
      <InputScreen
        founder={s.founder}
        company={s.company}
        setFounder={s.setFounder}
        setCompany={s.setCompany}
        onStart={s.start}
      />
    );
  }

  if (s.phase === "research") {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={s.reset}
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6"
          >
            ← New prep
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <ResearchFeed
                founder={s.founder}
                company={s.company}
                modeLabel={s.mode === "quick" ? "Quick VC Screen" : "Deep Diligence"}
                feed={s.feed}
                onRetry={s.retry}
              />
            </div>
            <div className="lg:col-span-2">
              <StatusCard
                spend={s.spend}
                completed={s.completed}
                total={s.total}
                pills={s.pills}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // result
  if (s.brief.kind === "loading") {
    return <BriefLoading mode={s.mode} streamingText={s.streamingText} />;
  }

  if (s.brief.kind === "quick") {
    const o = s.brief.outcome;
    if (o.kind === "error") {
      return (
        <ErrorScreen
          message={
            o.error === "no-results"
              ? "Not enough public information found. Try adding both founder and company name."
              : "Could not generate the brief. Please retry."
          }
          onNew={s.reset}
        />
      );
    }
    return (
      <QuickScreenView
        founder={s.founder}
        company={s.company}
        data={o.kind === "ok" ? o.data : null}
        raw={o.kind === "raw" ? o.raw : undefined}
        results={s.allResults}
        onNew={s.reset}
        onDeep={s.runDeepFromQuick}
      />
    );
  }

  if (s.brief.kind === "deep") {
    const o = s.brief.outcome;
    if (o.kind === "error") {
      return (
        <ErrorScreen
          message={
            o.error === "no-results"
              ? "Not enough public information found. Try adding both founder and company name."
              : "Could not generate the brief. Please retry."
          }
          onNew={s.reset}
        />
      );
    }
    return (
      <DeepBriefView
        founder={s.founder}
        company={s.company}
        data={o.kind === "ok" ? o.data : null}
        raw={o.kind === "raw" ? o.raw : undefined}
        results={s.allResults}
        onNew={s.reset}
      />
    );
  }

  return null;
}

function ErrorScreen({ message, onNew }: { message: string; onNew: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-foreground text-lg">{message}</p>
        <button
          onClick={onNew}
          className="mt-6 px-4 h-11 rounded-lg bg-primary text-primary-foreground font-semibold"
        >
          Start new prep
        </button>
      </div>
    </main>
  );
}

function BriefLoading({
  mode,
  streamingText,
}: {
  mode: "quick" | "deep";
  streamingText: string;
}) {
  const label = mode === "deep" ? "Deep Diligence" : "Quick VC Screen";
  const hint = mode === "deep"
    ? "Streaming 13 sections from the model — first content appears in 1–2 seconds."
    : "Streaming the screen from collected sources — first content appears in 1–2 seconds.";
  const chars = streamingText.length;
  // Strip JSON syntax so the preview reads like prose.
  const preview = streamingText
    .replace(/[{}\[\]"`]/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(-600);
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 text-center">
          Generating {label}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          {chars > 0 ? "Writing your research summary…" : "Connecting to the model…"}
        </h2>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden relative mb-3">
          <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary animate-[loadingbar_1.6s_ease-in-out_infinite]" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{hint}</span>
          <span className="tabular-nums">{chars.toLocaleString()} chars</span>
        </div>
        {preview && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground leading-relaxed max-h-64 overflow-hidden">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">
              Live preview
            </div>
            <p className="whitespace-pre-wrap">…{preview}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loadingbar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </main>
  );
}

