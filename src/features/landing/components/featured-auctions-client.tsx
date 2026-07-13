"use client";

import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { PriceDisplay } from "@/components/price-display";

const teamColors: Record<string, string> = {
  MYSTIC: "text-blue-500",
  VALOR: "text-red-500",
  INSTINCT: "text-yellow-500",
  NONE: "text-gray-400",
};



function formatTimeLeft(endTime: Date): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

import { useState, useEffect } from "react";

export function AuctionTimer({ endTime }: { endTime: Date | string }) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(new Date(endTime)));

  useEffect(() => {
    const updateTimer = () => {
      setTimeLeft(formatTimeLeft(new Date(endTime)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <span>{timeLeft}</span>;
}

interface LiveAuction {
  _id: string;
  currentHighestBid: number;
  endTime?: Date;
  listing: {
    title: string;
    level: number;
    shinyCount: number;
    legendaryCount: number;
    team: string;
    startingBid: number;
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeaturedAuctionsClient({ auctions }: { auctions: LiveAuction[] }) {
  return (    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-zinc-900 dark:text-white font-semibold text-lg tracking-tight flex items-center gap-3">
              <span className="inline-block h-5 w-1 rounded-md bg-zinc-900 dark:bg-white" />
              Featured Auctions
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 ml-4">Live bidding — updated in real time</p>
          </div>
          <Link href="/auctions" className="text-zinc-900 dark:text-white text-xs font-semibold hover:underline underline-offset-2">
            View All →
          </Link>
        </motion.div>

        {auctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] text-center gap-5"
          >
            <div className="h-12 w-12 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <h3 className="text-zinc-900 dark:text-white font-semibold text-sm mb-1">No Live Auctions Right Now</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-xs mx-auto leading-relaxed">
                Check back soon — new auctions are scheduled regularly.
              </p>
            </div>
            <Link
              href="/auctions"
              className="inline-flex h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold items-center justify-center transition-all active:scale-[0.98]"
            >
              Browse All Auctions
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {auctions.map((auction) => (
              <motion.div
                key={auction._id}
                variants={itemVariants}
                className="group rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-white/10 shadow-xs transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Visual */}
                <div className="relative h-32 bg-zinc-50 dark:bg-black/10 border-b border-zinc-205 dark:border-white/[0.06] flex items-center justify-center overflow-hidden">
                  <span className="text-4xl select-none group-hover:scale-102 transition-transform duration-500">⚡</span>
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="text-zinc-900 dark:text-white font-semibold text-xs leading-snug line-clamp-1">
                      {auction.listing.title}
                    </h3>
                    <p className={`text-[10px] mt-0.5 font-semibold ${teamColors[auction.listing.team] || "text-zinc-400"}`}>
                      Lv.{auction.listing.level} · Team {auction.listing.team}
                    </p>
                    <p className="text-zinc-400 dark:text-zinc-500 text-[10px] mt-1 font-semibold">
                      ✨ {auction.listing.shinyCount} Shinies · ⭐ {auction.listing.legendaryCount} Legendary
                    </p>
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-zinc-200 dark:border-white/[0.06] mt-auto">
                    <div>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Current Bid</p>
                      <p className="text-zinc-900 dark:text-white font-semibold text-sm leading-tight mt-0.5">
                        <PriceDisplay amountInUSD={auction.currentHighestBid} />
                      </p>
                    </div>
                    {auction.endTime && (
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Ends in</p>
                        <p className="text-zinc-700 dark:text-zinc-300 font-semibold text-[10px] flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-red-500 shrink-0" />
                          <AuctionTimer endTime={auction.endTime} />
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/auctions/${auction._id}`}
                    className="inline-flex h-8 w-full items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold rounded-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    BID NOW
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>


    </div>
  );
}
