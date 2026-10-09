export default function StoreCatalogLoading() {
  return (
    <div className="min-h-screen bg-black dark:bg-[#09090B] py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Category Pills Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 w-28 bg-zinc-800 rounded-full shrink-0" />
        ))}
      </div>

      {/* Catalog Search & Filter Strip */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-64 max-w-full bg-zinc-800 rounded-xl" />
        <div className="h-10 w-36 bg-zinc-800 rounded-xl" />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 space-y-3"
          >
            <div className="h-44 w-full rounded-xl bg-zinc-800/70" />
            <div className="h-4 w-3/4 bg-zinc-800 rounded" />
            <div className="h-3 w-1/2 bg-zinc-800/60 rounded" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-20 bg-zinc-800 rounded" />
              <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
