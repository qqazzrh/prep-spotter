import type { PillId } from "@/lib/prep/types";

const PILLS: { id: PillId; label: string }[] = [
  { id: "founder", label: "Founder checked" },
  { id: "company", label: "Company understood" },
  { id: "momentum", label: "Momentum checked" },
  { id: "funding", label: "Funding checked" },
  { id: "redflags", label: "Red flags checked" },
  { id: "brief", label: "Brief ready" },
];

export function StatusCard({
  spend,
  completed,
  total,
  pills,
}: {
  spend: number;
  completed: number;
  total: number;
  pills: Record<PillId, boolean>;
}) {
  const pct = Math.min(1, completed / Math.max(total, 1));
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        Research spend
      </div>
      <div className="mt-1 text-3xl font-bold text-foreground tabular-nums">
        ${spend.toFixed(2)}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Paid per search via x402
      </div>

      <div className="mt-6 flex items-center gap-4">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="oklch(0.34 0.05 254)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="oklch(0.85 0.14 220)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ transition: "stroke-dasharray 400ms ease" }}
          />
        </svg>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Confidence
          </div>
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            {Math.round(pct * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {completed} / {total} searches
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {PILLS.map((p) => (
          <span
            key={p.id}
            className={[
              "px-2.5 py-1 rounded-full text-xs border transition-colors",
              pills[p.id]
                ? "bg-primary/20 border-primary text-foreground"
                : "border-border text-muted-foreground",
            ].join(" ")}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
