export function VerdictBadge({ verdict }: { verdict: string }) {
  const v = (verdict || "unclear").toLowerCase();
  const styles: Record<string, string> = {
    interesting: "bg-primary/20 border-primary text-foreground",
    "strong interest": "bg-primary/20 border-primary text-foreground",
    "lean in": "bg-primary/20 border-primary text-foreground",
    "worth meeting": "bg-primary/20 border-primary text-foreground",
    "meet once": "bg-primary/20 border-primary text-foreground",
    maybe: "bg-[oklch(0.85_0.14_220)]/15 border-[oklch(0.85_0.14_220)] text-foreground",
    watchlist: "bg-[oklch(0.85_0.14_220)]/15 border-[oklch(0.85_0.14_220)] text-foreground",
    monitor: "bg-[oklch(0.85_0.14_220)]/15 border-[oklch(0.85_0.14_220)] text-foreground",
    pass: "bg-[oklch(0.62_0.22_22)]/15 border-[oklch(0.62_0.22_22)] text-foreground",
    unclear: "border-border text-muted-foreground",
  };
  const cls = styles[v] ?? styles.unclear;
  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-wider border font-semibold",
        cls,
      ].join(" ")}
    >
      {verdict || "Unclear"}
    </span>
  );
}
