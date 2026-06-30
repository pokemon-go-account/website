import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

export default function SellerDashboardOverview() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Seller Dashboard</h1>
          <p className="text-xs text-muted-foreground">Monitor asset authentication workflows and scheduled event blocks.</p>
        </div>
        <Link href="/dashboard/seller/listings/new" className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-xs font-medium text-black transition-colors hover:bg-neutral-200 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Listing
        </Link>
      </div>

      {/* Empty State Layout */}
      <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-neutral-900/10 text-center p-6">
        <div className="max-w-xs space-y-2">
          <h3 className="text-sm font-medium text-foreground">No active listings discovered</h3>
          <p className="text-xs text-muted-foreground">Submit an encryption verification file profile parameters to prompt an administrative scheduler block review loop.</p>
        </div>
      </div>
    </div>
  );
}