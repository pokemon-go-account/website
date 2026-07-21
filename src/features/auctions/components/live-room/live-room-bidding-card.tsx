"use client";

import { useState } from "react";
import { Gavel, Trophy, Clock, Zap, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LiveRoomBiddingCardProps {
  currentBid: number | null;
  startingBid: number;
  minIncrement: number;
  highestBidderName?: string | null;
  status: string;
  endTime: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
  buyNowPrice?: number;
  currencySymbol: string;
  convertPrice: (usd: number) => string;
  onPlaceBid: (amount: number) => Promise<void>;
  onBuyNowClick?: () => void;
  onRegisterClick?: () => void;
  onOpenBidHistory?: () => void;
}

export function LiveRoomBiddingCard({
  currentBid,
  startingBid,
  minIncrement = 5,
  highestBidderName,
  status,
  endTime,
  isRegistered,
  isLoggedIn,
  buyNowPrice,
  convertPrice,
  onPlaceBid,
  onBuyNowClick,
  onRegisterClick,
  onOpenBidHistory,
}: LiveRoomBiddingCardProps) {
  const displayBid = currentBid !== null && currentBid > 0 ? currentBid : startingBid;
  const nextMinBid = displayBid + minIncrement;

  const [customBidInput, setCustomBidInput] = useState<string>(nextMinBid.toString());
  const [biddingLoading, setBiddingLoading] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  const quickIncrements = [minIncrement, minIncrement * 2, minIncrement * 5, minIncrement * 10];

  const handleCustomBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customBidInput);
    if (isNaN(amount) || amount < nextMinBid) {
      setBidError(`Bid must be at least ${convertPrice(nextMinBid)}`);
      return;
    }
    setBidError(null);
    setBiddingLoading(true);
    try {
      await onPlaceBid(amount);
    } catch (err: any) {
      setBidError(err.message || "Failed to place bid.");
    } finally {
      setBiddingLoading(false);
    }
  };

  const handleQuickBid = async (incAmount: number) => {
    const targetBid = displayBid + incAmount;
    setBidError(null);
    setBiddingLoading(true);
    try {
      await onPlaceBid(targetBid);
    } catch (err: any) {
      setBidError(err.message || "Failed to place bid.");
    } finally {
      setBiddingLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121217] border border-zinc-200/80 dark:border-white/10 p-6 shadow-xl space-y-6">
      {/* Highest Bid Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-4">
        <div>
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Highest Bid</div>
          <div className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-baseline gap-2 mt-1">
            {convertPrice(displayBid)}
            <span className="text-xs font-semibold text-zinc-400">USD</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBidHistory}
          className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-bold text-[#6133e1] dark:text-purple-400 transition cursor-pointer flex items-center gap-1.5"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Bid History
        </button>
      </div>

      {/* Highest Bidder Details */}
      {highestBidderName && (
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-white/5 p-3 rounded-xl border border-zinc-100 dark:border-white/5">
          <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
          Leading Bidder: <span className="text-zinc-900 dark:text-white font-bold">{highestBidderName}</span>
        </div>
      )}

      {/* Bidding Controls Section */}
      {status === "LIVE" ? (
        isLoggedIn ? (
          isRegistered ? (
            <div className="space-y-4">
              {/* Quick Increment Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickIncrements.map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleQuickBid(inc)}
                    disabled={biddingLoading}
                    className="py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-[#6133e1] hover:text-white text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer border border-zinc-200/50 dark:border-white/10 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    +{convertPrice(inc)}
                  </button>
                ))}
              </div>

              {/* Custom Bid Input Form */}
              <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min={nextMinBid}
                  value={customBidInput}
                  onChange={(e) => setCustomBidInput(e.target.value)}
                  placeholder={`Min bid: ${convertPrice(nextMinBid)}`}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1]"
                />
                <button
                  type="submit"
                  disabled={biddingLoading}
                  className="px-6 py-3 rounded-xl bg-[#6133e1] hover:bg-[#5028c2] text-white text-sm font-extrabold shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {biddingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                  Place Bid
                </button>
              </form>

              {bidError && <div className="text-xs font-bold text-red-500">{bidError}</div>}
            </div>
          ) : (
            /* Registration Deposit Required Banner */
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <ShieldCheck className="h-4 w-4" /> Bidding Registration Deposit Required
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                A standard refundable deposit is required to participate in live bidding and prevent bot spam.
              </p>
              <button
                type="button"
                onClick={onRegisterClick}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                Register & Unlock Bidding <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )
        ) : (
          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-white/5 text-center text-xs text-zinc-500">
            Please log in to register and place live bids.
          </div>
        )
      ) : (
        <div className="p-4 rounded-xl bg-zinc-100 dark:bg-white/5 text-center text-xs font-bold text-zinc-500">
          Auction is currently {status}. Bidding is disabled.
        </div>
      )}

      {/* Buy Now Option */}
      {buyNowPrice && buyNowPrice > 0 && status === "LIVE" && (
        <div className="border-t border-zinc-100 dark:border-white/5 pt-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1">
              <Zap className="h-3 w-3 fill-amber-500" /> Buy Now Guarantee
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-white">{convertPrice(buyNowPrice)}</div>
          </div>
          <button
            type="button"
            onClick={onBuyNowClick}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}
