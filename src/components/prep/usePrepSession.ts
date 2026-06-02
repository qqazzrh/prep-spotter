import { useCallback, useMemo, useRef, useState } from "react";
import { buildQueries, type PlannedQuery } from "@/lib/prep/queries";
import { tavilySearch } from "@/lib/prep/tavily.functions";
import {
  generateQuickScreen,
  generateDeepBrief,
  type AnthropicOutcome,
} from "@/lib/prep/anthropic.functions";

import type {
  FeedItem,
  Mode,
  PillId,
  QuickScreen,
  DeepBrief,
  TavilyResponse,
} from "@/lib/prep/types";

export type Phase = "input" | "research" | "result";

export type BriefState =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "quick"; outcome: AnthropicOutcome<QuickScreen> }
  | { kind: "deep"; outcome: AnthropicOutcome<DeepBrief> };

export function usePrepSession() {
  const [phase, setPhase] = useState<Phase>("input");
  const [founder, setFounder] = useState("");
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState<Mode>("quick");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [pills, setPills] = useState<Record<PillId, boolean>>({
    founder: false,
    company: false,
    momentum: false,
    funding: false,
    redflags: false,
    brief: false,
  });
  const [brief, setBrief] = useState<BriefState>({ kind: "none" });
  const resultsRef = useRef<Record<string, TavilyResponse>>({});
  const plannedRef = useRef<PlannedQuery[]>([]);

  const completed = feed.filter((f) => f.status === "done").length;
  const total = feed.length || plannedRef.current.length || 1;
  const spend = +(completed * 0.01).toFixed(2);

  const updateItem = (id: string, patch: Partial<FeedItem>) =>
    setFeed((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const runOne = useCallback(async (item: FeedItem) => {
    updateItem(item.id, { status: "searching", error: undefined });
    try {
      const resp = await tavilySearch(item.query);
      resultsRef.current[item.query] = resp;
      updateItem(item.id, {
        status: "done",
        resultCount: resp.results?.length ?? 0,
      });
      if (item.pillId) {
        setPills((p) => ({ ...p, [item.pillId as PillId]: true }));
      }
    } catch (e) {
      updateItem(item.id, {
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  const retry = useCallback(
    async (id: string) => {
      const item = feed.find((f) => f.id === id);
      if (item) await runOne(item);
    },
    [feed, runOne]
  );

  const generateBrief = useCallback(
    async (m: Mode) => {
      setBrief({ kind: "loading" });
      const fn = m === "quick" ? generateQuickScreen : generateDeepBrief;
      const outcome = await fn(founder, company, resultsRef.current);
      setBrief(
        m === "quick"
          ? { kind: "quick", outcome: outcome as AnthropicOutcome<QuickScreen> }
          : { kind: "deep", outcome: outcome as AnthropicOutcome<DeepBrief> }
      );
      setPills((p) => ({ ...p, brief: true }));
      setPhase("result");
    },
    [founder, company]
  );

  const start = useCallback(
    async (m: Mode) => {
      setMode(m);
      setBrief({ kind: "none" });
      resultsRef.current = {};
      setPills({
        founder: false,
        company: false,
        momentum: false,
        funding: false,
        redflags: false,
        brief: false,
      });

      const planned = buildQueries(founder, company, m);
      plannedRef.current = planned;
      const items: FeedItem[] = planned.map((q, i) => ({
        id: `q${i}-${Date.now()}`,
        query: q.query,
        pillId: q.pillId,
        status: "pending",
      }));
      setFeed(items);
      setPhase("research");

      for (const item of items) {
        await runOne(item);
      }

      const anyOk = Object.keys(resultsRef.current).length > 0;
      if (!anyOk) {
        setBrief({
          kind: m === "quick" ? "quick" : "deep",
          outcome: { kind: "error", error: "no-results" } as AnthropicOutcome<never>,
        });
        setPhase("result");
        return;
      }
      await generateBrief(m);
    },
    [founder, company, runOne, generateBrief]
  );

  const reset = useCallback(() => {
    setPhase("input");
    setFeed([]);
    setBrief({ kind: "none" });
    resultsRef.current = {};
  }, []);

  const runDeepFromQuick = useCallback(() => {
    start("deep");
  }, [start]);

  const allResults = useMemo(() => resultsRef.current, [feed]);

  return {
    phase,
    founder,
    company,
    mode,
    feed,
    pills,
    spend,
    completed,
    total,
    brief,
    allResults,
    setFounder,
    setCompany,
    start,
    retry,
    reset,
    runDeepFromQuick,
  };
}
