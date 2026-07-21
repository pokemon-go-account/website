"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Loader2 } from "lucide-react";
import { PriceDisplay } from "@/components/price-display";
import type { BidHistoryItem } from "@/hooks/use-socket";

interface LiveRoomBidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  bids: BidHistoryItem[];
}

export function LiveRoomBidHistoryModal({ isOpen, onClose, isLoading, bids }: LiveRoomBidHistoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          {/* Modal Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 shadow-xl space-y-4 max-h-[80vh] flex flex-col z-10 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#6133e1]" />
                Full Bid History
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="h-6 w-6 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center justify-center text-xs font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px] flex flex-col">
              {isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-7 w-7 animate-spin text-[#6133e1]" />
                  <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Loading Bid Ledger...</span>
                </div>
              ) : bids.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-6 text-center">No bids placed yet.</p>
              ) : (
                bids.map((bid) => (
                  <div key={bid._id} className="flex justify-between items-center py-2.5 px-3 rounded-lg border border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-800 dark:text-white">{bid.bidderName}</span>
                      <div className="text-[9px] text-zinc-550 dark:text-zinc-400">
                        {new Date(bid.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{" "}
                        {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="font-black text-zinc-900 dark:text-white text-sm"><PriceDisplay amountInUSD={bid.amount} /></span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
