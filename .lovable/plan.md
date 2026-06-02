## Root cause

1. `claude-haiku-4-5` returned its answer wrapped in a ```` ```json … ``` ```` fence (and probably truncated before the closing fence, since `max_tokens: 4500` is near the limit for the schema we ask for).
2. `extractJson` in `src/lib/prep/anthropic.functions.ts` requires a *closing* ` ``` ` for its regex to match, and the brace-slice fallback fails on truncated JSON.
3. With `data === null`, `QuickScreenView` falls back to `raw` and renders the entire JSON dump as the conviction summary — exactly what the screenshot shows.

## Fix

### 1. Force the model to emit raw JSON (no fences, no preamble)
In `src/routes/api/brief.ts`:
- Add an **assistant prefill** to the Anthropic request: `messages: [ { role: "user", content: user }, { role: "assistant", content: "{" } ]`.
  Claude will continue from `{`, guaranteeing pure JSON with no markdown fence and no leading prose.
- Prepend `{` to the streamed text on the server before forwarding, so the client receives a complete JSON document.
- Bump `max_tokens` for `quick` mode from 4500 → 6000 to avoid truncation of the rich schema.

### 2. Harden `extractJson` for partial / messy output
In `src/lib/prep/anthropic.functions.ts`:
- Strip any leading garbage (smart quotes, ```` ``` ````, `json` label, whitespace) before parsing.
- If a closing fence is missing, strip the opening fence and parse the remainder.
- Replace the naive `indexOf("{") … lastIndexOf("}")` fallback with a **brace-balanced extractor** that walks the string respecting strings/escapes, so a truncated tail is trimmed back to the last balanced `}`.
- Last resort: try to "auto-close" by appending the right number of `}` / `]` to recover partial JSON.

### 3. Stop dumping raw JSON into the UI
In `src/components/prep/QuickScreenView.tsx`:
- Remove `raw` from the `convictionSummary` fallback chain (line 82–86) and from the copy handler (line 61).
- When `data` is null, render a small inline error state instead: "Couldn't parse the model response. Try again." with a retry button — never render `raw` as prose.
- Same treatment for `DeepBriefView` if it has the equivalent fallback.

### 4. (Optional polish) Log truncation
In the brief route, log the final `stop_reason` from Anthropic's `message_stop` event so we can detect future `max_tokens` truncations server-side.

## Files touched
- `src/routes/api/brief.ts` — assistant prefill, prepend `{`, raise max_tokens, log stop_reason
- `src/lib/prep/anthropic.functions.ts` — robust `extractJson`
- `src/components/prep/QuickScreenView.tsx` — remove `raw` fallback, add error state
- `src/components/prep/DeepBriefView.tsx` — same fallback cleanup if present

No schema or layout changes — the result page will look exactly as designed when JSON parses, and show a clean error otherwise.
