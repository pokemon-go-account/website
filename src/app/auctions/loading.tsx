import { Trophy } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      
      {/* Catalog Header Skeleton */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-3">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
        <div className="h-4 max-w-md w-full bg-zinc-200 dark:bg-zinc-800/50 rounded animate-pulse" />
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 space-y-6 shadow-xs animate-pulse"
          >
            {/* Top row */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
              </div>
            </div>

            {/* Middle row: Stats circles */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 dark:border-zinc-800/60 text-center">
              <div className="space-y-1 flex flex-col items-center">
                <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800/80 rounded mt-0.5" />
              </div>
              <div className="space-y-1 flex flex-col items-center">
                <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800/80 rounded mt-0.5" />
              </div>
              <div className="space-y-1 flex flex-col items-center">
                <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800/80 rounded mt-0.5" />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
                  <div className="h-4.5 w-12 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-12 bg-zinc-200 dark:bg-zinc-800/50 rounded" />
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                </div>
              </div>
              <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-800/85 rounded-lg flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
