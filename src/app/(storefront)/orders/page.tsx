import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing";
import Feedback from "@/models/Feedback";
import { ShoppingBag, Trophy, ArrowRight, ShieldCheck, Clock, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PriceDisplay } from "@/components/price-display";
import { OrderReviewSection } from "./order-review-section";
import { CancelOrderButton } from "./cancel-order-button";
import { ResendMessageButton } from "./resend-message-button";

export const revalidate = 0;

export default async function UserOrdersPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect("/login");
  }

  await connectDB();

  const ordersDocs = await Order.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const wonAuctionsDocs = await Auction.find({
    highestBidderId: session.user.id,
    status: "COMPLETED",
  })
    .populate("listingId", "title stardust team shinyCount")
    .sort({ endTime: -1 })
    .lean();

  const reviewsDocs = await Feedback.find({ userId: session.user.id }).lean();

  const directOrders = ordersDocs.map((o: any) => ({
    id: o._id.toString(),
    orderType: o.orderType,
    date: o.createdAt,
    price: o.totalPrice,
    status: o.status,
    items: o.items.map((i: any) => `${i.name} (x${i.quantity})`),
    link: o.orderType === "BUY_NOW" && o.auctionId ? `/auctions/${o.auctionId.toString()}` : null,
    walletDiscountApplied: o.walletDiscountApplied || 0,
    deliveryStatus: o.deliveryStatus || null,
    auctionId: o.auctionId?.toString() || null,
  }));

  const wonAuctions = wonAuctionsDocs
    // Only show auctions that don't already have an AUCTION order (to avoid duplicates)
    .filter((a: any) => !directOrders.some((o) => o.auctionId === a._id.toString() && o.orderType === "AUCTION"))
    .map((a: any) => ({
      id: a._id.toString(),
      orderType: "AUCTION" as const,
      date: a.endTime || a.updatedAt,
      price: a.currentHighestBid,
      status: "PENDING" as const,
      items: [a.listingId?.title || "Pokémon GO Account Win"],
      link: `/auctions/${a._id.toString()}`,
      walletDiscountApplied: 0,
      deliveryStatus: null,
      auctionId: a._id.toString(),
    }));

  const allPurchases = [...directOrders, ...wonAuctions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const completedCount = allPurchases.filter((p) => p.status === "COMPLETED").length;
  const pendingCount = allPurchases.filter((p) => p.status === "PENDING").length;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Order History
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track your storefront purchases and won auction accounts.
          </p>
        </div>

        {/* KPI strip */}
        {allPurchases.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-white/[0.06] rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.06]">
            {[
              { label: "Total Orders", value: allPurchases.length },
              { label: "Completed", value: completedCount },
              { label: "Pending", value: pendingCount, warn: pendingCount > 0 },
            ].map(({ label, value, warn }) => (
              <div key={label} className="bg-white dark:bg-[#111111] px-5 py-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                <p className={`text-2xl font-semibold mt-1 ${warn && value > 0 ? "text-amber-500" : "text-zinc-900 dark:text-white"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {allPurchases.length === 0 ? (
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-lg">
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
                <ShoppingBag className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">No orders yet</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Browse our store or register for a live auction to place your first order.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <Link
                  href="/store"
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Go to Storefront
                </Link>
                <Link
                  href="/auctions"
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md border border-zinc-200 dark:border-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Browse Auctions
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {allPurchases.map((purchase) => {
              const formattedDate = new Date(purchase.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const typeConfig = (({
                AUCTION: { label: "Auction Win", className: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400" },
                BUY_NOW: { label: "Buy Now", className: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
                STOREFRONT: { label: "Store", className: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400" },
              } as Record<string, { label: string; className: string }>)[purchase.orderType]) ?? { label: purchase.orderType, className: "bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400" };

              const statusConfig = (({
                COMPLETED: {
                  label: "Completed",
                  icon: ShieldCheck,
                  className: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400",
                },
                PENDING: {
                  label: "Pending",
                  icon: Clock,
                  className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
                },
                FAILED: {
                  label: "Failed",
                  icon: XCircle,
                  className: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
                },
              } as Record<string, { label: string; icon: any; className: string }>)[purchase.status]) ?? { label: purchase.status, icon: Clock, className: "bg-zinc-100 dark:bg-white/[0.04] text-zinc-500" };

              const StatusIcon = statusConfig.icon;

              const existingReview = (() => {
                const rev = reviewsDocs.find((r: any) => r.orderId?.toString() === purchase.id);
                return rev ? { id: rev._id.toString(), rating: rev.rating, comment: rev.comment } : null;
              })();

              return (
                <div
                  key={purchase.id}
                  className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-hidden"
                >
                  {/* Order header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-zinc-100 dark:border-white/[0.04]">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type badge */}
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${typeConfig.className}`}>
                        {purchase.orderType === "AUCTION" && <Trophy className="h-3 w-3 mr-1" />}
                        {typeConfig.label}
                      </span>
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusConfig.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                      {/* Date */}
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{formattedDate}</span>
                    </div>

                    {/* Right: Price + Cancel + Resend */}
                    <div className="flex items-center gap-2 shrink-0">
                      {purchase.status === "PENDING" && purchase.orderType !== "AUCTION" && (
                        <>
                          <ResendMessageButton
                            orderId={purchase.id}
                            orderType={purchase.orderType}
                            items={purchase.items}
                            price={purchase.price}
                            walletDiscountApplied={purchase.walletDiscountApplied}
                          />
                          <CancelOrderButton orderId={purchase.id} />
                        </>
                      )}
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none mb-0.5">Total</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          <PriceDisplay amountInUSD={purchase.price} />
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order body */}
                  <div className="px-5 py-4 space-y-2">
                    {purchase.items.map((item: string, idx: number) => (
                      <p key={idx} className="text-sm font-medium text-zinc-900 dark:text-white leading-snug">
                        {item}
                      </p>
                    ))}

                    <div className="flex items-center gap-4 pt-1">
                      {/* Order ID */}
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                        ID: {purchase.id}
                      </p>

                      {/* Link to auction */}
                      {purchase.link && (
                        <Link
                          href={purchase.link}
                          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Auction
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Review section — gated by delivery for AUCTION orders */}
                  {purchase.status === "COMPLETED" && (
                    purchase.orderType === "AUCTION"
                      ? purchase.deliveryStatus === "DELIVERED" && (
                          <div className="px-5 pb-5">
                            <OrderReviewSection
                              orderId={purchase.id}
                              initialReview={existingReview}
                            />
                          </div>
                        )
                      : (
                          <div className="px-5 pb-5">
                            <OrderReviewSection
                              orderId={purchase.id}
                              initialReview={existingReview}
                            />
                          </div>
                        )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
          <Link href="/store" className="hover:text-zinc-900 dark:hover:text-white transition-colors inline-flex items-center gap-1">
            Store <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/auctions" className="hover:text-zinc-900 dark:hover:text-white transition-colors inline-flex items-center gap-1">
            Auctions <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
