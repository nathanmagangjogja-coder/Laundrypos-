import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`h-1.5 rounded-full bg-muted animate-pulse ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">

      {/* Greeting Hero Skeleton */}
      <div className="relative overflow-hidden rounded-2xl p-6 border bg-muted/20 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <Card key={i} className="border-0 shadow-sm overflow-hidden animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-[3px] w-full bg-muted" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
              </div>
              <Skeleton className="h-1 w-full mt-4 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Skeleton className="h-48 w-48 rounded-full" />
            <div className="w-full space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border p-3.5 animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}