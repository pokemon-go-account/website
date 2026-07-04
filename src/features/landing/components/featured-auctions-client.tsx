"use client";

import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const teamColors: Record<string, string> = {
  MYSTIC: "text-blue-500",
  VALOR: "text-red-500",
  INSTINCT: "text-yellow-500",
  NONE: "text-gray-400",
};

const whyChooseUs = [
  "Largest Pokémon GO Auction Community",
  "Verified Assets",
  "Fair Auctions",
  "Instant Delivery (Items)",
  "Dedicated Support",
];

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
  return (
    <div className="flex gap-6">
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
            <h2 className="text-gray-900 dark:text-white font-extrabold text-xl tracking-tight flex items-center gap-3">
              <span className="inline-block h-5 w-1 rounded-full bg-gray-900 dark:bg-white" />
              Featured Auctions
            </h2>
            <p className="text-gray-500 dark:text-gray-600 text-xs mt-1 ml-4">Live bidding — updated in real time</p>
          </div>
          <Link href="/auctions" className="text-gray-900 dark:text-white text-xs font-semibold hover:underline underline-offset-2">
            View All →
          </Link>
        </motion.div>

        {auctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#0d0d0f] text-center gap-5"
          >
            <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-base mb-1">No Live Auctions Right Now</h3>
              <p className="text-gray-500 dark:text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                Check back soon — new auctions are scheduled regularly.
              </p>
            </div>
            <Link
              href="/auctions"
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-lg shadow-black/10 dark:shadow-white/5"
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
                className="group rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#111113] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-xl dark:hover:shadow-white/5 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Visual */}
                <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0f0f0f] flex items-center justify-center overflow-hidden">
                  <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">⚡</span>
                  <div className="absolute inset-0 opacity-0 dark:group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-bold text-sm leading-snug line-clamp-1">
                      {auction.listing.title}
                    </h3>
                    <p className={`text-[11px] mt-0.5 font-medium ${teamColors[auction.listing.team] || "text-gray-400"}`}>
                      Lv.{auction.listing.level} · Team {auction.listing.team}
                    </p>
                    <p className="text-gray-400 dark:text-gray-600 text-[10px] mt-1">
                      ✨ {auction.listing.shinyCount} Shinies · ⭐ {auction.listing.legendaryCount} Legendary
                    </p>
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-gray-100 dark:border-white/[0.05] mt-auto">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">Current Bid</p>
                      <p className="text-gray-955 dark:text-white font-extrabold text-lg leading-tight">
                        ${auction.currentHighestBid.toLocaleString()}
                      </p>
                    </div>
                    {auction.endTime && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">Ends in</p>
                        <p className="text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3 text-red-400 shrink-0" />
                          <AuctionTimer endTime={auction.endTime} />
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/auctions/${auction._id}`}
                    className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black text-xs font-bold text-center py-2.5 rounded-xl transition-all active:scale-95 block shadow-sm shadow-black/10 dark:shadow-white/5"
                  >
                    BID NOW
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden xl:flex flex-col gap-4 w-56 shrink-0"
      >
        <div className="bg-gray-50 dark:bg-[#0d0d0f] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-gray-900 dark:text-white font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4">
            WHY CHOOSE US?
          </h3>
          <ul className="space-y-3">
            {whyChooseUs.map((item) => (
              <li key={item} className="flex items-start gap-2 text-gray-600 dark:text-gray-500 text-xs leading-snug">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
