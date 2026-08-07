export function PageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col p-5" aria-busy="true" aria-label="Đang tải trang">
      <div className="h-7 w-48 animate-pulse rounded bg-muted-bg" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted-bg" />
      <div className="mt-5 flex-1 overflow-hidden rounded-lg border border-border bg-white">
        <div className="border-b border-border bg-surface px-3 py-2">
          <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-16 animate-pulse rounded bg-muted-bg" />
            ))}
          </div>
        </div>
        <div className="space-y-3 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-24 animate-pulse rounded bg-muted-bg" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted-bg" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted-bg" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted-bg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
