import type { FeedItem, PillId } from "@/lib/prep/types";

export function ResearchFeed({
  founder,
  company,
  modeLabel,
  feed,
  onRetry,
}: {
  founder: string;
  company: string;
  modeLabel: string;
  feed: FeedItem[];
  onRetry: (id: string) => void;
}) {
  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {founder && (
            <span className="text-foreground font-semibold">{founder}</span>
          )}
          {founder && company && <span className="text-muted-foreground">·</span>}
          {company && (
            <span className="text-foreground font-semibold">{company}</span>
          )}
          <span className="ml-auto text-xs uppercase tracking-wider text-[oklch(0.85_0.14_220)]">
            {modeLabel}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-2 md:p-3">
        <ul className="divide-y divide-border">
          {feed.map((item) => (
            <FeedRow key={item.id} item={item} onRetry={onRetry} />
          ))}
          {feed.length === 0 && (
            <li className="p-6 text-sm text-muted-foreground">
              Preparing queries…
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function FeedRow({
  item,
  onRetry,
}: {
  item: FeedItem;
  onRetry: (id: string) => void;
}) {
  return (
    <li className="p-4 flex items-start gap-3">
      <Dot status={item.status} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground break-words">{item.query}</p>
        <p className="text-xs mt-1">
          {item.status === "pending" && (
            <span className="text-muted-foreground">Queued</span>
          )}
          {item.status === "searching" && (
            <span className="text-[oklch(0.85_0.14_220)]">Searching…</span>
          )}
          {item.status === "done" && (
            <span className="text-muted-foreground">
              Found {item.resultCount ?? 0} sources
            </span>
          )}
          {item.status === "failed" && (
            <span className="text-[oklch(0.7_0.2_22)]">
              Failed{item.error ? ` · ${item.error.slice(0, 80)}` : ""}
            </span>
          )}
        </p>
      </div>
      {item.status === "failed" && (
        <button
          onClick={() => onRetry(item.id)}
          className="text-xs px-2.5 py-1 rounded border border-border text-foreground hover:bg-secondary"
        >
          Retry
        </button>
      )}
    </li>
  );
}

function Dot({ status }: { status: FeedItem["status"] }) {
  if (status === "searching")
    return (
      <span className="mt-1.5 inline-block w-2.5 h-2.5 rounded-full bg-[oklch(0.85_0.14_220)] prep-pulse shrink-0" />
    );
  if (status === "done")
    return (
      <span className="mt-1.5 inline-block w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
    );
  if (status === "failed")
    return (
      <span className="mt-1.5 inline-block w-2.5 h-2.5 rounded-full bg-[oklch(0.62_0.22_22)] shrink-0" />
    );
  return (
    <span className="mt-1.5 inline-block w-2.5 h-2.5 rounded-full border border-border shrink-0" />
  );
}

export const _pill: PillId = "founder"; // keep type import alive
