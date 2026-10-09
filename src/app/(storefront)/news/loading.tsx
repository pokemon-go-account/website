export default function NewsPageLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070709] py-8 md:py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Article Skeleton */}
        <div className="h-64 sm:h-80 w-full rounded-3xl bg-zinc-200 dark:bg-[#12111a] p-8 flex flex-col justify-end gap-3">
          <div className="h-4 w-32 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-2/3 max-w-full bg-zinc-300 dark:bg-zinc-700 rounded-md" />
          <div className="h-4 w-1/2 max-w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          ))}
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111114] overflow-hidden space-y-3 p-4"
            >
              <div className="h-48 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
