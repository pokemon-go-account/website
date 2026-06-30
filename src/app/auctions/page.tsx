import Link from "next/link";
import connectDB from "@/lib/db";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing"; // Registers model for populate
import { Trophy, Clock, Play, CalendarDays, Archive, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0; // Dynamic rendering

export default async function AuctionsCatalogPage() {
  await connectDB();

  // Fetch all auctions in chronological order of start time
  const auctionDocs = await Auction.find()
    .populate("listingId")
    .sort({ startTime: 1 })
    .lean();

  const auctions = auctionDocs as Array<
    any & {
      listingId: {
        title: string;
        description: string;
        level: number;
        shinyCount: number;
        legendaryCount: number;
        mythicalCount: number;
        team: "MYSTIC" | "VALOR" | "INSTINCT" | "NONE";
        startingBid: number;
        region: string;
      };
    }
  >;

  // Team border coloring maps
  const teamBorders = {
    MYSTIC: "hover:border-blue-500/40 border-blue-900/10",
    VALOR: "hover:border-red-500/40 border-red-900/10",
    INSTINCT: "hover:border-yellow-500/40 border-yellow-900/10",
    NONE: "hover:border-zinc-700/50 border-zinc-800",
  };

  const teamColors = {
    MYSTIC: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    VALOR: "bg-red-500/10 text-red-400 border-red-500/20",
    INSTINCT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    NONE: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      
      {/* Catalog Header */}
      <div className="border-b border-border pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
          Bidding Catalog Blocks
        </h1>
        <p className="text-sm text-muted-foreground">
          Participate in active, live scheduled auctions for high-tier Trainer assets.
        </p>
      </div>

      {/* Grid List */}
      {auctions.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/25 text-center p-8">
          <div className="max-w-xs space-y-3">
            <h3 className="text-base font-semibold text-foreground">No auctions scheduled</h3>
            <p className="text-xs text-muted-foreground">
              Sellers are moderating listings. Check back later or list your own asset!
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/seller/listings/new"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 px-4 text-xs font-semibold text-white border border-zinc-700/50"
              >
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auc) => {
            const isLive = auc.status === "LIVE";
            const isScheduled = auc.status === "SCHEDULED";
            const isConcluded = !isLive && !isScheduled;

            return (
              <div
                key={auc._id.toString()}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border bg-card/30 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px] space-y-6",
                  teamBorders[auc.listingId.team as keyof typeof teamBorders]
                )}
              >
                {/* Upper row: Badge, Level and Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Status Badge */}
                    {isLive && (
                      <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/20">
                        <Flame className="h-3 w-3 animate-pulse" />
                        Live Now
                      </span>
                    )}
                    {isScheduled && (
                      <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20">
                        <CalendarDays className="h-3 w-3" />
                        Scheduled
                      </span>
                    )}
                    {isConcluded && (
                      <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-700">
                        <Archive className="h-3 w-3" />
                        Concluded
                      </span>
                    )}

                    {/* Level and Team */}
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", teamColors[auc.listingId.team as keyof typeof teamColors])}>
                      Lvl {auc.listingId.level} • {auc.listingId.team}
                    </span>
                  </div>

                  {/* Title & region */}
                  <div>
                    <h3 className="font-bold text-base text-foreground tracking-tight line-clamp-1">
                      {auc.listingId.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Region: {auc.listingId.region}</p>
                  </div>
                </div>

                {/* Middle row: Asset metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/60 text-center">
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-muted-foreground uppercase font-semibold">Shiny</div>
                    <div className="text-xs font-bold text-yellow-500">{auc.listingId.shinyCount}✨</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-muted-foreground uppercase font-semibold">Legendary</div>
                    <div className="text-xs font-bold text-orange-500">{auc.listingId.legendaryCount}🏆</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-muted-foreground uppercase font-semibold">Mythical</div>
                    <div className="text-xs font-bold text-purple-500">{auc.listingId.mythicalCount}🔮</div>
                  </div>
                </div>

                {/* Lower row: Telemetry and bidding actions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">Current Highest Bid</span>
                      <div className="font-extrabold text-foreground text-sm">
                        ₹{auc.currentHighestBid.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">End Time</span>
                      <div className="font-semibold text-foreground text-[10px] flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(auc.endTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>

                  {/* Join Link Button */}
                  <Link
                    href={`/auctions/${auc._id.toString()}`}
                    className={cn(
                      "w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer",
                      isConcluded
                        ? "bg-muted text-muted-foreground border border-border"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/50"
                    )}
                  >
                    {isLive ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Join Live Room
                      </>
                    ) : (
                      <>
                        <Trophy className="h-3.5 w-3.5" />
                        View Bidding Block
                      </>
                    )}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
