import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-transparent py-6 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Skeleton */}
        <div className="flex gap-2 items-center">
          <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
          <div className="text-zinc-400 text-[10px]">&gt;</div>
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
          <div className="text-zinc-400 text-[10px]">&gt;</div>
          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
        </div>

        {/* Real-time sync banner skeleton */}
        <div className="h-11 w-full bg-zinc-200 dark:bg-zinc-800/60 rounded-xl animate-pulse" />

        {/* Mobile Header Card Skeleton */}
        <div className="lg:hidden h-28 w-full bg-zinc-200 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (Gallery & Details) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery Skeleton */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 p-6 space-y-4 shadow-xs">
              <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900/60 rounded-xl animate-pulse flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#6133e1] dark:text-purple-400" />
              </div>
              <div className="flex gap-2">
                <div className="h-12 w-16 bg-zinc-200 dark:bg-zinc-800/60 rounded-md animate-pulse" />
                <div className="h-12 w-16 bg-zinc-200 dark:bg-zinc-800/60 rounded-md animate-pulse" />
                <div className="h-12 w-16 bg-zinc-200 dark:bg-zinc-800/60 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Spec Sheet skeleton */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 p-6 space-y-4 shadow-xs">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar console) */}
          <div className="space-y-6">
            {/* Bidding Panel skeleton */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 p-6 space-y-6 shadow-xs">
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse mx-auto" />
              <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse mx-auto" />
              <div className="h-11 w-full bg-zinc-200 dark:bg-zinc-800/80 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl animate-pulse" />
              </div>
            </div>

            {/* Ledger skeleton */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 p-6 space-y-4 shadow-xs">
              <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
                <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
                <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
