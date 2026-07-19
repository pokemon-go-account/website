import { getAllAdmins, getPendingAuctionListings, getTotalRevenueConsole } from "@/features/console/actions";
import { AlertTriangle, ArrowRight, Mail, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function ConsolePage() {
  const [adminsRes, listingsRes, revenueRes] = await Promise.all([
    getAllAdmins(),
    getPendingAuctionListings(),
    getTotalRevenueConsole(),
  ]);

  const admins = adminsRes.admins || [];
  const listings = listingsRes.listings || [];
  const totalRevenue = revenueRes.totalRevenue || 0;
  const completedOrdersCount = revenueRes.completedOrdersCount || 0;

  const expiredAdmins = admins.filter(
    (a: any) => !a.adminRentPaidUntil || new Date(a.adminRentPaidUntil) < new Date()
  );

  const formattedRevenue = `$${totalRevenue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Platform status, total revenue, pending approvals, and admin access management.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-zinc-200 dark:bg-white/[0.06] rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.06]">
        {[
          { label: "Total Revenue", value: formattedRevenue, href: "/console/orders", highlight: true, subtext: `${completedOrdersCount} orders` },
          { label: "Live Analytics", value: "Real-time", href: "/console/analytics" },
          { label: "Admins", value: admins.length, href: "/console/users" },
          { label: "Overdue Rent", value: expiredAdmins.length, href: "/console/rent", danger: expiredAdmins.length > 0 },
          { label: "Pending Listings", value: listings.length, href: "/console/auctions", warn: listings.length > 0 },
        ].map(({ label, value, href, danger, warn, highlight, subtext }) => (
          <Link
            key={label}
            href={href}
            className="bg-white dark:bg-[#111111] px-4 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors group"
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              {highlight && <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />}
              {label}
            </p>
            <p className={
              highlight
                ? "text-xl sm:text-2xl font-black text-emerald-500 mt-1 tracking-tight"
                : danger && value > 0
                ? "text-2xl font-semibold text-red-500 mt-1"
                : warn && value > 0
                ? "text-2xl font-semibold text-amber-500 mt-1"
                : "text-2xl font-semibold text-zinc-900 dark:text-white mt-1"
            }>
              {value}
            </p>
            {subtext && (
              <p className="text-[10px] font-semibold text-emerald-500/80 mt-0.5">{subtext}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Overdue rent alert */}
      {expiredAdmins.length > 0 && (
        <div className="flex items-start gap-3 border-l-2 border-red-500 bg-red-50 dark:bg-red-500/[0.04] rounded-r-md px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-px" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {expiredAdmins.length} admin{expiredAdmins.length > 1 ? "s" : ""} with overdue rent
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Admin access will remain active until manually revoked.{" "}
              <Link href="/console/rent" className="text-red-600 dark:text-red-400 underline underline-offset-2 hover:no-underline">
                Go to Rent Manager →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Admin directory */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Administrators</p>
                <p className="text-xs text-zinc-500 mt-0.5">Active operator accounts</p>
              </div>
              <Link
                href="/console/users"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
                <p className="text-sm">No administrators promoted yet</p>
                <Link href="/console/users" className="text-xs mt-2 underline underline-offset-2 hover:no-underline">
                  Promote a user
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">User</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Contact</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Paid Until</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                    {admins.slice(0, 6).map((admin: any) => {
                      const isExpired = !admin.adminRentPaidUntil || new Date(admin.adminRentPaidUntil) < new Date();
                      return (
                        <tr key={admin._id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{admin.name ?? "Administrator"}</p>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">@{admin.username}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[140px]">{admin.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                              {admin.adminRentPaidUntil
                                ? new Date(admin.adminRentPaidUntil).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric", year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                              isExpired
                                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                            }`}>
                              {isExpired ? "Overdue" : "Active"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {admins.length > 6 && (
                  <div className="px-4 py-3 border-t border-zinc-100 dark:border-white/[0.04]">
                    <Link href="/console/rent" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      View all {admins.length} admins in Rent Manager →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pending listings queue */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Audit Queue</p>
                <p className="text-xs text-zinc-500 mt-0.5">Listings awaiting approval</p>
              </div>
              <Link
                href="/console/auctions"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Review all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-zinc-400 dark:text-zinc-500">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-3" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Queue is clear</p>
                <p className="text-xs mt-1">No listings pending review</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {listings.slice(0, 5).map((listing: any) => (
                  <div key={listing._id} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                          @{listing.sellerId?.username ?? "unknown"} · Lv {listing.level} · ${listing.startingBid}
                        </p>
                      </div>
                      <Link
                        href="/console/auctions"
                        className="shrink-0 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2 hover:no-underline transition-colors mt-0.5"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
                {listings.length > 5 && (
                  <div className="px-4 py-3">
                    <Link href="/console/auctions" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      +{listings.length - 5} more pending listings →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
