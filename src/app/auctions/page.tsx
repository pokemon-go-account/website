import Link from "next/link";
import connectDB from "@/lib/db";
import { PriceDisplay } from "@/components/price-display";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing"; // Registers model for populate
import Product from "@/models/Product";
import Category from "@/models/Category";
import { Trophy, Clock, Play, CalendarDays, Archive, Sparkles, Flame, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0; // Dynamic rendering

interface AuctionsCatalogPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AuctionsCatalogPage({ searchParams }: AuctionsCatalogPageProps) {
  const { search } = await searchParams;
  await connectDB();
  
  // Explicitly reference models to prevent Turbopack tree-shaking
  const _modelCheck = Listing;
  const _modelCheckProduct = Product;
  const _modelCheckCategory = Category;

  let query: any = {};
  if (search && search.trim()) {
    const matchingListings = await Listing.find({
      $or: [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { region: { $regex: search.trim(), $options: "i" } },
      ],
    }).select("_id").lean();
    const matchingIds = matchingListings.map((l) => l._id);
    query.listingId = { $in: matchingIds };
  }

  // Fetch all auctions in chronological order of start time
  const auctionDocs = await Auction.find(query)
    .populate("listingId")
    .sort({ startTime: 1 })
    .lean();

  // Fetch matching storefront products if search is active
  let matchingProducts: any[] = [];
  if (search && search.trim()) {
    matchingProducts = await Product.find({
      $or: [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ],
    })
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();
  }

  const auctions = (auctionDocs as any[]).filter((auc) => auc.listingId) as Array<
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
    MYSTIC: "hover:border-blue-500/40 border-blue-200 dark:border-blue-900/30",
    VALOR: "hover:border-red-500/40 border-red-200 dark:border-red-900/30",
    INSTINCT: "hover:border-yellow-500/40 border-yellow-200 dark:border-yellow-900/30",
    NONE: "hover:border-zinc-400 dark:hover:border-zinc-700/50 border-zinc-200 dark:border-zinc-800",
  };

  const teamColors = {
    MYSTIC: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    VALOR: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
    INSTINCT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20",
    NONE: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  };

  // Split into active and concluded
  const activeAuctions = auctions.filter((auc) => {
    const hasEnded = new Date() >= new Date(auc.endTime);
    const isLive = auc.status === "LIVE" && !hasEnded;
    const isScheduled = auc.status === "SCHEDULED" && !hasEnded;
    return isLive || isScheduled;
  });

  const concludedAuctions = auctions.filter((auc) => {
    const hasEnded = new Date() >= new Date(auc.endTime);
    const isLive = auc.status === "LIVE" && !hasEnded;
    const isScheduled = auc.status === "SCHEDULED" && !hasEnded;
    return !(isLive || isScheduled);
  });

  function renderAuctionCard(auc: any) {
    const hasEnded = new Date() >= new Date(auc.endTime);
    const isLive = auc.status === "LIVE" && !hasEnded;
    const isScheduled = auc.status === "SCHEDULED" && !hasEnded;
    const isConcluded = hasEnded || (!isLive && !isScheduled);

    return (
      <div
        key={auc._id.toString()}
        className={cn(
          "relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-zinc-900/30 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/5 hover:translate-y-[-2px] space-y-6 shadow-xs",
          teamBorders[auc.listingId.team as keyof typeof teamBorders],
          isConcluded && "opacity-70 dark:opacity-50 hover:opacity-100"
        )}
      >
        {/* Upper row: Badge, Level and Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Status Badge */}
            {isLive && (
              <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-650 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 dark:border-red-500/20">
                <Flame className="h-3 w-3 animate-pulse" />
                Live Now
              </span>
            )}
            {isScheduled && (
              <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-250 dark:border-yellow-500/20">
                <CalendarDays className="h-3 w-3" />
                Scheduled
              </span>
            )}
            {isConcluded && (
              <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-200 dark:border-zinc-700">
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
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 dark:border-border/60 text-center">
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
                <PriceDisplay amountInUSD={auc.currentHighestBid} />
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
                ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-muted text-zinc-500 dark:text-muted-foreground border border-zinc-250 dark:border-border"
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
  }

  const hasNoResults = search && activeAuctions.length === 0 && concludedAuctions.length === 0 && matchingProducts.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      
      {/* Catalog Header */}
      <div className="border-b border-zinc-200 dark:border-border pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
          Bidding Catalog Blocks
        </h1>
        <p className="text-sm text-muted-foreground">
          Participate in active, live scheduled auctions for high-tier Trainer assets.
        </p>
      </div>

      {/* Grid List & Results */}
      {hasNoResults ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-border bg-white dark:bg-card/25 text-center p-8 shadow-xs">
          <div className="max-w-xs space-y-3">
            <h3 className="text-base font-semibold text-foreground">No matches found</h3>
            <p className="text-xs text-muted-foreground">
              We couldn't find any live rooms, concluded auctions, or store products matching "{search}". Try checking your spelling or search for another keyword.
            </p>
            <Link
              href="/auctions"
              className="inline-block h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold leading-8 transition-all active:scale-[0.98]"
            >
              Clear Search Filter
            </Link>
          </div>
        </div>
      ) : auctions.length === 0 && matchingProducts.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-border bg-white dark:bg-card/25 text-center p-8 shadow-xs">
          <div className="max-w-xs space-y-3">
            <h3 className="text-base font-semibold text-foreground">No auctions scheduled</h3>
            <p className="text-xs text-muted-foreground">
              New bidding blocks are scheduled instantly upon verification approval. Check back later!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Active Auctions Section */}
          {(activeAuctions.length > 0 || !search) && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Active Bidding Rooms</h2>
              </div>
              
              {activeAuctions.length === 0 ? (
                <div className="flex h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-border bg-white dark:bg-card/25 text-center p-6">
                  <p className="text-xs text-muted-foreground">No active live or scheduled bidding rooms at the moment.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {activeAuctions.map(renderAuctionCard)}
                </div>
              )}
            </div>
          )}

          {/* Store Products Section */}
          {search && matchingProducts.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <ShoppingBag className="h-4.5 w-4.5" />
                <h2 className="text-lg font-bold text-foreground tracking-tight">Direct Storefront Services</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {matchingProducts.map((prod: any) => (
                  <div
                    key={prod._id.toString()}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 backdrop-blur-sm p-6 hover:shadow-lg dark:hover:shadow-primary/5 transition-all duration-300 space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Product Image & Category */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-zinc-400" />
                        )}
                        {prod.categoryId?.name && (
                          <span className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase border border-white/10">
                            {prod.categoryId.name}
                          </span>
                        )}
                      </div>

                      {/* Product Title & Info */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-foreground tracking-tight line-clamp-1">{prod.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">{prod.description || "No description provided."}</p>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Direct Purchase Price</span>
                        <span className="text-base font-extrabold text-foreground"><PriceDisplay amountInUSD={prod.price} /></span>
                      </div>
                      <Link
                        href="/store"
                        className="h-8 px-4 inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-violet-500/10"
                      >
                        View in Store
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concluded Auctions Section */}
          {concludedAuctions.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Archive className="h-4.5 w-4.5" />
                <h2 className="text-lg font-bold text-foreground tracking-tight">Concluded Auctions</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {concludedAuctions.map(renderAuctionCard)}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
