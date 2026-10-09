export default function ConsoleRootLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      {/* Page Header Skeleton */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-4 w-80 max-w-full bg-zinc-100 dark:bg-zinc-900 rounded-md mt-2" />
      </div>

      {/* KPI Cards Strip Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] space-y-2"
          >
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Card / Table Skeleton */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
