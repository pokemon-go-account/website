export default function OrdersPageLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070709] py-8 sm:py-12 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5 space-y-2">
          <div className="h-7 w-60 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-96 max-w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>

        {/* Order Cards Skeleton */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111114] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-900 rounded" />
                </div>
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
