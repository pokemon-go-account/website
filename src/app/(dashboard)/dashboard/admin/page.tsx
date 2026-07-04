import Link from "next/link";
import { Plus, Clock, Trophy, BadgeCheck, XCircle, AlertCircle, Sparkles, UserCheck } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import Auction from "@/models/Auction";
import User from "@/models/User"; // Registers model for populate
import { cn } from "@/lib/utils";

export const revalidate = 0; // Dynamic route rendering

export default async function AdminDashboardOverview() {
  // 1. Session verification & Role checking
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  await connectDB();

  // 2. Fetch all listings submitted by this admin/seller
  const sellerListings = await Listing.find({ sellerId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  // 3. Query all corresponding auctions for these listings
  const listingIds = sellerListings.map((l) => l._id);
  const auctionDocs = await Auction.find({ listingId: { $in: listingIds } })
    .populate("highestBidderId", "name email")
    .lean();

  // Map listingId string to Auction object for O(1) lookups
  const auctionMap = new Map<string, any>();
  for (const auc of auctionDocs) {
    auctionMap.set(auc.listingId.toString(), auc);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor asset authentication workflows, live bidding, and past auction winners.
          </p>
        </div>
        <Link
          href="/dashboard/admin/listings/new"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black px-4 text-xs font-semibold border border-zinc-700/50 gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          New Listing
        </Link>
      </div>

      {/* Listings & Auction Results Table */}
      {sellerListings.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/25 text-center p-8">
          <div className="max-w-xs space-y-2">
            <h3 className="text-sm font-semibold text-foreground">No listings submitted yet</h3>
            <p className="text-xs text-muted-foreground">
              Submit your high-tier Trainer account coordinates to prompt verification moderations.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/20 backdrop-blur-sm shadow-sm">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Asset Coordinate</th>
                <th className="px-6 py-4">Verification Status</th>
                <th className="px-6 py-4">Auction Telemetry</th>
                <th className="px-6 py-4">Auction Winner / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {sellerListings.map((listing) => {
                const auc = auctionMap.get(listing._id.toString());
                const isConcluded = auc && new Date() >= new Date(auc.endTime);

                return (
                  <tr key={listing._id.toString()} className="hover:bg-muted/10 transition-colors">
                    {/* Title & Level */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground text-sm">{listing.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                        <span>Level: {listing.level}</span>
                        <span>•</span>
                        <span>Team: {listing.team}</span>
                        <span>•</span>
                        <span>Shiny: {listing.shinyCount}</span>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="px-6 py-4">
                      {listing.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Pending Review
                        </span>
                      )}
                      {listing.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-semibold border border-red-500/20">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                      {listing.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/20">
                          <BadgeCheck className="h-3 w-3" /> Verified Approved
                        </span>
                      )}
                    </td>

                    {/* Auction Telemetry */}
                    <td className="px-6 py-4">
                      {!auc ? (
                        <span className="text-zinc-500 italic">Not scheduled yet</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">
                            Current Bid: ${auc.currentHighestBid.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-gray-500 dark:text-zinc-400" />
                            {isConcluded ? "Concluded" : auc.status}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Winner / Notes */}
                    <td className="px-6 py-4">
                      {listing.status === "REJECTED" && listing.adminNotes && (
                        <div className="rounded bg-red-500/5 text-red-400 p-2 text-[10px] border border-red-500/10 max-w-xs leading-normal">
                          <strong>Admin Feedback:</strong> {listing.adminNotes}
                        </div>
                      )}

                      {isConcluded && auc && (
                        auc.highestBidderId ? (
                          <div className="rounded bg-emerald-500/5 text-emerald-400 p-2.5 text-[10px] border border-emerald-500/10 max-w-xs space-y-1 leading-normal">
                            <div className="font-bold flex items-center gap-1 uppercase tracking-wider text-[9px] text-emerald-500">
                              <Trophy className="h-3.5 w-3.5 text-gray-950 dark:text-white" /> Winner Announced
                            </div>
                            <div>Name: <span className="font-semibold text-white">{(auc.highestBidderId as any).name}</span></div>
                            <div className="text-[9px] text-muted-foreground">Email: {(auc.highestBidderId as any).email}</div>
                          </div>
                        ) : (
                          <div className="text-zinc-500 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4" /> Ended with no bids
                          </div>
                        )
                      )}

                      {auc && !isConcluded && (
                        <Link
                          href={`/auctions/${auc._id.toString()}`}
                          className="text-primary hover:underline text-[10px] font-semibold"
                        >
                          Join Active Live Room &rarr;
                        </Link>
                      )}

                      {!auc && listing.status === "PENDING" && (
                        <span className="text-[10px] text-zinc-500 leading-normal">
                          Bidding block scheduled instantly upon verification approval.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}