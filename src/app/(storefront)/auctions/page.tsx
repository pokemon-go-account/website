import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import connectDB from "@/lib/db";
import { PriceDisplay } from "@/components/price-display";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing"; // Registers model for populate
import Product from "@/models/Product";
import Category from "@/models/Category";
import { Trophy, Clock, Play, CalendarDays, Archive, Flame, ShoppingBag, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live Auctions | Buy Pokémon GO Accounts, Shiny Pokémon & Level 80 Accounts",
  description: "Bid live on verified Pokémon GO accounts, level 80 accounts, shiny Mewtwo, Charizard, Dragonite, and Stardust packages in our real-time auction marketplace.",
  keywords: [
    "pokemon go accounts",
    "buy pokemon go accounts",
    "buy pokemon go pokemon",
    "cheap pokemon go accounts",
    "level 80 pokemon go account",
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

export const revalidate = 30; // ISR cache on Vercel CDN for 30s

interface AuctionsCatalogPageProps {
  searchParams: Promise<{ search?: string; tab?: string; team?: string }>;
}

export default async function AuctionsCatalogPage({ searchParams }: AuctionsCatalogPageProps) {
  const { search, tab = "ALL", team = "ALL" } = await searchParams;
  await connectDB();
  
  // Explicitly reference models to prevent Turbopack tree-shaking
  const _modelCheck = Listing;
  const _modelCheckProduct = Product;
  const _modelCheckCategory = Category;

  let query: any = {};
  
  // 1. Build Listing filter query
  const listingQuery: any = {};
  if (team && team !== "ALL") {
    listingQuery.team = team.toUpperCase();
  }

  if (search && search.trim()) {
    const rawSearch = search.trim();
    const tokens = rawSearch
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter(Boolean);

    const stopWords = new Set(["buy", "pokemon", "go", "for", "sale", "the", "a", "an", "in", "of", "with"]);
    const filteredTokens = tokens.filter((t) => !stopWords.has(t));
    const terms = filteredTokens.length > 0 ? filteredTokens : (tokens.length > 0 ? tokens : [rawSearch]);

    const termConditions = terms.map((term) => {
      const numVal = parseInt(term, 10);
      const isNum = !isNaN(numVal) && numVal > 0;

      const termOrs: any[] = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { region: { $regex: term, $options: "i" } },
        { team: { $regex: term, $options: "i" } },
        { accountType: { $regex: term, $options: "i" } },
        { accountStatus: { $regex: term, $options: "i" } },
        { topPokemon: { $regex: term, $options: "i" } },
      ];
      if (isNum) {
        termOrs.push({ level: numVal });
      }
      return { $or: termOrs };
    });

    const rawOrs: any[] = [
      { title: { $regex: rawSearch, $options: "i" } },
      { description: { $regex: rawSearch, $options: "i" } },
      { topPokemon: { $regex: rawSearch, $options: "i" } },
    ];

    const searchBranch = {
      $or: [
        { $and: termConditions },
        ...rawOrs,
      ],
    };

    if (listingQuery.team) {
      listingQuery.$and = [{ team: listingQuery.team }, searchBranch];
      delete listingQuery.team;
    } else {
      Object.assign(listingQuery, searchBranch);
    }
  }

  if (Object.keys(listingQuery).length > 0) {
    const matchingListings = await Listing.find(listingQuery).select("_id").lean();
    const matchingIds = matchingListings.map((l) => l._id);
    query.listingId = { $in: matchingIds };
  }

  // Fetch all auctions sorted chronologically
  const auctionDocs = await Auction.find(query)
    .populate("listingId")
    .sort({ startTime: 1 })
    .lean();

  // Fetch matching storefront products if search is active
  let matchingProducts: any[] = [];
  if (search && search.trim()) {
    const rawSearch = search.trim();
    const tokens = rawSearch
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter(Boolean);

    const stopWords = new Set(["buy", "pokemon", "go", "for", "sale", "the", "a", "an", "in", "of", "with"]);
    const filteredTokens = tokens.filter((t) => !stopWords.has(t));
    const terms = filteredTokens.length > 0 ? filteredTokens : (tokens.length > 0 ? tokens : [rawSearch]);

    const productTermConditions = terms.map((term) => ({
      $or: [
        { name: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ],
    }));

    matchingProducts = await Product.find({
      $or: [
        { $and: productTermConditions },
        { name: { $regex: rawSearch, $options: "i" } },
        { description: { $regex: rawSearch, $options: "i" } },
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
        screenshots?: string[];
      };
    }
  >;

  // Team border coloring maps
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

    if (tab === "LIVE") return isLive;
    if (tab === "SCHEDULED") return isScheduled;
    if (tab === "CONCLUDED") return false;
    return isLive || isScheduled;
  });

  const concludedAuctions = auctions.filter((auc) => {
    const hasEnded = new Date() >= new Date(auc.endTime);
    const isLive = auc.status === "LIVE" && !hasEnded;
    const isScheduled = auc.status === "SCHEDULED" && !hasEnded;
    const isConcluded = hasEnded || (!isLive && !isScheduled);

    if (tab === "LIVE" || tab === "SCHEDULED") return false;
    if (tab === "CONCLUDED") return isConcluded;
    return isConcluded;
  });

  function renderAuctionCard(auc: any) {
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
          "group relative flex flex-col justify-between rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] transition-all duration-200 hover:border-zinc-300 dark:hover:border-white/[0.1] shadow-xs overflow-hidden h-full",
          isConcluded && "opacity-80 dark:opacity-60 hover:opacity-100"
        )}
      >
        {/* Upper row: Screenshot image header */}
        <div className="relative h-40 sm:h-44 bg-zinc-50 dark:bg-black/10 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <Image 
              src={screenshots[0]} 
              alt={auc.listingId.title} 
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-contain max-h-full max-w-full p-2 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-4xl select-none group-hover:scale-105 transition-transform duration-500">⚡</span>
          )}
          
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
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
              <span className="inline-flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md text-[9px] font-semibold border border-zinc-200 dark:border-zinc-700 backdrop-blur-md">
                <Archive className="h-2.5 w-2.5" />
                Concluded
              </span>
            )}
          </div>

          <span className={cn("absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-semibold border backdrop-blur-md z-10", teamColors[auc.listingId.team as keyof typeof teamColors])}>
            Lvl {auc.listingId.level} • {auc.listingId.team}
          </span>
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow space-y-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {auc.listingId.title}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Region: {auc.listingId.region}</p>
            </div>
          </div>

          {/* Middle row: Asset metrics */}
          {visibleMetrics.length > 0 && (
            <div className={cn("grid gap-2 py-2 border-y border-zinc-100 dark:border-zinc-800/60 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-md", gridColsClass)}>
              {visibleMetrics.map((m) => (
                <div key={m.label} className="space-y-0.5">
                  <div className="text-[9px] text-zinc-400 uppercase font-semibold">{m.label}</div>
                  <div className={cn("text-xs font-semibold", m.colorClass)}>{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Lower row: Telemetry and bidding actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400">Highest Bid</span>
                <div className="font-semibold text-zinc-900 dark:text-white text-sm font-mono">
                  <PriceDisplay amountInUSD={auc.currentHighestBid} />
                </div>
              </div>
              
              <div className="text-right space-y-0.5">
                <span className="text-[10px] text-zinc-400">End Time</span>
                <div className="font-semibold text-zinc-700 dark:text-zinc-300 text-[10px] flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  {new Date(auc.endTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Action Link */}
            <Link
              href={`/auctions/${auc._id.toString()}`}
              className={cn(
                "w-full h-8.5 inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer",
                isConcluded
                  ? "border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900"
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Bidding Catalog & Live Rooms
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Participate in live real-time auctions for high-tier verified Pokémon GO Trainer assets.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
            <Link
              href={`/auctions?tab=ALL${team !== "ALL" ? `&team=${team}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-colors text-center cursor-pointer",
                tab === "ALL" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              All
            </Link>
            <Link
              href={`/auctions?tab=LIVE${team !== "ALL" ? `&team=${team}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-colors text-center cursor-pointer flex items-center justify-center gap-1",
                tab === "LIVE" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </Link>
            <Link
              href={`/auctions?tab=CONCLUDED${team !== "ALL" ? `&team=${team}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-colors text-center cursor-pointer",
                tab === "CONCLUDED" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Concluded
            </Link>
          </div>

          {/* Search Input Form */}
          <form action="/auctions" method="GET" className="relative">
            {tab !== "ALL" && <input type="hidden" name="tab" value={tab} />}
            {team !== "ALL" && <input type="hidden" name="team" value={team} />}
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Search listing title, level..."
              className="w-full sm:w-56 pl-8 pr-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
            />
          </form>
        </div>
      </div>

      {/* 2. GRID LISTINGS ACROSS ALL SCREEN SIZES */}
      {hasNoResults ? (
        <div className="py-16 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No auction matches found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            We couldn't find any bidding blocks or storefront items matching "{search}". Try searching another keyword or clearing filters.
          </p>
          <Link
            href="/auctions"
            className="inline-flex h-8 px-3.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-semibold items-center justify-center transition-colors"
          >
            Clear Filters
          </Link>
        </div>
      ) : auctions.length === 0 && matchingProducts.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No active auctions scheduled</h3>
          <p className="text-xs text-zinc-500">
            New bidding blocks are scheduled upon admin verification approval. Check back shortly!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Active Auctions Grid */}
          {(activeAuctions.length > 0 || tab === "LIVE" || tab === "SCHEDULED" || tab === "ALL") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Active Bidding Rooms ({activeAuctions.length})
                  </h2>
                </div>
              </div>
              
              {activeAuctions.length === 0 ? (
                <div className="py-12 text-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-400">
                  No active live or scheduled bidding rooms at the moment.
                </div>
              ) : (
                /* RESPONSIVE GRID FOR ALL SCREEN SIZES */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {activeAuctions.map(renderAuctionCard)}
                </div>
              )}
            </div>
          )}

          {/* Store Products Search Section */}
          {search && matchingProducts.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-purple-500" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Direct Storefront Products ({matchingProducts.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {matchingProducts.map((prod: any) => (
                  <div
                    key={prod._id.toString()}
                    className="group flex flex-col justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-2 border border-zinc-100 dark:border-zinc-900">
                        {prod.imageUrl ? (
                          <Image
                            src={prod.imageUrl}
                            alt={prod.name}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-zinc-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {prod.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 line-clamp-2">
                          {prod.description || "Verified direct purchase catalog product."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-900">
                      <div>
                        <span className="text-[10px] text-zinc-400 block leading-none">Price</span>
                        <span className="text-sm font-bold font-mono text-zinc-900 dark:text-white">
                          <PriceDisplay amountInUSD={prod.price} />
                        </span>
                      </div>
                      <Link
                        href={prod.categoryId?.slug ? `/store/${prod.categoryId.slug}?productId=${prod._id.toString()}` : `/store?productId=${prod._id.toString()}`}
                        className="h-7 px-3 inline-flex items-center bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concluded Auctions Grid */}
          {concludedAuctions.length > 0 && (tab === "CONCLUDED" || tab === "ALL") && (
            <div className="space-y-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500">
                <Archive className="h-4 w-4" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Concluded Auctions ({concludedAuctions.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {concludedAuctions.map(renderAuctionCard)}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
