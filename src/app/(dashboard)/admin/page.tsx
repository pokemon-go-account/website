import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { ApproveButton, RejectButton } from "./components/action-buttons";
import { Users, Hourglass, ShieldAlert, Coins } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function AdminDashboardPage() {
  // 1. Session verification & Role guard protection
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  await connectDB();

  // 2. Fetch metrics and pending listings concurrently for optimized performance
  const [totalUsers, pendingCount, pendingListings] = await Promise.all([
    User.countDocuments().lean(),
    Listing.countDocuments({ status: "PENDING" }).lean(),
    Listing.find({ status: "PENDING" })
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Cast listings to handle populated seller properties type-safely
  const listings = pendingListings as Array<
    any & {
      sellerId: {
        _id: string;
        name: string;
        email: string;
      };
    }
  >;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
          Admin Control Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, approve, and moderate scheduled live auction blocks.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Total Users
            </span>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-muted">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{totalUsers}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Registered bidder profiles</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Pending Moderation
            </span>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
              <Hourglass className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{pendingCount}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Listings awaiting validation</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Security Gate
            </span>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Active</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Defense-in-depth enabled</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Nominal Bid Fee
            </span>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-muted">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">₹199</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Deposit for event scheduling</p>
          </div>
        </div>
      </div>

      {/* Moderation Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Pending Approval Queue</h2>

        {listings.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/20 text-center p-6">
            <div className="max-w-xs space-y-2">
              <h3 className="text-sm font-medium text-foreground">Moderation queue empty</h3>
              <p className="text-xs text-muted-foreground">All seller applications have been reviewed. No actions required.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card/20 backdrop-blur-sm">
            <table className="min-w-full divide-y divide-border text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Asset Title</th>
                  <th className="px-6 py-4">Seller Info</th>
                  <th className="px-6 py-4">Metrics (LVL/Shiny/Leg/Myth)</th>
                  <th className="px-6 py-4">Pricing Parameters</th>
                  <th className="px-6 py-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {listings.map((listing) => (
                  <tr key={listing._id.toString()} className="hover:bg-muted/10 transition-colors">
                    {/* Title & Region */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-foreground truncate">{listing.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        Region: {listing.region}
                      </div>
                    </td>

                    {/* Seller parameters */}
                    <td className="px-6 py-4">
                      <div className="font-medium">{listing.sellerId?.name || "Unknown Seller"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {listing.sellerId?.email || "No email available"}
                      </div>
                    </td>

                    {/* Stats details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 dark:bg-muted px-2 py-0.5 rounded text-primary dark:text-neutral-300 font-bold">
                          Lvl {listing.level}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Team: {listing.team}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Shiny: {listing.shinyCount} | Leg: {listing.legendaryCount} | Myth: {listing.mythicalCount}
                      </div>
                    </td>

                    {/* Price structure */}
                    <td className="px-6 py-4">
                      <div className="font-medium">Start: ₹{listing.startingBid}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Reserve: ₹{listing.reservePrice} | Min Inc: ₹{listing.minIncrement}
                      </div>
                    </td>

                    {/* Approve & Reject Button triggers */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <ApproveButton listingId={listing._id.toString()} />
                        <RejectButton listingId={listing._id.toString()} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
