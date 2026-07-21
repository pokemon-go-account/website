"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Trophy,
  CreditCard,
  Check,
  Loader2,
} from "lucide-react";
import { PriceDisplay } from "@/components/price-display";
import { RegisterAuctionButton } from "@/features/payments/components/register-button";
import type { BidHistoryItem } from "@/hooks/use-socket";

interface LiveRoomBiddingPanelProps {
  // Auction data
  auctionId: string;
  minIncrement: number;
  viewers?: number;
  // Realtime state
  timeLeft: string;
  activeBid: number;
  highestBidderId: string;
  highestBidderName: string | null;
  bidHistory: BidHistoryItem[];
  isConnected: boolean;
  priceFlash: "up" | "down" | null;
  isConcluded: boolean;
  isRegistered: boolean;
  isOwner: boolean;
  isAuctionPaid: boolean;
  isBidding: boolean;
  isMuted: boolean;
  error: string | null;
  sessionUserId?: string;
  // Computed
  nextMinBid: number;
  buyNowPrice: number;
  isBuyNowDisabled: boolean;
  sessionStatus: string;
  // Callbacks
  onPlaceBid: (amount: number) => void;
  onToggleMute: () => void;
  onBuyNowClick: () => void;
  onOpenWinnerPayment: () => void;
  onSetIsRegistered: (v: boolean) => void;
}

