"use client";

import { useEffect, useState } from "react";
import { useSocket, BidHistoryItem } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { 
  AlertCircle, 
  Clock, 
  Gavel, 
  ShieldCheck, 
  Trophy, 
  Sparkles, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Share2,
  Check,
  Headset,
  Coins,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RegisterAuctionButton } from "@/features/payments/components/register-button";

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
      screenshots?: string[];
      stardust?: number;
      xp?: number;
      pokedexCompleted?: number;
      bestBuddyCount?: number;
      pokeCoins?: number;
      startDate?: string;
      accountType?: string;
      accountStatus?: string;
      weeklyDistance?: number;
      topPokemon?: string;
      rareCandy?: number;
      fastTm?: number;
      chargedTm?: number;
      eliteFastTm?: number;
      eliteChargedTm?: number;
      incubators?: number;
      luckyEggs?: number;
      lureModules?: number;
      premiumRaidPass?: number;
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
    highestBidderName,
    isRegistered,
    bidHistory,
    error,
    placeBid,
    setError,
    setBidHistory,
    setCurrentBid,
    setHighestBidderId,
    setIsRegistered,
  } = useSocket(auction._id);

  const [timeLeft, setTimeLeft] = useState("Loading timer...");
  const [customBidAmount, setCustomBidAmount] = useState("");
  const [isConcluded, setIsConcluded] = useState(false);
  
  // Gallery controls
  const screenshots = auction.listingId.screenshots && auction.listingId.screenshots.length > 0
    ? auction.listingId.screenshots
    : [
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1613771404724-11d595413b6b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=800&auto=format&fit=crop&q=80",
      ];
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Tabs controls
  const [activeTab, setActiveTab] = useState<"overview" | "highlights" | "details" | "terms" | "reviews">("overview");

  // FAQs Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        setIsConcluded(true);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const daysStr = days > 0 ? `${days}d : ` : "";
        const hoursStr = String(hours).padStart(2, '0');
        const minsStr = String(minutes).padStart(2, '0');
        const secsStr = String(seconds).padStart(2, '0');
        
        setTimeLeft(`${daysStr}${hoursStr}h : ${minsStr}m : ${secsStr}s`);
        setIsConcluded(false);
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

  const nextImage = () => {
    setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  // Team badges mapping
  const teamColors = {
    MYSTIC: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    VALOR: "bg-red-500/10 text-red-400 border-red-500/20",
    INSTINCT: "bg-zinc-800 text-zinc-300 border-zinc-700",
    NONE: "bg-muted text-muted-foreground border-border",
  };

  // Parse Pokémon highlights dynamically from the topPokemon string input
  const rawHighlights = auction.listingId.topPokemon
    ? auction.listingId.topPokemon.split(",").map(item => item.trim()).filter(Boolean)
    : [];

  const pokemonHighlights = rawHighlights.map((item, idx) => {
    const match = item.match(/^([^(]+)(?:\(([^)]+)\))?$/);
    const name = match ? match[1].trim() : item;
    const cp = match && match[2] ? match[2].trim() : "";
    const mockThumbnails = [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1613771404724-11d595413b6b?w=300&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=300&auto=format&fit=crop&q=80",
    ];
    return {
      name,
      cp,
      img: mockThumbnails[idx % mockThumbnails.length]
    };
  });

  return (
    <div className="min-h-screen bg-[#08080a] text-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
          <span className="hover:text-white cursor-pointer transition-colors">Home</span>
          <span>&gt;</span>
          <span className="hover:text-white cursor-pointer transition-colors">Auctions</span>
          <span>&gt;</span>
          <span className="hover:text-white cursor-pointer transition-colors">Pokémon GO Accounts</span>
          <span>&gt;</span>
          <span className="text-zinc-200 font-medium truncate max-w-[200px] sm:max-w-none">{auction.listingId.title}</span>
        </div>

        {/* Real-time connection status overlay/banner */}
        <div>
          {!isConnected ? (
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-zinc-300">
              <AlertCircle className="h-4 w-4 animate-pulse text-zinc-400" />
              Connecting to real-time bidding engine... Live updates paused.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Secure live WebSocket gateway active.
            </div>
          )}
        </div>

        {/* Desktop Title & Details Section (Grid: Left 2 cols, Right 1 col) */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* LEFT CONTAINER (Gallery, Info Tabs, Details lists) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Gallery module */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-md p-4 sm:p-6 space-y-4">
              
              {/* Main Viewer */}
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/40 border border-zinc-800 flex items-center justify-center group">
                
                {/* Team Tag Overlay */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className="bg-[#6133e1] text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow-lg">
                    Legendary Account
                  </span>
                  <span className={cn("text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow-lg border", teamColors[auction.listingId.team])}>
                    {auction.listingId.team}
                  </span>
                </div>

                {/* Main Display Image */}
                <img 
                  src={screenshots[activeImgIndex]} 
                  alt="Account preview screenshot" 
                  className="w-full h-full object-contain"
                />

                {/* Left/Right Controls */}
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Thumbnails Row */}
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                {screenshots.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={cn(
                      "relative h-16 w-20 rounded-lg overflow-hidden border bg-zinc-900 shrink-0 transition-all",
                      activeImgIndex === idx ? "border-[#6133e1] ring-2 ring-[#6133e1]/50" : "border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
                {screenshots.length > 4 && (
                  <div className="h-16 w-20 rounded-lg border border-zinc-800 bg-[#0d0d12] flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                    +{screenshots.length - 4}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Guarantees/Trust Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">100% Safe</h4>
                  <p className="text-[9px] text-zinc-400">Secure escrow systems</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <Award className="h-5 w-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Instant Delivery</h4>
                  <p className="text-[9px] text-zinc-400">Receive credentials instantly</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <Coins className="h-5 w-5 text-sky-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Verified Account</h4>
                  <p className="text-[9px] text-zinc-400">Checked by team admin</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3">
                <Headset className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">24/7 Help</h4>
                  <p className="text-[9px] text-zinc-400">Continuous technical support</p>
                </div>
              </div>
            </div>

            {/* Detailed Description, Grid Statistics & Info Tabs */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-md overflow-hidden">
              
              {/* Tab Selector Header */}
              <div className="flex border-b border-zinc-800 overflow-x-auto bg-black/20">
                {(["overview", "highlights", "details", "terms"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer",
                      activeTab === tab 
                        ? "border-[#6133e1] text-white bg-[#6133e1]/5" 
                        : "border-transparent text-zinc-400 hover:text-white"
                    )}
                  >
                    {tab === "overview" && "Overview"}
                    {tab === "highlights" && "Pokémon Highlights"}
                    {tab === "details" && "Account Details"}
                    {tab === "terms" && "Terms & Conditions"}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">About This Account</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed font-light">
                        {auction.listingId.description}
                      </p>
                    </div>

                    {/* Detailed Specifications Checklist */}
                    <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs">
                      {[
                        `Trainer Level ${auction.listingId.level}`,
                        `Team Alignment: ${auction.listingId.team}`,
                        `Shiny Variant Pokémon: ${auction.listingId.shinyCount}`,
                        `Legendary Pokémon: ${auction.listingId.legendaryCount}`,
                        `Mythical Pokémon: ${auction.listingId.mythicalCount}`,
                        `Best Buddy Pokémon: ${auction.listingId.bestBuddyCount || 0}`,
                        `Stardust Balance: ${(auction.listingId.stardust || 0).toLocaleString()}`,
                        `Account Region: ${auction.listingId.region}`,
                        `Start Date: ${auction.listingId.startDate || "N/A"}`
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-zinc-300">
                          <Check className="h-4 w-4 text-[#6133e1] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Security Notice Warning Box */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex items-start gap-3">
                      <AlertTriangle className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-white uppercase tracking-wider text-[10px]">Important Security Coordinates:</strong>
                        <p className="mt-1 leading-relaxed">
                          We handle full email integration transfers. Credential coordinates (passwords/associated codes) are fully changed during secure trade procedures to guarantee permanent account lock protection.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "highlights" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Top Legendary Highlights</h3>
                      <span className="text-[10px] text-zinc-500 hover:text-white cursor-pointer underline">View All</span>
                    </div>

                    {/* Highlight Pokémon Cards Grid */}
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                      {pokemonHighlights.map((pk, idx) => (
                        <div key={idx} className="rounded-xl border border-zinc-800 bg-black/40 p-3 space-y-3 flex flex-col items-center justify-between text-center relative group">
                          {/* 100% IV Badge */}
                          <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[8px] font-bold text-white flex items-center gap-1 border border-zinc-800">
                            <Sparkles className="h-2.5 w-2.5 text-purple-400 fill-purple-400" />
                            <span>100% IV</span>
                          </div>
                          
                          <div className="h-20 w-20 flex items-center justify-center mt-2">
                            <img src={pk.img} alt={pk.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white">{pk.name}</h4>
                            <span className="text-[10px] text-zinc-400 font-bold">{pk.cp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-8">
                    {/* Specifications detail grids */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Account Attributes</h3>
                      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-xs">
                        {[
                          { label: "Trainer Level", value: `${auction.listingId.level}` },
                          { label: "Faction Team", value: `${auction.listingId.team}` },
                          { label: "Pokédex Completed", value: `${auction.listingId.pokedexCompleted || 0}%` },
                          { label: "Shiny Pokémon", value: `${auction.listingId.shinyCount}` },
                          { label: "Legendary Pokémon", value: `${auction.listingId.legendaryCount}` },
                          { label: "Mythical Pokémon", value: `${auction.listingId.mythicalCount}` },
                          { label: "Best Buddy Count", value: `${auction.listingId.bestBuddyCount || 0}` },
                          { label: "Stardust Balance", value: `${(auction.listingId.stardust || 0).toLocaleString()}` },
                          { label: "Total XP Balance", value: `${(auction.listingId.xp || 0).toLocaleString()}` },
                          { label: "PokéCoins", value: `${(auction.listingId.pokeCoins || 0).toLocaleString()}` },
                          { label: "Account Status", value: `${auction.listingId.accountStatus || "Safe (No Strikes)"}` },
                          { label: "Account Type", value: `${auction.listingId.accountType || "Google"}` },
                          { label: "Start Date", value: `${auction.listingId.startDate || "N/A"}` },
                          { label: "Account Region", value: `${auction.listingId.region}` }
                        ].map((row, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b border-zinc-800/60">
                            <span className="text-zinc-400">{row.label}</span>
                            <span className="font-semibold text-white">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resources section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Items & Resources inventory</h3>
                      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-xs">
                        {[
                          { label: "Rare Candy", value: `${auction.listingId.rareCandy || 0}` },
                          { label: "Fast TM", value: `${auction.listingId.fastTm || 0}` },
                          { label: "Charged TM", value: `${auction.listingId.chargedTm || 0}` },
                          { label: "Elite Fast TM", value: `${auction.listingId.eliteFastTm || 0}` },
                          { label: "Elite Charged TM", value: `${auction.listingId.eliteChargedTm || 0}` },
                          { label: "Incubators", value: `${auction.listingId.incubators || 0}` },
                          { label: "Lucky Eggs", value: `${auction.listingId.luckyEggs || 0}` },
                          { label: "Lure Modules", value: `${auction.listingId.lureModules || 0}` },
                          { label: "Premium Raid Pass", value: `${auction.listingId.premiumRaidPass || 0}` }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b border-zinc-800/60">
                            <span className="text-zinc-400">{item.label}</span>
                            <span className="font-semibold text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "terms" && (
                  <div className="space-y-6 text-xs text-zinc-300 leading-relaxed font-light">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Account Handover Terms</h4>
                      <p>
                        We guarantee a secure transfer pipeline. Upon auction finalization, our system admins check the account credentials, link a secure email coordinates list matching your requests, and deliver details within minutes.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Refund Policy</h4>
                      <p>
                        A 7-Day Money Back Guarantee protects you from discrepancies. If the account characteristics do not match the statistics listed on the catalog cards, you are eligible for immediate complete refunds.
                      </p>
                    </div>
                  </div>
                )}



              </div>
            </div>

            {/* Accordion FAQs Panel */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-md p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-zinc-500" />
                Frequently Asked Questions
              </h3>
              
              <div className="space-y-2">
                {[
                  { q: "Will I get full access to the account?", a: "Yes. You will receive complete credentials including access keys to the linked Google/PTC account coordinates, allowing you to change passwords instantly." },
                  { q: "Is the account safe from bans?", a: "Absolutely. All listings undergo authentication review by administrators to ensure they are clean, have no active warnings or strikes, and align with global safe play parameters." },
                  { q: "How will I receive the account details?", a: "Admins automate the delivery. You will receive a secure system notification (and Telegram coordination details) as soon as deposit and purchase balances are finalized." },
                  { q: "Can I change the email and password?", a: "Yes. Changing email links is a mandatory step in our secure onboarding handbook to ensure that you are the sole controller of the account asset." }
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-zinc-800/80 pb-2">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between py-2.5 text-left text-xs font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <span>{openFaq === idx ? "−" : "+"}</span>
                    </button>
                    {openFaq === idx && (
                      <p className="text-[11px] text-zinc-400 pb-3 leading-relaxed font-light">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Assurance Block */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                <ShieldAlert className="h-10 w-10 text-[#6133e1] shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Bid With Complete Confidence</h4>
                  <p className="text-xs text-zinc-400">Your payments are fully protected under our 7-Day Money Back Guarantee structure.</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest border border-zinc-700 bg-zinc-900 px-4 py-2 rounded-lg">
                Safe Trade Seal
              </span>
            </div>

          </div>

          {/* RIGHT CONTAINER: Floating Bidding Action Panel & Metadata details */}
          <div className="space-y-6">
            
            {/* Header Title Metadata Info Panel */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-md p-6 space-y-4">
              <span className="bg-[#6133e1]/10 text-[#6133e1] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-[#6133e1]/20">
                Premium Grade Asset
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {auction.listingId.title}
              </h2>
              
              {/* Actions Row (Watch & Share) */}
              <div className="flex items-center justify-end text-xs pb-3 border-b border-zinc-800">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer text-[10px]">
                    <Heart className="h-3.5 w-3.5" />
                    Watch
                  </button>
                  <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer text-[10px]">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </div>

              {/* Statistical Grid summary */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 uppercase">Level</div>
                  <div className="font-extrabold text-white mt-0.5">{auction.listingId.level}</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 uppercase">Team</div>
                  <div className="font-extrabold text-white mt-0.5 truncate">{auction.listingId.team}</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 uppercase">Shiny</div>
                  <div className="font-extrabold text-white mt-0.5">{auction.listingId.shinyCount}✨</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 uppercase">Legendary</div>
                  <div className="font-extrabold text-white mt-0.5">{auction.listingId.legendaryCount}🏆</div>
                </div>
              </div>
            </div>

            {/* Bidding Control Panel */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 backdrop-blur-md p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-[#6133e1]/10 blur-xl pointer-events-none" />

              {/* Countdown Ends In */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Auction Ends In
                </span>
                <span className="text-[10px] text-red-400 font-extrabold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">
                  {timeLeft}
                </span>
              </div>

              {/* Bid Values */}
              <div className="space-y-1 text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Current Bid</span>
                <h3 className="text-4xl font-black text-white tracking-tight">
                  ₹{activeBid.toLocaleString()}
                </h3>
                
                {highestBidderId === session?.user?.id ? (
                  <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-[9px] text-emerald-400 font-bold border border-emerald-500/20 mt-1 uppercase tracking-wider">
                    <ShieldCheck className="h-3 w-3" /> You are highest bidder
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-0.5 text-[9px] text-zinc-400 font-bold border border-zinc-700 mt-1 uppercase tracking-wider">
                    Outbid / No active bids
                  </div>
                )}
              </div>

              {/* Counters Info */}
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-zinc-800/80 text-center text-xs">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase">Total Bids</span>
                  <div className="font-bold text-white mt-0.5">{bidHistory.length}</div>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase">Watchers</span>
                  <div className="font-bold text-white mt-0.5">32</div>
                </div>
              </div>

              {/* Bidding Controls Form */}
              <div className="space-y-3">
                {error && (
                  <div className="flex items-start gap-1.5 rounded bg-red-500/10 p-2.5 text-[10px] text-red-400 border border-red-500/20 leading-relaxed">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {isConcluded ? (
                  highestBidderName ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center space-y-3">
                      <Trophy className="h-8 w-8 text-[#6133e1] mx-auto animate-bounce" />
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Winner Announced!</h4>
                        <p className="text-[11px] text-zinc-300 font-light leading-snug">
                          Congratulations to <strong className="font-bold text-white">{highestBidderName}</strong> for winning this auction with a final bid of <strong className="font-bold text-white">₹{activeBid.toLocaleString()}</strong>!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center space-y-2">
                      <AlertCircle className="h-6 w-6 text-zinc-500 mx-auto" />
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Concluded</h4>
                      <p className="text-[11px] text-zinc-500">This auction expired with no bids.</p>
                    </div>
                  )
                ) : !isRegistered ? (
                  <div className="space-y-3">
                    <div className="rounded bg-zinc-900 border border-zinc-800 p-3 text-[11px] leading-relaxed text-zinc-400 font-light">
                      A refundable verification deposit of ₹199 is required to participate in bidding.
                    </div>
                    <RegisterAuctionButton auctionId={auction._id} onSuccess={() => setIsRegistered(true)} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest text-center font-bold">
                      Minimum Next Bid: <span className="text-white">₹{nextMinBid.toLocaleString()}</span>
                    </div>

                    {/* Quick Preset Button */}
                    <button
                      onClick={() => handlePlaceBid(nextMinBid)}
                      disabled={!isConnected}
                      className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6133e1] hover:bg-[#6133e1]/95 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#6133e1]/10"
                    >
                      <Gavel className="h-4 w-4" />
                      PLACE BID
                    </button>

                    {/* Divider */}
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-zinc-800"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Or enter custom bid</span>
                      <div className="flex-grow border-t border-zinc-800"></div>
                    </div>

                    {/* Custom Input */}
                    <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                      <div className="relative flex-grow">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">₹</span>
                        <input
                          type="number"
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value)}
                          placeholder={nextMinBid.toString()}
                          className="w-full h-10 pl-6 pr-3 bg-black/40 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#6133e1] transition-colors"
                          disabled={!isConnected}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!isConnected}
                        className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs text-white font-bold transition-all cursor-pointer"
                      >
                        Place
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Buy Now Option */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Buy Now price</h4>
                  <p className="text-[10px] text-zinc-500">Skip the live bidding process</p>
                </div>
                <button className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-[#6133e1] text-white text-xs font-bold flex items-center gap-2 transition-all border border-zinc-800 hover:border-[#6133e1] cursor-pointer">
                  <span>BUY NOW</span>
                  <span className="text-[10px] text-zinc-400 font-bold border-l border-zinc-700/60 pl-2">₹{(auction.listingId.startingBid * 4).toLocaleString()}</span>
                </button>
              </div>
            </div>



            {/* Delivery Specifications & Payment details */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 p-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shipping & Handover details</h4>
              <div className="space-y-3 text-xs text-zinc-300 font-light">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Instant Delivery via admin transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Full access changeable email coordinates</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Supported Payments</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["PayPal", "Visa", "Mastercard", "UPI"].map((pm, idx) => (
                    <span key={idx} className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-medium text-zinc-400">
                      {pm}
                    </span>
                  ))}
                  <span className="text-[9px] text-zinc-600 mt-1">and more...</span>
                </div>
              </div>
            </div>

            {/* Support contact panel */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 p-6 text-center space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Have Questions?</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Our technical trade team coordinates are available 24/7.</p>
              <button className="w-full h-10 rounded-xl bg-[#6133e1] hover:bg-[#6133e1]/90 text-xs font-bold text-white transition-all cursor-pointer">
                Contact Support Coordinates
              </button>
            </div>

            {/* Ledger Bids list */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12]/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-zinc-500" />
                  Recent Live Bids
                </h3>
                <span className="text-[9px] text-zinc-500 hover:text-white cursor-pointer underline">View All</span>
              </div>

              <div className="space-y-2">
                {bidHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2 text-center">No bids recorded yet.</p>
                ) : (
                  bidHistory.slice(0, 5).map((bid, idx) => (
                    <div key={bid._id} className="flex justify-between items-center py-2 border-b border-zinc-800/40 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">{bid.bidderName}</span>
                        <div className="text-[9px] text-zinc-500">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="font-bold text-white">₹{bid.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
