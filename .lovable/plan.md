# Prep — VC Founder Research MVP

A dark-themed single-page app that lets a VC enter a founder/company and get either a Quick VC Screen or a Deep Diligence brief, powered by real Tavily + Anthropic + ElevenLabs calls.

## Scope

Four screens in one flow:
1. Landing / Input
2. Live Research Feed (with status card + spend counter)
3. Quick VC Screen memo
4. Deep Diligence brief (with Copy + Listen)

No auth, no database, no mock data. All state is in-memory for the session.

## Architecture

- **Stack**: TanStack Start (already set up). Single route `/` that switches between view states (`input` → `research` → `result`) via local React state — simpler than 4 routes for an ephemeral flow, and avoids URL/state sync issues with raw API responses.
- **API calls**: Direct from the browser using the three `VITE_*` keys as specified. (Note: this exposes the keys in the bundle — flagged below.)
- **State**: A single `usePrepSession` hook holding `{ founder, company, mode, feed[], resultsStore, status, brief }`.
- **No backend functions** since keys are `VITE_*` and CORS allows browser calls to all three providers.

## Files

```
src/
  routes/
    index.tsx                  # hosts the PrepApp
  components/prep/
    InputScreen.tsx
    ResearchFeed.tsx           # left column: query feed
    StatusCard.tsx             # right column: spend, ring, pills
    QuickScreenView.tsx
    DeepBriefView.tsx
    SourcesFooter.tsx
    VerdictBadge.tsx
  lib/prep/
    queries.ts                 # builds query lists for each mode/input combo
    tavily.ts                  # search() with retry
    anthropic.ts               # quickScreen() + deepBrief() with JSON-mode prompts
    elevenlabs.ts              # tts() returns audio blob URL
    types.ts                   # QuickScreen, DeepBrief, FeedItem, etc.
    orchestrator.ts            # runs sequential searches, updates feed, then calls Claude
  styles.css                   # add Prep tokens
```

## Design tokens (added to `src/styles.css`)

```css
--background: oklch from #050d1a
--card:       oklch from #0d1f35
--border:     oklch from #1a3a5c
--primary:    oklch from #2D7DD2
--accent:     oklch from #00D4FF  (used for "the one question" + pulsing dot)
--foreground: white
--muted-foreground: muted gray
```

Inter loaded via Google Fonts `<link>` in `__root.tsx` head.

## Flow details

**Input screen**: two fields + two buttons. Validation: at least one non-empty. Primary CTA "Generate Quick VC Screen", secondary "Run Deep Diligence".

**Research orchestrator**:
- Builds query list from `queries.ts` based on which fields are filled and mode.
- Loops queries sequentially. For each: push feed item (status `searching`, cyan pulsing dot) → `POST https://api.tavily.com/search` with `{api_key, query, include_answer:true, search_depth:"advanced", max_results:8}` → on success update to `done` with `Found N sources`, increment spend by $0.01, store in `resultsStore[query]`. On failure: `failed` state with red retry button that re-runs that one query.
- Status pills flip as their topic's query completes (mapped by query index → pill).
- Confidence ring = completed / total.
- After all queries finish (or skipped after retries), call Anthropic.

**Anthropic call**: `POST https://api.anthropic.com/v1/messages` with `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true` header (required for browser calls), model `claude-sonnet-4-5`, system prompt from spec, user message = founder/company + all raw Tavily JSON. Request JSON output. Parse; on parse failure show raw text fallback.

**Result rendering**: section components map 1:1 to the JSON schemas in the spec. Missing fields render "Unknown from public sources." The one question rendered in large cyan text (Quick Screen). Deep Brief uses a memo-style layout with numbered sections.

**Sources footer**: collect every unique URL from `resultsStore`, group by source query, render in a `<details>` with title + domain, `target="_blank" rel="noopener noreferrer"`.

**Copy**: builds plain-text version of the brief and writes to clipboard.

**Listen** (Deep brief only): `POST https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM` with the brief text → blob → `<audio>` element. If the call errors, the button is hidden silently on next render.

## Error states

- Tavily fail → red feed row with retry.
- Anthropic fail → "Could not generate the brief. Please retry." with retry button (re-uses cached `resultsStore`, no re-search).
- JSON parse fail → show raw text with "Structured parsing failed, showing raw brief."
- Zero useful sources → "Not enough public information found. Try adding both founder and company name."

## Important call-out (security)

The spec uses `VITE_*` for all three keys, meaning **Anthropic, Tavily, and ElevenLabs API keys will ship in the browser bundle** and can be extracted by anyone who loads the site. This is fine for a local/personal MVP demo but unsafe for any public deployment. I'll build it exactly as specified; happy to switch the three calls to TanStack `createServerFn` (keys become `process.env`, never reach the browser) at any point — just say the word.

## Out of scope

- x402 is label-only ("Paid per search via x402"); no actual payments wiring.
- No persistence, history, accounts, or sharing.
- No streaming Claude responses (one-shot JSON for reliability).
