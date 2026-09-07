export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>

      <div className="rounded-xl border bg-card p-1">
        <div className="h-12 w-full animate-pulse rounded-t-lg bg-muted border-b" />
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
