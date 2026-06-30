"use client";

import { useEffect, useState } from "react";
import { useSocket, BidHistoryItem } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { AlertCircle, Clock, Gavel, ShieldCheck, Trophy, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiveRoomProps {
  auction: {
    _id: string;
    listingId: {
      title: string;
      description: string;
      level: number;
      shinyCount: number;
      legendaryCount: number;
      mythicalCount: number;
      team: "MYSTIC" | "VALOR" | "INSTINCT" | "NONE";
      minIncrement: number;
      startingBid: number;
      region: string;
    };
    currentHighestBid: number;
    highestBidderId?: any;
    endTime: string;
    status: string;
  };
  initialBids?: BidHistoryItem[];
}

export function LiveRoom({ auction, initialBids = [] }: LiveRoomProps) {
  const { data: session } = useSession();
  const {
    isConnected,
    currentBid,
    highestBidderId,
    bidHistory,
    error,
    placeBid,
    setError,
    setBidHistory,
    setCurrentBid,
    setHighestBidderId,
  } = useSocket(auction._id);

  const [timeLeft, setTimeLeft] = useState("Loading timer...");
  const [customBidAmount, setCustomBidAmount] = useState("");

  // Initialize values from SSR state props
  useEffect(() => {
    setCurrentBid(auction.currentHighestBid);
    setHighestBidderId(
      typeof auction.highestBidderId === "object"
        ? auction.highestBidderId?._id || ""
        : auction.highestBidderId || ""
    );
    setBidHistory(initialBids);
  }, [auction, initialBids, setBidHistory, setCurrentBid, setHighestBidderId]);

  // Countdown timer logic
  useEffect(() => {
    const end = new Date(auction.endTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Auction Concluded");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  const activeBid = currentBid !== null ? currentBid : auction.currentHighestBid;
  const minIncrement = auction.listingId.minIncrement;
  const nextMinBid = activeBid + minIncrement;

  const handlePlaceBid = (amount: number) => {
    if (amount < nextMinBid) {
      setError(`Minimum bid requirement is ₹${nextMinBid}`);
      return;
    }
    placeBid(amount);
  };

  const handleCustomBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customBidAmount, 10);
    if (isNaN(parsed)) {
      setError("Please enter a valid numeric bid amount.");
      return;
    }
    handlePlaceBid(parsed);
    setCustomBidAmount("");
  };

  // Team badges mapping
  const teamColors = {
    MYSTIC: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    VALOR: "bg-red-500/10 text-red-500 border-red-500/20",
    INSTINCT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    NONE: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Real-time connection status overlay/banner */}
      <div className="mb-6">
        {!isConnected ? (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4 animate-pulse" />
            Connecting to real-time bidding engine... Live updates paused.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Secure live WebSocket gateway active.
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Asset telemetry and details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                Live Asset Block
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mt-3 text-foreground tracking-tight">
                {auction.listingId.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Region: {auction.listingId.region}</p>
            </div>

            {/* Asset statistics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">Trainer Level</div>
                <div className="text-xl font-bold text-foreground mt-1">{auction.listingId.level}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">Shiny Count</div>
                <div className="text-xl font-bold text-yellow-500 mt-1">{auction.listingId.shinyCount}✨</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">Legendary</div>
                <div className="text-xl font-bold text-orange-500 mt-1">{auction.listingId.legendaryCount}🏆</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">Mythical</div>
                <div className="text-xl font-bold text-purple-500 mt-1">{auction.listingId.mythicalCount}🔮</div>
              </div>
            </div>

            {/* Faction and Description */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Faction Alignment</h3>
                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", teamColors[auction.listingId.team])}>
                  Team {auction.listingId.team}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {auction.listingId.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live bidding and history module */}
        <div className="space-y-6">
          {/* Main bidding portal */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-lg relative overflow-hidden">
            {/* Ambient indicator glow */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Remaining Time
              </span>
              <span className="text-xs font-medium text-yellow-500 flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                {timeLeft}
              </span>
            </div>

            {/* Bid telemetry */}
            <div className="text-center py-4 space-y-1">
              <span className="text-xs text-muted-foreground">Current Highest Bid</span>
              <h2 className="text-4xl font-black text-foreground tracking-tight">
                ₹{activeBid.toLocaleString()}
              </h2>
              {highestBidderId === session?.user?.id ? (
                <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500 font-semibold border border-emerald-500/20 mt-1">
                  <ShieldCheck className="h-3 w-3" /> You are the highest bidder
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-semibold border border-border mt-1">
                  Outbid or pending bids
                </div>
              )}
            </div>

            {/* Live interactive bid placements */}
            <div className="space-y-3 pt-2">
              {/* Errors notifications */}
              {error && (
                <div className="flex items-start gap-1.5 rounded bg-destructive/10 p-2.5 text-[11px] leading-tight text-destructive border border-destructive/20">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Incremental preset button */}
              <button
                onClick={() => handlePlaceBid(nextMinBid)}
                disabled={!isConnected}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Gavel className="h-4 w-4" />
                Place Bid (₹{nextMinBid.toLocaleString()})
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Or enter custom amount</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Custom bid placement form */}
              <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                  <input
                    type="number"
                    value={customBidAmount}
                    onChange={(e) => setCustomBidAmount(e.target.value)}
                    placeholder={nextMinBid.toString()}
                    className="w-full h-9 pl-6 pr-3 bg-muted/40 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    disabled={!isConnected}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isConnected}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground border border-border text-xs font-semibold hover:bg-muted/70 active:scale-95 transition-all cursor-pointer"
                >
                  Place
                </button>
              </form>
            </div>
          </div>

          {/* Scrolling Bid Ledger */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Live Bid Ledger
            </h3>

            <div className="h-[250px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
              <AnimatePresence initial={false}>
                {bidHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground">
                    No bids recorded yet. Be the first!
                  </div>
                ) : (
                  bidHistory.map((bid) => (
                    <motion.div
                      key={bid._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground">{bid.bidderName}</span>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                      <span className="font-bold text-primary dark:text-neutral-300">
                        ₹{bid.amount.toLocaleString()}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
