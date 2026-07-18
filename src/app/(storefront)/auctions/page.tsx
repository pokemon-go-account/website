import { Metadata } from "next";
import Link from "next/link";
import connectDB from "@/lib/db";
import { PriceDisplay } from "@/components/price-display";
import Auction from "@/models/Auction";
import { expireStaleAuctions } from "@/features/auctions/actions";
import Listing from "@/models/Listing"; // Registers model for populate
import Product from "@/models/Product";
import Category from "@/models/Category";
import { Trophy, Clock, Play, CalendarDays, Archive, Sparkles, Flame, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live Auctions | Buy Pokémon GO Accounts, Shiny Pokémon & Level 40 Accounts",
  description: "Bid live on verified Pokémon GO accounts, level 40 accounts, shiny Mewtwo, Charizard, Dragonite, and Stardust packages in our real-time auction marketplace.",
  keywords: [
    "pokemon go accounts",
    "buy pokemon go accounts",
    "buy pokemon go pokemon",
    "cheap pokemon go accounts",
    "level 40 pokemon go account",
    "best place to buy pokemon go accounts",
    "purchase pokemon go account",
    "shiny pokemon for sale pokemon go",
    "mewtwo pokemon go",
    "charizard pokemon go",
    "buy stardust pokemon go",
    "buy cheap pokemon go accounts",
    "best pokemon go account",
    "the rarest pokemon"
  ],
};

export const revalidate = 0; // Dynamic rendering

interface AuctionsCatalogPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AuctionsCatalogPage({ searchParams }: AuctionsCatalogPageProps) {
  const { search } = await searchParams;
  await connectDB();
  await expireStaleAuctions();
  
  // Explicitly reference models to prevent Turbopack tree-shaking
  const _modelCheck = Listing;
  const _modelCheckProduct = Product;
  const _modelCheckCategory = Category;

