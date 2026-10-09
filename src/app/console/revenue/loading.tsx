export default function RevenueLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-20 font-sans animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-96 max-w-full bg-zinc-100 dark:bg-zinc-850/60 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
      </div>

      {/* 2. KPI Summary Cards Skeleton (6 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-3.5 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="h-7 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-850 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Performance Chart Skeleton */}
      <div className="p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-72 bg-zinc-100 dark:bg-zinc-850 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
        {/* Chart placeholder */}
        <div className="h-56 w-full rounded-xl bg-zinc-100/60 dark:bg-zinc-900/40 flex items-end p-4 gap-3">
          {[40, 65, 30, 80, 55, 90, 70, 45, 85, 60, 75, 95, 50, 65].map((h, idx) => (
            <div
              key={idx}
              className="flex-1 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* 4. Channel Contribution Skeleton (5 cards) */}
      <div className="p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded border-b border-zinc-100 dark:border-zinc-900 pb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-2"
            >
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-2.5 w-20 bg-zinc-100 dark:bg-zinc-850 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Transaction Ledger Skeleton */}
      <div className="p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 w-full rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-850/50 flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="space-y-1">
                  <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-2.5 w-40 bg-zinc-100 dark:bg-zinc-850 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
