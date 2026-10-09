export default function StorefrontRootLoading() {
  return (
    <div className="min-h-screen bg-transparent py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="h-44 sm:h-56 w-full rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/50 p-6 flex flex-col justify-end gap-3">
        <div className="h-8 w-64 max-w-full bg-zinc-300 dark:bg-zinc-700 rounded-md" />
        <div className="h-4 w-96 max-w-full bg-zinc-200 dark:bg-zinc-800 rounded-md" />
      </div>

      {/* Grid of Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0c0c0e] p-4 space-y-3"
          >
            <div className="h-40 w-full rounded-xl bg-zinc-200/70 dark:bg-zinc-800/60" />
            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
