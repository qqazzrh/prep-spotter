import { createFileRoute } from "@tanstack/react-router";
import { CLUELY_QUICK, CLUELY_RESULTS, isCluely } from "@/lib/prep/fixtures/cluely";

// Server-side preload for canned demo cases. If founder+company match a
// known fixture, return the pre-built quick screen + per-query results so
// the client can skip Tavily and Anthropic entirely.
export const Route = createFileRoute("/api/preload")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const founder = url.searchParams.get("founder") || "";
        const company = url.searchParams.get("company") || "";
        const mode = url.searchParams.get("mode") || "quick";

        if (mode === "quick" && isCluely(founder, company)) {
          return new Response(
            JSON.stringify({
              hit: true,
              mode: "quick",
              data: CLUELY_QUICK,
              results: CLUELY_RESULTS,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(JSON.stringify({ hit: false }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
