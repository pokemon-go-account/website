import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing"; // ensure model is registered
import { ShoppingBag, Trophy, ArrowRight, ShieldCheck, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { PriceDisplay } from "@/components/price-display";

export const revalidate = 0; // Dynamic route

export default async function UserOrdersPage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect("/login");
  }

  await connectDB();

  // Fetch standard storefront and buy-now orders
  const ordersDocs = await Order.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  // Fetch completed auctions won by this user
  const wonAuctionsDocs = await Auction.find({
    highestBidderId: session.user.id,
    status: "COMPLETED",
  })
    .populate("listingId", "title stardust team shinyCount")
    .sort({ endTime: -1 })
    .lean();

  // Serialize and combine
  const directOrders = ordersDocs.map((o: any) => ({
    id: o._id.toString(),
    orderType: o.orderType, // "STOREFRONT" | "BUY_NOW"
    date: o.createdAt,
    price: o.totalPrice,
    status: o.status, // "PENDING" | "COMPLETED" | "FAILED"
    items: o.items.map((i: any) => `${i.name} (x${i.quantity})`),
    link: o.orderType === "BUY_NOW" && o.auctionId ? `/auctions/${o.auctionId.toString()}` : null,
  }));

  const wonAuctions = wonAuctionsDocs.map((a: any) => ({
    id: a._id.toString(),
    orderType: "AUCTION",
    date: a.endTime || a.updatedAt,
    price: a.currentHighestBid,
    status: "COMPLETED",
    items: [a.listingId?.title || "Pokémon GO Account Win"],
    link: `/auctions/${a._id.toString()}`,
  }));

  const allPurchases = [...directOrders, ...wonAuctions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 min-h-screen text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.05] pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
          My Order History
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Track details of your direct storefront services and successfully won live auctions.
        </p>
      </div>

      {/* Purchases Grid */}
      {allPurchases.length === 0 ? (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-950/10 text-center p-8">
          <ShoppingBag className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No orders recorded yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1.5 leading-normal">
            Browse our direct services in the store or register to bid in live account auctions to get started.
          </p>
          <div className="flex items-center gap-3 pt-5">
            <Link
              href="/store"
              className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              Go to Storefront
            </Link>
            <Link
              href="/auctions"
              className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-150 dark:hover:bg-white/5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Browse Auctions
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {allPurchases.map((purchase) => {
            const formattedDate = new Date(purchase.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={purchase.id}
                className="rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-white/[0.04] dark:bg-[#0d0d12]/40 dark:hover:border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 transition-all duration-300 shadow-xs"
              >
                <div className="space-y-2 flex-1">
                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        purchase.orderType === "AUCTION"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          : purchase.orderType === "BUY_NOW"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                      }`}
                    >
                      {purchase.orderType === "STOREFRONT" ? "STORE" : purchase.orderType}
                    </span>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-white/[0.03] px-2 py-0.5 rounded select-all border border-zinc-200 dark:border-white/[0.04]">
                      ID: {purchase.id}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-800">•</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      Order Placed: {formattedDate}
                    </span>
                  </div>

                  {/* Item List */}
                  <div className="space-y-1">
                    {purchase.items.map((item: string, idx: number) => (
                      <h4
                        key={idx}
                        className="text-sm font-bold text-zinc-900 dark:text-white leading-snug tracking-tight"
                      >
                        {item}
                      </h4>
                    ))}
                  </div>

                  {/* Detail Redirect Link */}
                  {purchase.link && (
                    <Link
                      href={purchase.link}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline pt-1"
                    >
                      Join Live Auction Room <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {/* Right Column: Price & Status */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-zinc-100 dark:border-white/[0.04] pt-3 sm:pt-0 shrink-0">
                  <div className="sm:text-right">
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none block">Total Paid</span>
                    <span className="text-zinc-900 dark:text-white font-black text-sm block mt-0.5">
                      <PriceDisplay amountInUSD={purchase.price} />
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider shadow-xs ${
                      purchase.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : purchase.status === "FAILED"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {purchase.status === "COMPLETED" && (
                      <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {purchase.status === "PENDING" && (
                      <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    )}
                    {purchase.status === "FAILED" && (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    {purchase.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