export function LiveRoomBiddingPanel({
  auctionId,
  minIncrement,
  viewers,
  timeLeft,
  activeBid,
  highestBidderId,
  highestBidderName,
  bidHistory,
  isConnected,
  priceFlash,
  isConcluded,
  isRegistered,
  isOwner,
  isAuctionPaid,
  isBidding,
  isMuted,
  error,
  sessionUserId,
  nextMinBid,
  buyNowPrice,
  isBuyNowDisabled,
  sessionStatus,
  onPlaceBid,
  onToggleMute,
  onBuyNowClick,
  onOpenWinnerPayment,
  onSetIsRegistered,
}: LiveRoomBiddingPanelProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] backdrop-blur-md p-6 space-y-5 shadow-xs dark:shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-[#6133e1]/10 blur-xl pointer-events-none" />

      {/* Stock market glows */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent transition-opacity duration-1000 pointer-events-none",
        priceFlash === "up" ? "opacity-100" : "opacity-0"
      )} />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent transition-opacity duration-1000 pointer-events-none",
        priceFlash === "down" ? "opacity-100" : "opacity-0"
      )} />

      {/* Countdown Ends In */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] text-zinc-805 dark:text-zinc-200 font-extrabold uppercase tracking-wider">
            Live Room
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider bg-zinc-105 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            {viewers || 1} Views
          </span>
          <span className="text-[9px] text-red-500 dark:text-red-400 font-extrabold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-200 dark:border-red-500/20 animate-pulse">
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Bid Values */}
      <div className="space-y-1 text-center relative z-10">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">
          {highestBidderId ? "Current Bid" : "Starting Bid"}
        </span>
        <motion.h3
          key={activeBid}
          initial={{ scale: 0.95 }}
          animate={{ scale: priceFlash ? [0.95, 1.05, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "text-4xl font-black tracking-tight transition-colors duration-300",
            priceFlash === "up" ? "text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
              priceFlash === "down" ? "text-red-500 dark:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" :
                "text-zinc-900 dark:text-white"
          )}
        >
          <PriceDisplay amountInUSD={activeBid} />
        </motion.h3>

        {highestBidderId === sessionUserId ? (
          <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 mt-1 uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> You are highest bidder
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[9px] text-zinc-600 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700 mt-1 uppercase tracking-wider">
            Outbid / No active bids
          </div>
        )}
      </div>

      {/* Counters Info */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-200 dark:border-zinc-800/80 text-center text-xs relative z-10 items-center">
        <div>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Total Bids</span>
          <div className="font-bold text-zinc-800 dark:text-white mt-0.5">{bidHistory.length}</div>
        </div>
        <div className="border-x border-zinc-200 dark:border-zinc-850">
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Views</span>
          <div className="font-bold text-zinc-800 dark:text-white mt-0.5">{viewers || 1}</div>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleMute}
            className="h-7 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95 bg-transparent"
          >
            {isMuted ? "🔇 Muted" : "🔊 Sound"}
          </button>
        </div>
      </div>

      {/* Bidding Controls Form */}
      <div className="space-y-3 relative z-10">
        {error && (
          <div className="flex items-start gap-1.5 rounded bg-red-500/10 p-2.5 text-[10px] text-red-500 dark:text-red-400 border border-red-500/20 leading-relaxed">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isConcluded ? (
          highestBidderName ? (
            highestBidderId === sessionUserId ? (
              isAuctionPaid ? (
                /* ====== WINNER PAID STATE ====== */
                <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 text-center space-y-3">
                  <Trophy className="h-8 w-8 text-emerald-500 mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">🎉 Payment Confirmed!</h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-light leading-snug">
                      Your payment has been successfully confirmed. You will receive the account details soon!
                    </p>
                  </div>
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                    Payment Confirmed
                  </button>
                </div>
              ) : (
                /* ====== THIS USER IS THE WINNER ====== */
                <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-emerald-500/5 p-4 text-center space-y-3">
                  <Trophy className="h-8 w-8 text-[#6133e1] mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">🎉 You Won!</h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-light leading-snug">
                      Congratulations! You won with a bid of <strong className="font-bold text-zinc-900 dark:text-white"><PriceDisplay amountInUSD={activeBid} /></strong>. Complete your payment to receive the account.
                    </p>
                  </div>
                  <button
                    onClick={onOpenWinnerPayment}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition bg-[#6133e1] hover:bg-violet-600 text-white cursor-pointer active:scale-[0.98] shadow-lg"
                  >
                    <CreditCard className="h-4 w-4" />
                    Complete Payment — <PriceDisplay amountInUSD={activeBid} />
                  </button>
                </div>
              )
            ) : (
              /* ====== VIEWER SEES WINNER ANNOUNCEMENT ====== */
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center space-y-3">
                <Trophy className="h-8 w-8 text-[#6133e1] mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Winner Announced!</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-light leading-snug">
                    Congratulations to <strong className="font-bold text-zinc-900 dark:text-white">{highestBidderName}</strong> for winning this auction with a final bid of <strong className="font-bold text-zinc-900 dark:text-white"><PriceDisplay amountInUSD={activeBid} /></strong>!
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center space-y-2">
              <AlertCircle className="h-6 w-6 text-zinc-550 mx-auto" />
              <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Concluded</h4>
              <p className="text-[11px] text-zinc-500">This auction expired with no bids.</p>
            </div>
          )
        ) : isOwner ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-zinc-555 mx-auto" />
            <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Owner Console</h4>
            <p className="text-[11px] text-zinc-500">You are the seller of this listing. Self-bidding is disabled.</p>
          </div>
        ) : !isRegistered ? (
          <div className="space-y-3">
            <div className="rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-light">
              A refundable verification deposit of <PriceDisplay amountInUSD={2.50} /> is required to participate in bidding.
            </div>
            <RegisterAuctionButton auctionId={auctionId} onSuccess={() => onSetIsRegistered(true)} />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
              This verification deposit is completely refundable. It will automatically act as store credit and be deducted from the total amount of any future purchase you make from our store, including products and services.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-center font-bold font-mono">
              Minimum Next Bid: <span className="text-zinc-800 dark:text-white"><PriceDisplay amountInUSD={nextMinBid} /></span>
            </div>
            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[nextMinBid, nextMinBid + minIncrement, nextMinBid + 2 * minIncrement].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => onPlaceBid(amount)}
                  disabled={!isConnected || isBidding || highestBidderId === sessionUserId}
                  className="h-11 rounded-xl bg-zinc-55 dark:bg-zinc-900 hover:bg-[#6133e1] hover:text-white text-zinc-800 dark:text-white text-xs font-bold border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50 flex items-center justify-center"
                >
                  {isBidding ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#6133e1] dark:text-white" />
                  ) : (
                    <>+<PriceDisplay amountInUSD={amount - activeBid} /></>
                  )}
                </button>
              ))}
            </div>

            {/* Live Bid Ticker inside Bidding Panel */}
            {bidHistory.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold block">Live Bid Stream</span>
                <div className="space-y-1.5 max-h-[120px] overflow-hidden">
                  <AnimatePresence initial={false}>
                    {bidHistory.slice(0, 3).map((bid, idx) => (
                      <motion.div
                        key={bid._id}
                        initial={{ opacity: 0, x: -10, y: -10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl border text-[11px] font-medium transition-all duration-300",
                          idx === 0
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm"
                            : "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-800/40 text-zinc-600 dark:text-zinc-400"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6133e1]" />
                          <span>{bid.bidderName}</span>
                        </div>
                        <span className="font-extrabold"><PriceDisplay amountInUSD={bid.amount} /></span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Buy Now Option */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Buy Now price</h4>
          <p className="text-[10px] text-zinc-500">Skip the live bidding process</p>
        </div>
        <button
          onClick={onBuyNowClick}
          disabled={isBuyNowDisabled || sessionStatus === "loading"}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border cursor-pointer",
            (isBuyNowDisabled || sessionStatus === "loading")
              ? "bg-zinc-200 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-300 dark:border-zinc-800 cursor-not-allowed opacity-60"
              : "bg-zinc-900 hover:bg-[#6133e1] text-white border border-zinc-800 hover:border-[#6133e1]"
          )}
        >
          <span>BUY NOW</span>
          <span className={cn("text-[10px] font-bold border-l pl-2", (isBuyNowDisabled || sessionStatus === "loading") ? "border-zinc-300 dark:border-zinc-700/60 text-zinc-450 dark:text-zinc-500" : "border-zinc-700/60 text-zinc-400")}><PriceDisplay amountInUSD={buyNowPrice} /></span>
        </button>
      </div>
    </div>
  );
}