  let query: any = {};
  if (search && search.trim()) {
    const s = search.trim();
    const numericVal = parseInt(s.replace(/\D/g, ""), 10);
    const levelMatch = !isNaN(numericVal) && numericVal > 0;

    // Build $or conditions — text fields + enum fields + optional numeric level
    const orConditions: any[] = [
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { region: { $regex: s, $options: "i" } },
      { team: { $regex: s, $options: "i" } },
      { accountType: { $regex: s, $options: "i" } },
      { accountStatus: { $regex: s, $options: "i" } },
      { topPokemon: { $regex: s, $options: "i" } },
    ];
    if (levelMatch) {
      orConditions.push({ level: numericVal });
    }

    const matchingListings = await Listing.find({ $or: orConditions }).select("_id").lean();
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
        shinyPokemons?: number;
        legendaryPokemons?: number;
        mythicalPokemons?: number;
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
  });  function renderAuctionCard(auc: any) {
    const hasEnded = new Date() >= new Date(auc.endTime);
    const isLive = auc.status === "LIVE" && !hasEnded;
    const isScheduled = auc.status === "SCHEDULED" && !hasEnded;
    const isConcluded = hasEnded || (!isLive && !isScheduled);

    const shiny = auc.listingId.shinyPokemons || auc.listingId.shinyCount || 0;
    const legendary = auc.listingId.legendaryPokemons || auc.listingId.legendaryCount || 0;
    const mythical = auc.listingId.mythicalPokemons || auc.listingId.mythicalCount || 0;

    const visibleMetrics = [];
    if (shiny > 0) visibleMetrics.push({ label: "Shiny", value: `${shiny}✨`, colorClass: "text-yellow-600 dark:text-yellow-500" });
    if (legendary > 0) visibleMetrics.push({ label: "Legendary", value: `${legendary}🏆`, colorClass: "text-orange-600 dark:text-orange-500" });
    if (mythical > 0) visibleMetrics.push({ label: "Mythical", value: `${mythical}🔮`, colorClass: "text-purple-600 dark:text-purple-550" });

    const gridColsClass = 
      visibleMetrics.length === 3 ? "grid-cols-3" :
      visibleMetrics.length === 2 ? "grid-cols-2" :
      "grid-cols-1";

    const screenshots = auc.listingId.screenshots || [];
    const hasImage = screenshots.length > 0;

    return (
      <div
        key={auc._id.toString()}
        className={cn(
          "group relative flex flex-col justify-between rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] transition-all duration-200 hover:border-zinc-300 dark:hover:border-white/[0.1] shadow-xs overflow-hidden",
          isConcluded && "opacity-75 dark:opacity-50 hover:opacity-100"
        )}
      >
        {/* Upper row: Screenshot image header */}
        <div className="relative h-36 bg-zinc-50 dark:bg-black/10 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <img 
              src={screenshots[0]} 
              alt={auc.listingId.title} 
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-4xl select-none group-hover:scale-102 transition-transform duration-500">⚡</span>
          )}
          
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {isLive && (
              <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md text-[9px] font-semibold border border-red-500/20 backdrop-blur-md">
                <Flame className="h-2.5 w-2.5 animate-pulse" />
                Live Now
              </span>
            )}
            {isScheduled && (
              <span className="inline-flex items-center gap-1 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-md text-[9px] font-semibold border border-yellow-500/20 backdrop-blur-md">
                <CalendarDays className="h-2.5 w-2.5" />
                Scheduled
              </span>
            )}
            {isConcluded && (
              <span className="inline-flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-550 dark:text-zinc-450 px-2 py-0.5 rounded-md text-[9px] font-semibold border border-zinc-250 dark:border-zinc-700 backdrop-blur-md">
                <Archive className="h-2.5 w-2.5" />
                Concluded
              </span>
            )}
          </div>

          <span className={cn("absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-semibold border backdrop-blur-md", teamColors[auc.listingId.team as keyof typeof teamColors])}>
            Lvl {auc.listingId.level} • {auc.listingId.team}
          </span>
        </div>

        {/* Content Details */}
        <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
          <div className="space-y-3">
            {/* Title & region */}
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white tracking-tight line-clamp-1">
                {auc.listingId.title}
              </h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1">Region: {auc.listingId.region}</p>
            </div>
          </div>

          {/* Middle row: Asset metrics */}
          {visibleMetrics.length > 0 && (
            <div className={cn("grid gap-2 py-2.5 border-y border-zinc-200 dark:border-white/[0.06] text-center bg-zinc-50/50 dark:bg-black/10 rounded-md", gridColsClass)}>
              {visibleMetrics.map((m) => (
                <div key={m.label} className="space-y-0.5">
                  <div className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">{m.label}</div>
                  <div className={cn("text-xs font-semibold", m.colorClass)}>{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Lower row: Telemetry and bidding actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Highest Bid</span>
                <div className="font-semibold text-zinc-900 dark:text-white text-sm">
                  <PriceDisplay amountInUSD={auc.currentHighestBid} />
                </div>
              </div>
              
              <div className="text-right space-y-0.5">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500">End Time</span>
                <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-[10px] flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3 text-zinc-450" />
                  {new Date(auc.endTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Join Link Button */}
            <Link
              href={`/auctions/${auc._id.toString()}`}
              className={cn(
                "w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer",
                isConcluded
                  ? "border border-zinc-300 hover:border-zinc-400 dark:border-white/[0.1] dark:hover:border-white/[0.2] bg-zinc-50 hover:bg-zinc-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-zinc-900 dark:text-white shadow-xs"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 border border-transparent"
              )}
            >
              {isLive ? (
                <>
                  <Play className="h-3 w-3" />
                  Join Live Room
                </>
              ) : (
                <>
                  <Trophy className="h-3 w-3" />
                  View Bidding Block
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasNoResults = search && activeAuctions.length === 0 && concludedAuctions.length === 0 && matchingProducts.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Catalog Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Bidding Catalog Blocks
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Participate in active, live scheduled auctions for high-tier Trainer assets.
        </p>
      </div>

      {/* Grid List & Results */}
      {hasNoResults ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] text-center p-8 shadow-xs">
          <div className="max-w-xs space-y-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No matches found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              We couldn't find any live rooms, concluded auctions, or store products matching "{search}". Try checking your spelling or search for another keyword.
            </p>
            <Link
              href="/auctions"
              className="inline-flex h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold items-center justify-center transition-all active:scale-[0.98]"
            >
              Clear Search Filter
            </Link>
          </div>
        </div>
      ) : auctions.length === 0 && matchingProducts.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] text-center p-8 shadow-xs">
          <div className="max-w-xs space-y-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No auctions scheduled</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400">
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
