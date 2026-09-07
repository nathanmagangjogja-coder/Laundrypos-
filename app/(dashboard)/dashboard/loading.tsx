export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-muted" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="h-[400px] w-full animate-pulse rounded-xl bg-muted lg:col-span-4" />
        <div className="h-[400px] w-full animate-pulse rounded-xl bg-muted lg:col-span-3" />
      </div>
    </div>
  );
}
