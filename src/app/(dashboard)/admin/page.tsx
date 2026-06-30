import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Auction from "@/models/Auction";
import WebhookLog from "@/models/WebhookLog";
import { AdminControlCenter } from "./components/admin-control-center";
import { Users, Hourglass, ShieldAlert, Coins } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function AdminDashboardPage() {
  // 1. Session verification & Role guard protection
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  await connectDB();

  // 2. Query all database collections concurrently
  const [
    totalUsers,
    pendingCount,
    pendingListings,
    escrowListings,
    activeAuctions,
    concludedAuctions,
    webhookLogs
  ] = await Promise.all([
    User.countDocuments().lean(),
    Listing.countDocuments({ status: "PENDING" }).lean(),
    Listing.find({ status: "PENDING" })
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .lean(),
    Listing.find({ status: "APPROVED" })
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .lean(),
    Auction.find({ status: { $in: ["LIVE", "PAUSED", "SCHEDULED"] } })
      .populate("listingId")
      .sort({ startTime: -1 })
      .lean(),
    Auction.find({ $or: [{ status: "COMPLETED" }, { endTime: { $lte: new Date() } }] })
      .populate("listingId")
      .populate("highestBidderId", "name email isSuspended")
      .sort({ endTime: -1 })
      .lean(),
    WebhookLog.find().sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  // Map mongo ids and date objects to plain JSON for client component safety
  const serialize = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
          Admin Control Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete operational management of active auctions, escrow pipelines, and webhook logs.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Pending Review
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

      {/* Interactive Tabs Control Panel */}
      <AdminControlCenter
        initialLogs={serialize(webhookLogs)}
        initialActiveAuctions={serialize(activeAuctions)}
        initialConcludedAuctions={serialize(concludedAuctions)}
        initialPendingListings={serialize(pendingListings)}
        initialEscrowListings={serialize(escrowListings)}
        totalUsers={totalUsers}
        pendingCount={pendingCount}
      />
    </div>
  );
}
