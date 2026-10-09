export default function RecoveryLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070709] py-8 sm:py-12 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-8 w-72 bg-zinc-200 dark:bg-zinc-800 rounded-md mx-auto" />
          <div className="h-4 w-96 max-w-full bg-zinc-100 dark:bg-zinc-900 rounded mx-auto" />
        </div>

        {/* Recovery Service Card Skeleton */}
        <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111114] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-28 w-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            <div className="space-y-2 flex-1 w-full">
              <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
              <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
            <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
