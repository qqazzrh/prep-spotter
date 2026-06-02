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
