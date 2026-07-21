"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSocket, BidHistoryItem } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFreshBalance } from "@/features/auth/actions";
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
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Award,
  Loader2,
  Play,
  Trash2,
  X,
  ScanQrCode,
  CreditCard,
  Coins,
  DollarSign,
  Globe,
  CircleDot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RegisterAuctionButton } from "@/features/payments/components/register-button";
import { fetchAllAuctionBids, createBuyNowOrderAction, createAuctionWinnerOrderAction, checkAuctionPaymentStatus } from "@/features/auctions/actions";
import { pauseAuction, resumeAuction, forceEndAuction, updateAuction, deleteAuction, reactivateAuction } from "@/features/admin/actions";
import { PriceDisplay } from "@/components/price-display";
import { useCurrencyStore, Currency } from "@/store/useCurrencyStore";
import { UpiPaymentCheckout } from "@/features/payments/components/upi-checkout";
import { PayPalPaymentCheckout } from "@/features/payments/components/paypal-checkout";
import { CryptoPaymentCheckout } from "@/features/payments/components/crypto-checkout";
import { WisePaymentCheckout } from "@/features/payments/components/wise-checkout";
import { AnimatedCardIcon, AnimatedCryptoIcon, PaypalIcon, WiseIcon } from "@/components/ui/animated-payment-icons";
import { sendChatWebhookNotification } from "@/features/chat/actions";

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
      reservePrice?: number;
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
      premiumRaidPass: number;
      sellerId?: string;

      // New Stats & Telemetry Fields
      platinumMedals?: number;
      legendaryPoses?: number;
      shinyPokemons?: number;
      shinyMythical?: number;
      shinyUltrabeasts?: number;
      shinyLegendaries?: number;
      legendaryPokemons?: number;
      ultrabeasts?: number;
      mythicalPokemons?: number;
      hundoMythicalLegendaryUltrabeast?: number;
      shundoLegendaryMythicalUltrabeast?: number;
      shundoPokemons?: number;
      hundoPokemons?: number;
      costumeShinies?: number;
      hatchedShinies?: number;
      luckyPokemons?: number;
      luckyLegendaries?: number;
      shinyLuckyLegendaries?: number;
      locationBackgroundLegendaryShiny?: number;
      specialBackgroundLegendaryShiny?: number;
      candyXlPokemons?: number;
      candyXlLegendaries?: number;
      bestBuddies?: number;
      dualMovePokemons?: number;
      shadowShinyPokemons?: number;
      pokemonStorage?: number;
      itemBagStorage?: number;
      masterBalls?: number;
      raidPasses?: number;
      superRocketRadar?: number;
      pokedexRegisteredNumber?: number;
      bansCount?: number;
    };
    currentHighestBid: number;
    highestBidderId?: any;
    highestBidderName?: string | null;
    endTime: string;
    status: string;
    registrationFee?: number;
    viewers?: number;
  };
  initialBids?: BidHistoryItem[];
  initialIsRegistered?: boolean;
  session?: any;
}

export function LiveRoom({
  auction,
  initialBids = [],
  initialIsRegistered = false,
  session: propSession,
}: LiveRoomProps) {
  const { data: clientSession, status: sessionStatus } = useSession();
  const session = clientSession || propSession;
  const router = useRouter();
  const isOwner = session?.user?.id && auction.listingId.sellerId && String(session.user.id) === String(auction.listingId.sellerId);
  const { convert } = useCurrencyStore();
  const {
    isConnected,
    currentBid,
    highestBidderId,
    highestBidderName,
    isRegistered,
    status,
    setStatus,
    endTime,
    setEndTime,
    bidHistory,
    hasPendingBuyNow,
    error,
    placeBid,
    setError,
    setBidHistory,
    setCurrentBid,
    setHighestBidderId,
    setIsRegistered,
  } = useSocket(auction._id, initialIsRegistered, auction.status, auction.endTime, auction.highestBidderName);

  const [timeLeft, setTimeLeft] = useState("Loading timer...");
  const [isConcluded, setIsConcluded] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<"bid" | "details" | "help">("bid");
  const [isBidding, setIsBidding] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [fullBidHistory, setFullBidHistory] = useState<BidHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [upiCheckoutData, setUpiCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [paypalCheckoutData, setPaypalCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [cryptoCheckoutData, setCryptoCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [wiseCheckoutData, setWiseCheckoutData] = useState<{ orderId: string; amount: number; currency: Currency; email: string } | null>(null);
  const [paymentStage, setPaymentStage] = useState<"methods" | "platforms" | "upi" | "paypal" | "crypto" | "wise">("methods");
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "Card" | "Crypto" | "PayPal" | "Wise" | "Others" | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [freshBalance, setFreshBalance] = useState<number>(0);
  const [isAuctionPaid, setIsAuctionPaid] = useState(false);
  
  useEffect(() => {
    if (session?.user?.id) {
      getFreshBalance().then(bal => setFreshBalance(bal));
    }
  }, [session]);

  useEffect(() => {
    if (isConcluded) {
      checkAuctionPaymentStatus(auction._id).then(res => {
        if (res.success && res.isPaid) {
          setIsAuctionPaid(true);
        }
      });
    }
  }, [isConcluded, auction._id]);

  const walletCreditAmount = freshBalance;
  const hasWalletCredit = walletCreditAmount > 0;

  // Winner payment modal state
  const [isWinnerPaymentOpen, setIsWinnerPaymentOpen] = useState(false);
  const [winnerPaymentStage, setWinnerPaymentStage] = useState<"methods" | "upi" | "paypal" | "crypto" | "wise">("methods");
  const [winnerUpiCheckoutData, setWinnerUpiCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [winnerPaypalCheckoutData, setWinnerPaypalCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [winnerCryptoCheckoutData, setWinnerCryptoCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [winnerWiseCheckoutData, setWinnerWiseCheckoutData] = useState<{ orderId: string; amount: number; currency: Currency; email: string } | null>(null);
  const [winnerLoadingMethod, setWinnerLoadingMethod] = useState<string | null>(null);

  // Admin Controls states
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isCreatorAdmin = session?.user?.role === "ADMIN" && session?.user?.id && auction.listingId.sellerId && String(session.user.id) === String(auction.listingId.sellerId);
  const isAuthorizedAdmin = isSuperAdmin || isCreatorAdmin;

  useEffect(() => {
    console.log("[LiveRoom Debug] session user:", session?.user);
    console.log("[LiveRoom Debug] sellerId:", auction.listingId.sellerId);
    console.log("[LiveRoom Debug] isAuthorizedAdmin:", {
      role: session?.user?.role,
      userId: session?.user?.id,
      sellerId: auction.listingId.sellerId,
      isSuperAdmin,
      isCreatorAdmin,
      isAuthorizedAdmin
    });
  }, [session, auction.listingId.sellerId, isSuperAdmin, isCreatorAdmin, isAuthorizedAdmin]);

  const [isAdminEditOpen, setIsAdminEditOpen] = useState(false);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  const [adminEditForm, setAdminEditForm] = useState({
    title: auction.listingId.title,
    description: auction.listingId.description,
    level: auction.listingId.level,
    team: auction.listingId.team,
    shinyCount: auction.listingId.shinyCount,
    legendaryCount: auction.listingId.legendaryCount,
    mythicalCount: auction.listingId.mythicalCount,
    region: auction.listingId.region,
    startingBid: auction.listingId.startingBid,
    reservePrice: auction.listingId.reservePrice,
    minIncrement: auction.listingId.minIncrement,
    stardust: auction.listingId.stardust || 0,
    xp: auction.listingId.xp || 0,
    pokedexCompleted: auction.listingId.pokedexCompleted || 0,
    bestBuddyCount: auction.listingId.bestBuddyCount || 0,
    pokeCoins: auction.listingId.pokeCoins || 0,
    startDate: auction.listingId.startDate || "",
    accountType: auction.listingId.accountType || "",
    accountStatus: auction.listingId.accountStatus || "",
    weeklyDistance: auction.listingId.weeklyDistance || 0,
    topPokemon: auction.listingId.topPokemon || "",
    rareCandy: auction.listingId.rareCandy || 0,
    fastTm: auction.listingId.fastTm || 0,
    chargedTm: auction.listingId.chargedTm || 0,
    eliteFastTm: auction.listingId.eliteFastTm || 0,
    eliteChargedTm: auction.listingId.eliteChargedTm || 0,
    incubators: auction.listingId.incubators || 0,
    luckyEggs: auction.listingId.luckyEggs || 0,
    lureModules: auction.listingId.lureModules || 0,
    premiumRaidPass: auction.listingId.premiumRaidPass || 0,
    endTime: auction.endTime,
    registrationFee: auction.registrationFee || 199,

    // New stats fields
    platinumMedals: (auction.listingId as any).platinumMedals || 0,
    legendaryPoses: (auction.listingId as any).legendaryPoses || 0,
    shinyPokemons: (auction.listingId as any).shinyPokemons || 0,
    shinyMythical: (auction.listingId as any).shinyMythical || 0,
    shinyUltrabeasts: (auction.listingId as any).shinyUltrabeasts || 0,
    shinyLegendaries: (auction.listingId as any).shinyLegendaries || 0,
    legendaryPokemons: (auction.listingId as any).legendaryPokemons || 0,
    ultrabeasts: (auction.listingId as any).ultrabeasts || 0,
    mythicalPokemons: (auction.listingId as any).mythicalPokemons || 0,
    hundoMythicalLegendaryUltrabeast: (auction.listingId as any).hundoMythicalLegendaryUltrabeast || 0,
    shundoLegendaryMythicalUltrabeast: (auction.listingId as any).shundoLegendaryMythicalUltrabeast || 0,
    shundoPokemons: (auction.listingId as any).shundoPokemons || 0,
    hundoPokemons: (auction.listingId as any).hundoPokemons || 0,
    costumeShinies: (auction.listingId as any).costumeShinies || 0,
    hatchedShinies: (auction.listingId as any).hatchedShinies || 0,
    luckyPokemons: (auction.listingId as any).luckyPokemons || 0,
    luckyLegendaries: (auction.listingId as any).luckyLegendaries || 0,
    shinyLuckyLegendaries: (auction.listingId as any).shinyLuckyLegendaries || 0,
    locationBackgroundLegendaryShiny: (auction.listingId as any).locationBackgroundLegendaryShiny || 0,
    specialBackgroundLegendaryShiny: (auction.listingId as any).specialBackgroundLegendaryShiny || 0,
    candyXlPokemons: (auction.listingId as any).candyXlPokemons || 0,
    candyXlLegendaries: (auction.listingId as any).candyXlLegendaries || 0,
    bestBuddies: (auction.listingId as any).bestBuddies || 0,
    dualMovePokemons: (auction.listingId as any).dualMovePokemons || 0,
    shadowShinyPokemons: (auction.listingId as any).shadowShinyPokemons || 0,
    pokemonStorage: (auction.listingId as any).pokemonStorage || 0,
    itemBagStorage: (auction.listingId as any).itemBagStorage || 0,
    masterBalls: (auction.listingId as any).masterBalls || 0,
    raidPasses: (auction.listingId as any).raidPasses || 0,
    superRocketRadar: (auction.listingId as any).superRocketRadar || 0,
    pokedexRegisteredNumber: (auction.listingId as any).pokedexRegisteredNumber || 0,
    bansCount: (auction.listingId as any).bansCount || 0,
  });

  useEffect(() => {
    if (isAdminEditOpen) {
      setAdminEditForm({
        title: auction.listingId.title,
        description: auction.listingId.description,
        level: auction.listingId.level,
        team: auction.listingId.team,
        shinyCount: auction.listingId.shinyCount,
        legendaryCount: auction.listingId.legendaryCount,
        mythicalCount: auction.listingId.mythicalCount,
        region: auction.listingId.region,
        startingBid: auction.listingId.startingBid,
        reservePrice: auction.listingId.reservePrice,
        minIncrement: auction.listingId.minIncrement,
        stardust: auction.listingId.stardust || 0,
        xp: auction.listingId.xp || 0,
        pokedexCompleted: auction.listingId.pokedexCompleted || 0,
        bestBuddyCount: auction.listingId.bestBuddyCount || 0,
        pokeCoins: auction.listingId.pokeCoins || 0,
        startDate: auction.listingId.startDate || "",
        accountType: auction.listingId.accountType || "",
        accountStatus: auction.listingId.accountStatus || "",
        weeklyDistance: auction.listingId.weeklyDistance || 0,
        topPokemon: auction.listingId.topPokemon || "",
        rareCandy: auction.listingId.rareCandy || 0,
        fastTm: auction.listingId.fastTm || 0,
        chargedTm: auction.listingId.chargedTm || 0,
        eliteFastTm: auction.listingId.eliteFastTm || 0,
        eliteChargedTm: auction.listingId.eliteChargedTm || 0,
        incubators: auction.listingId.incubators || 0,
        luckyEggs: auction.listingId.luckyEggs || 0,
        lureModules: auction.listingId.lureModules || 0,
        premiumRaidPass: auction.listingId.premiumRaidPass || 0,
        endTime: auction.endTime,
        registrationFee: auction.registrationFee || 199,

        // New stats fields
        platinumMedals: (auction.listingId as any).platinumMedals || 0,
        legendaryPoses: (auction.listingId as any).legendaryPoses || 0,
        shinyPokemons: (auction.listingId as any).shinyPokemons || 0,
        shinyMythical: (auction.listingId as any).shinyMythical || 0,
        shinyUltrabeasts: (auction.listingId as any).shinyUltrabeasts || 0,
        shinyLegendaries: (auction.listingId as any).shinyLegendaries || 0,
        legendaryPokemons: (auction.listingId as any).legendaryPokemons || 0,
        ultrabeasts: (auction.listingId as any).ultrabeasts || 0,
        mythicalPokemons: (auction.listingId as any).mythicalPokemons || 0,
        hundoMythicalLegendaryUltrabeast: (auction.listingId as any).hundoMythicalLegendaryUltrabeast || 0,
        shundoLegendaryMythicalUltrabeast: (auction.listingId as any).shundoLegendaryMythicalUltrabeast || 0,
        shundoPokemons: (auction.listingId as any).shundoPokemons || 0,
        hundoPokemons: (auction.listingId as any).hundoPokemons || 0,
        costumeShinies: (auction.listingId as any).costumeShinies || 0,
        hatchedShinies: (auction.listingId as any).hatchedShinies || 0,
        luckyPokemons: (auction.listingId as any).luckyPokemons || 0,
        luckyLegendaries: (auction.listingId as any).luckyLegendaries || 0,
        shinyLuckyLegendaries: (auction.listingId as any).shinyLuckyLegendaries || 0,
        locationBackgroundLegendaryShiny: (auction.listingId as any).locationBackgroundLegendaryShiny || 0,
        specialBackgroundLegendaryShiny: (auction.listingId as any).specialBackgroundLegendaryShiny || 0,
        candyXlPokemons: (auction.listingId as any).candyXlPokemons || 0,
        candyXlLegendaries: (auction.listingId as any).candyXlLegendaries || 0,
        bestBuddies: (auction.listingId as any).bestBuddies || 0,
        dualMovePokemons: (auction.listingId as any).dualMovePokemons || 0,
        shadowShinyPokemons: (auction.listingId as any).shadowShinyPokemons || 0,
        pokemonStorage: (auction.listingId as any).pokemonStorage || 0,
        itemBagStorage: (auction.listingId as any).itemBagStorage || 0,
        masterBalls: (auction.listingId as any).masterBalls || 0,
        raidPasses: (auction.listingId as any).raidPasses || 0,
        superRocketRadar: (auction.listingId as any).superRocketRadar || 0,
        pokedexRegisteredNumber: (auction.listingId as any).pokedexRegisteredNumber || 0,
        bansCount: (auction.listingId as any).bansCount || 0,
      });
    }
  }, [isAdminEditOpen, auction]);

  const handleSaveAdminEdit = async () => {
    setIsAdminActionLoading(true);
    setAdminActionError(null);
    const res = await updateAuction(auction._id, adminEditForm);
    if (res.success) {
      setIsAdminEditOpen(false);
      if (adminEditForm.endTime) {
        setEndTime(new Date(adminEditForm.endTime).toISOString());
      }
      router.refresh();
    } else {
      setAdminActionError(res.error || "Failed to update auction details.");
    }
    setIsAdminActionLoading(false);
  };

  const renderAdminControlPanel = () => {
    if (!isAuthorizedAdmin) return null;

    return (
      <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/55 dark:bg-violet-600/5 backdrop-blur-md p-5 space-y-4 shadow-md relative overflow-hidden animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-violet-200 dark:border-violet-500/20 pb-3">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
            <ShieldAlert className="h-4.5 w-4.5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Admin Control Panel
            </span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-450/20">
            {isSuperAdmin ? "SUPER ADMIN" : "OWNER ADMIN"}
          </span>
        </div>

        {adminActionError && (
          <div className="text-[10px] text-red-500 bg-red-500/10 p-2.5 rounded border border-red-500/20 leading-relaxed">
            {adminActionError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Pause / Resume Button */}
          {status === "PAUSED" ? (
            <button
              onClick={async () => {
                setIsAdminActionLoading(true);
                setAdminActionError(null);
                const res = await resumeAuction(auction._id);
                if (res.success) {
                  setStatus("LIVE");
                } else {
                  setAdminActionError(res.error || "Failed to resume auction.");
                }
                setIsAdminActionLoading(false);
              }}
              disabled={isAdminActionLoading}
              className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Resume Bidding
            </button>
          ) : (
            <button
              onClick={async () => {
                setIsAdminActionLoading(true);
                setAdminActionError(null);
                const res = await pauseAuction(auction._id);
                if (res.success) {
                  setStatus("PAUSED");
                } else {
                  setAdminActionError(res.error || "Failed to pause auction.");
                }
                setIsAdminActionLoading(false);
              }}
              disabled={isAdminActionLoading || status === "COMPLETED"}
              className="h-10 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <AlertCircle className="h-4 w-4" />
              Pause Bidding
            </button>
          )}

          {/* End Auction Button */}
          <button
            onClick={async () => {
              if (!confirm("Are you sure you want to end this auction immediately?")) return;
              setIsAdminActionLoading(true);
              setAdminActionError(null);
              const res = await forceEndAuction(auction._id);
              if (res.success) {
                setStatus("COMPLETED");
                setIsConcluded(true);
              } else {
                setAdminActionError(res.error || "Failed to end auction.");
              }
              setIsAdminActionLoading(false);
            }}
            disabled={isAdminActionLoading || status === "COMPLETED"}
            className="h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Trophy className="h-4 w-4" />
            End Auction
          </button>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setIsAdminEditOpen(true)}
          disabled={isAdminActionLoading}
          className="w-full h-10 rounded-xl border border-violet-200 dark:border-violet-500/30 hover:border-violet-300 dark:hover:border-violet-500/50 bg-violet-50 dark:bg-violet-600/10 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-600/20 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
        >
          <Gavel className="h-4 w-4" />
          Edit Auction Details
        </button>

        {/* Reactivate Auction Button (SUPER_ADMIN only, shown when auction is completed/expired) */}
        {isSuperAdmin && status === "COMPLETED" && (
          <button
            onClick={async () => {
              const hoursStr = prompt("Enter duration in hours to extend the auction (e.g. 24):", "24");
              if (hoursStr === null) return;
              const hours = parseInt(hoursStr, 10);
              if (isNaN(hours) || hours <= 0) {
                alert("Please enter a valid number of hours.");
                return;
              }

              setIsAdminActionLoading(true);
              setAdminActionError(null);
              const res = await reactivateAuction(auction._id, hours);
              if (res.success) {
                setStatus("LIVE");
                setIsConcluded(false);
                const newEndTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
                setEndTime(newEndTime);
                alert("Auction successfully reactivated and status set to LIVE!");
              } else {
                setAdminActionError(res.error || "Failed to reactivate auction.");
              }
              setIsAdminActionLoading(false);
            }}
            disabled={isAdminActionLoading}
            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 mt-1"
          >
            <Play className="h-4 w-4 animate-pulse" />
            Reactivate & Extend Auction
          </button>
        )}

        {/* Delete Auction Button (SUPER_ADMIN only) */}
        {isSuperAdmin && (
          <button
            onClick={async () => {
              if (!confirm("⚠️ WARNING: Deleting this auction will permanently remove it, its listing details, bids, and registrations from the platform. This action CANNOT be undone. Are you sure you want to proceed?")) return;
              setIsAdminActionLoading(true);
              setAdminActionError(null);
              const res = await deleteAuction(auction._id);
              if (res.success) {
                window.location.href = "/auctions";
              } else {
                setAdminActionError(res.error || "Failed to delete auction.");
                setIsAdminActionLoading(false);
              }
            }}
            disabled={isAdminActionLoading}
            className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/10 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 mt-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete Auction & Listing
          </button>
        )}
      </div>
    );
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL: ", err);
    }
  };

  const handleBuyNowClick = () => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    } else {
      setIsBuyNowOpen(true);
    }
  };

  const handleManualOrderChat = async (method: "Card" | "Others") => {
    if (sessionStatus === "loading" || !session?.user) return;
    const userId = (session.user as any).id as string;
    const username = (session.user as any).username || session.user.name || session.user.email || "User";
    const country = (session.user as any).country || "N/A";

    try {
      const res = await createBuyNowOrderAction(auction._id);
      if (res.success && res.orderId) {
        const orderId = res.orderId;
        const db = getDb();
        const chatId = `order-${orderId}`;
        const chatRef = doc(db, "supportChats", chatId);

        const methodLabel = method === "Card" ? "Card, Cash App, Apple Pay" : "Others";
        
        const buyNowPrice = auction.listingId.startingBid * 4;
        const discount = Math.min(buyNowPrice, walletCreditAmount);
        const finalPrice = Math.max(0, buyNowPrice - discount);

        const subtotalText = `\nSubtotal Price: ${convert(buyNowPrice).formatted}`;
        const walletDiscountText = discount > 0 ? `\nWallet Discount: ${convert(discount).formatted}` : "";
        const finalPriceText = `\nFinal Amount Paid: ${convert(finalPrice).formatted}`;

        const messageText = `📦 NEW ORDER: Auction Buy Now
----------------------------------
Order ID: ${orderId}
Auction/Listing: ${auction.listingId.title}${subtotalText}${walletDiscountText}${finalPriceText}
Payment Method: ${methodLabel}

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${session?.user?.email || "N/A"}
User ID: ${userId}
🌍 Country: ${country}

Please guide me on how to complete the payment!`;

        await setDoc(chatRef, {
          userId,
          username,
          email: session?.user?.email ?? "",
          type: "order",
          orderId,
          title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
          lastMessage: `Payment coordination started for ${methodLabel}.`,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
        });

        const msgsRef = collection(db, "supportChats", chatId, "messages");
        await addDoc(msgsRef, {
          text: messageText,
          sender: "user",
          senderName: username,
          timestamp: serverTimestamp(),
          read: false,
        });

        await addDoc(msgsRef, {
          text: `System: Hi ${username}! Someone from our support team will reply to you here shortly to guide you through your manual payment.`,
          sender: "admin",
          senderName: "Support Team",
          timestamp: serverTimestamp(),
          read: false,
        });

        // Trigger Webhook Notification on Auction Buy Now order chat creation
        sendChatWebhookNotification({
          ticketId: chatId,
          ticketTitle: `Order #${orderId.substring(0, 8).toUpperCase()} (Auction Buy Now: ${methodLabel})`,
          senderName: username,
          senderType: "user",
          userEmail: session?.user?.email ?? undefined,
          text: messageText,
        }).catch(() => {});

        // Close modal and redirect
        setIsBuyNowOpen(false);
        window.location.href = `/chat?chatId=${chatId}`;
      } else {
        alert("Error creating order: " + (res.error || "Please try again."));
      }
    } catch (err) {
      console.error("Manual order chat error:", err);
      alert("Failed to initiate chat. Please try again.");
    }
  };

  // Gallery controls
  const screenshots = auction.listingId.screenshots && auction.listingId.screenshots.length > 0
    ? auction.listingId.screenshots
    : [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1613771404724-11d595413b6b?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=800&auto=format&fit=crop&q=80",
    ];
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Lock body scroll when zoom modal is open
  useEffect(() => {
    if (isZoomOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isZoomOpen]);

  const [activeTab, setActiveTab] = useState<"overview" | "details" | "terms" | "reviews">("overview");

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
    if (!endTime) return;
    if (status === "PAUSED") {
      setTimeLeft("Bidding Paused");
      setIsConcluded(false);
      return;
    }
    if (status === "COMPLETED") {
      setTimeLeft("Auction Concluded");
      setIsConcluded(true);
      return;
    }

    const end = new Date(endTime).getTime();

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
  }, [endTime, status]);

  const activeBid = currentBid !== null ? currentBid : auction.currentHighestBid;
  const buyNowPrice = auction.listingId.startingBid * 4;
  const buyNowPriceDiscount = hasWalletCredit ? Math.min(buyNowPrice, walletCreditAmount) : 0;
  const finalBuyNowPrice = Math.max(0, buyNowPrice - buyNowPriceDiscount);
  const isBuyNowDisabled = isConcluded || activeBid >= 0.8 * buyNowPrice;
  const prevBidRef = useRef<number>(activeBid);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prevBidRef.current !== activeBid) {
      if (!isMuted) {
        // Play sound
        const audio = new Audio("/audio/update.mp3");
        audio.play().catch((err) => console.log("Audio play failed:", err));
      }

      // Trigger flash animation
      if (activeBid > prevBidRef.current) {
        setPriceFlash("up");
      } else {
        setPriceFlash("down");
      }

      // Reset flash animation
      const timer = setTimeout(() => {
        setPriceFlash(null);
      }, 1000);

      prevBidRef.current = activeBid;
      return () => clearTimeout(timer);
    }
  }, [activeBid, isMuted]);
  const minIncrement = auction.listingId.minIncrement;
  const nextMinBid = activeBid + minIncrement;

  const handlePlaceBid = async (amount: number) => {
    console.log(`[Auction] 🔨 Place Bid Button Clicked | AuctionId: ${auction._id} | Amount: $${amount} | MinRequired: $${nextMinBid}`);
    if (amount < nextMinBid) {
      console.warn(`[Auction] ⚠️ Bid rejected: Amount $${amount} is below minimum requirement $${nextMinBid}`);
      setError(`Minimum bid requirement is $${nextMinBid}`);
      return;
    }
    setIsBidding(true);
    try {
      await placeBid(amount);
      console.log(`[Auction] ✅ Bid placed successfully -> $${amount}`);
    } catch (err) {
      console.error("[Auction] ❌ Bid placement error:", err);
    } finally {
      setIsBidding(false);
    }
  };

  const handleViewAllClick = async () => {
    console.log(`[Auction] 📜 "View Full Bid History" Clicked | AuctionId: ${auction._id}`);
    setIsHistoryModalOpen(true);
    setIsHistoryLoading(true);
    setError(null);
    try {
      const res = await fetchAllAuctionBids(auction._id);
      if (res.success && res.bids) {
        setFullBidHistory(res.bids);
      } else {
        setError(res.error || "Failed to load bid history.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve complete bid history.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const nextImage = () => {
    setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  // Team badges mapping
  const teamColors = {
    MYSTIC: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    VALOR: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
    INSTINCT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20",
    NONE: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  };


  const renderBiddingPanel = () => (
    <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] backdrop-blur-md p-6 space-y-5 shadow-xs dark:shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-[#6133e1]/10 blur-xl pointer-events-none" />

      {/* Stock market glows */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent transition-opacity duration-1000 pointer-events-none",
        priceFlash === "up" ? "opacity-100" : "opacity-0"
      )} />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent transition-opacity duration-1000 pointer-events-none",
        priceFlash === "down" ? "opacity-100" : "opacity-0"
      )} />

      {/* Countdown Ends In */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] text-zinc-805 dark:text-zinc-200 font-extrabold uppercase tracking-wider">
            Live Room
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider bg-zinc-105 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            {auction.viewers || 1} Views
          </span>
          <span className="text-[9px] text-red-500 dark:text-red-400 font-extrabold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-200 dark:border-red-500/20 animate-pulse">
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Bid Values */}
      <div className="space-y-1 text-center relative z-10">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">
          {highestBidderId ? "Current Bid" : "Starting Bid"}
        </span>
        <motion.h3
          key={activeBid}
          initial={{ scale: 0.95 }}
          animate={{
            scale: priceFlash ? [0.95, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.4 }}
          className={cn(
            "text-4xl font-black tracking-tight transition-colors duration-300",
            priceFlash === "up" ? "text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
              priceFlash === "down" ? "text-red-500 dark:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" :
                "text-zinc-900 dark:text-white"
          )}
        >
          <PriceDisplay amountInUSD={activeBid} />
        </motion.h3>

        {highestBidderId === session?.user?.id ? (
          <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 mt-1 uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> You are highest bidder
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[9px] text-zinc-600 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700 mt-1 uppercase tracking-wider">
            Outbid / No active bids
          </div>
        )}
      </div>

      {/* Counters Info */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-200 dark:border-zinc-800/80 text-center text-xs relative z-10 items-center">
        <div>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Total Bids</span>
          <div className="font-bold text-zinc-800 dark:text-white mt-0.5">{bidHistory.length}</div>
        </div>
        <div className="border-x border-zinc-200 dark:border-zinc-850">
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Views</span>
          <div className="font-bold text-zinc-800 dark:text-white mt-0.5">{auction.viewers || 1}</div>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95 bg-transparent"
          >
            {isMuted ? "🔇 Muted" : "🔊 Sound"}
          </button>
        </div>
      </div>

      {/* Bidding Controls Form */}
      <div className="space-y-3 relative z-10">
        {error && (
          <div className="flex items-start gap-1.5 rounded bg-red-500/10 p-2.5 text-[10px] text-red-500 dark:text-red-400 border border-red-500/20 leading-relaxed">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isConcluded ? (
          highestBidderName ? (
            highestBidderId === session?.user?.id ? (
              isAuctionPaid ? (
                /* ====== WINNER PAID STATE ====== */
                <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 text-center space-y-3">
                  <Trophy className="h-8 w-8 text-emerald-500 mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">🎉 Payment Confirmed!</h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-light leading-snug">
                      Your payment has been successfully confirmed. You will receive the account details soon!
                    </p>
                  </div>
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                    Payment Confirmed
                  </button>
                </div>
              ) : (
                /* ====== THIS USER IS THE WINNER ====== */
                <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-emerald-500/5 p-4 text-center space-y-3">
                  <Trophy className="h-8 w-8 text-[#6133e1] mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">🎉 You Won!</h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-light leading-snug">
                      Congratulations! You won with a bid of <strong className="font-bold text-zinc-900 dark:text-white"><PriceDisplay amountInUSD={activeBid} /></strong>. Complete your payment to receive the account.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWinnerPaymentOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition bg-[#6133e1] hover:bg-violet-600 text-white cursor-pointer active:scale-[0.98] shadow-lg"
                  >
                    <CreditCard className="h-4 w-4" />
                    Complete Payment — <PriceDisplay amountInUSD={activeBid} />
                  </button>
                </div>
              )
            ) : (
              /* ====== VIEWER SEES WINNER ANNOUNCEMENT ====== */
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center space-y-3">
                <Trophy className="h-8 w-8 text-[#6133e1] mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Winner Announced!</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-light leading-snug">
                    Congratulations to <strong className="font-bold text-zinc-900 dark:text-white">{highestBidderName}</strong> for winning this auction with a final bid of <strong className="font-bold text-zinc-900 dark:text-white"><PriceDisplay amountInUSD={activeBid} /></strong>!
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center space-y-2">
              <AlertCircle className="h-6 w-6 text-zinc-550 mx-auto" />
              <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Concluded</h4>
              <p className="text-[11px] text-zinc-500">This auction expired with no bids.</p>
            </div>
          )
        ) : isOwner ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-zinc-555 mx-auto" />
            <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Owner Console</h4>
            <p className="text-[11px] text-zinc-500">You are the seller of this listing. Self-bidding is disabled.</p>
          </div>
        ) : !isRegistered ? (
          <div className="space-y-3">
            <div className="rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-light">
              A refundable verification deposit of <PriceDisplay amountInUSD={2.50} /> is required to participate in bidding.
            </div>
            <RegisterAuctionButton auctionId={auction._id} onSuccess={() => setIsRegistered(true)} />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
              This verification deposit is completely refundable. It will automatically act as store credit and be deducted from the total amount of any future purchase you make from our store, including products and services.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-center font-bold font-mono">
              Minimum Next Bid: <span className="text-zinc-800 dark:text-white"><PriceDisplay amountInUSD={nextMinBid} /></span>
            </div>
            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[nextMinBid, nextMinBid + (auction.listingId?.minIncrement || 100), nextMinBid + 2 * (auction.listingId?.minIncrement || 100)].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handlePlaceBid(amount)}
                  disabled={!isConnected || isBidding || highestBidderId === session?.user?.id}
                  className="h-11 rounded-xl bg-zinc-55 dark:bg-zinc-900 hover:bg-[#6133e1] hover:text-white text-zinc-800 dark:text-white text-xs font-bold border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50 flex items-center justify-center"
                >
                  {isBidding ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#6133e1] dark:text-white" />
                  ) : (
                    <>+<PriceDisplay amountInUSD={amount - activeBid} /></>
                  )}
                </button>
              ))}
            </div>

            {/* Live Bid Ticker inside Bidding Panel */}
            {bidHistory.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold block">Live Bid Stream</span>
                <div className="space-y-1.5 max-h-[120px] overflow-hidden">
                  <AnimatePresence initial={false}>
                    {bidHistory.slice(0, 3).map((bid, idx) => (
                      <motion.div
                        key={bid._id}
                        initial={{ opacity: 0, x: -10, y: -10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl border text-[11px] font-medium transition-all duration-300",
                          idx === 0
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm"
                            : "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-800/40 text-zinc-600 dark:text-zinc-400"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6133e1]" />
                          <span>{bid.bidderName}</span>
                        </div>
                        <span className="font-extrabold"><PriceDisplay amountInUSD={bid.amount} /></span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Buy Now Option */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Buy Now price</h4>
          <p className="text-[10px] text-zinc-500">Skip the live bidding process</p>
        </div>
        <button
          onClick={handleBuyNowClick}
          disabled={isBuyNowDisabled || sessionStatus === "loading"}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border cursor-pointer",
            (isBuyNowDisabled || sessionStatus === "loading")
              ? "bg-zinc-200 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-300 dark:border-zinc-800 cursor-not-allowed opacity-60"
              : "bg-zinc-900 hover:bg-[#6133e1] text-white border border-zinc-800 hover:border-[#6133e1]"
          )}
        >
          <span>BUY NOW</span>
          <span className={cn("text-[10px] font-bold border-l pl-2", (isBuyNowDisabled || sessionStatus === "loading") ? "border-zinc-300 dark:border-zinc-700/60 text-zinc-450 dark:text-zinc-500" : "border-zinc-700/60 text-zinc-400")}><PriceDisplay amountInUSD={buyNowPrice} /></span>
        </button>
      </div>
    </div>
  );

  interface RowType {
    label: string;
    value: string | number | undefined | null;
    format?: (v: number) => string;
  }

  const specRows: RowType[] = ([
    { label: "Trainer Level", value: auction.listingId.level },
    { label: "Faction Team", value: auction.listingId.team },
    { label: "Stardust Balance", value: auction.listingId.stardust, format: (v: number) => v.toLocaleString() },
    { label: "Total XP Balance", value: auction.listingId.xp, format: (v: number) => v.toLocaleString() },
    { label: "PokéCoins", value: auction.listingId.pokeCoins, format: (v: number) => v.toLocaleString() },
    { label: "Account Status", value: auction.listingId.accountStatus },
    { label: "Account Type", value: auction.listingId.accountType },
    { label: "Start Date", value: auction.listingId.startDate },
    { label: "Account Region", value: auction.listingId.region },
    { label: "Platinum Medals", value: (auction.listingId as any).platinumMedals },
    { label: "Legendary Poses", value: (auction.listingId as any).legendaryPoses },
    { label: "Shiny Pokémon", value: (auction.listingId as any).shinyPokemons },
    { label: "Shiny Mythical", value: (auction.listingId as any).shinyMythical },
    { label: "Shiny Ultrabeasts", value: (auction.listingId as any).shinyUltrabeasts },
    { label: "Shiny Legendaries", value: (auction.listingId as any).shinyLegendaries },
    { label: "Legendary Pokémon", value: (auction.listingId as any).legendaryPokemons },
    { label: "Ultrabeasts", value: (auction.listingId as any).ultrabeasts },
    { label: "Mythical Pokémon", value: (auction.listingId as any).mythicalPokemons },
    { label: "Hundo Mythical/Leg/UB", value: (auction.listingId as any).hundoMythicalLegendaryUltrabeast },
    { label: "Shundo Legendary/Mythical/UB", value: (auction.listingId as any).shundoLegendaryMythicalUltrabeast },
    { label: "Shundo Pokémon", value: (auction.listingId as any).shundoPokemons },
    { label: "Hundo Pokémon", value: (auction.listingId as any).hundoPokemons },
    { label: "Costume Shinies", value: (auction.listingId as any).costumeShinies },
    { label: "Hatched Shinies", value: (auction.listingId as any).hatchedShinies },
    { label: "Lucky Pokémon", value: (auction.listingId as any).luckyPokemons },
    { label: "Lucky Legendaries", value: (auction.listingId as any).luckyLegendaries },
    { label: "Shiny Lucky Legendaries", value: (auction.listingId as any).shinyLuckyLegendaries },
    { label: "Location BG Shiny", value: (auction.listingId as any).locationBackgroundLegendaryShiny },
    { label: "Special BG Shiny", value: (auction.listingId as any).specialBackgroundLegendaryShiny },
    { label: "CandyXL Pokémon", value: (auction.listingId as any).candyXlPokemons },
    { label: "CandyXL Legendaries", value: (auction.listingId as any).candyXlLegendaries },
    { label: "Best Buddies", value: (auction.listingId as any).bestBuddies },
    { label: "Dual Move Pokémon", value: (auction.listingId as any).dualMovePokemons },
    { label: "Shadow Shiny Pokémon", value: (auction.listingId as any).shadowShinyPokemons },
    { label: "Pokémon Storage", value: (auction.listingId as any).pokemonStorage },
    { label: "Item Bag Storage", value: (auction.listingId as any).itemBagStorage },
    { label: "Master Balls", value: (auction.listingId as any).masterBalls },
    { label: "Raid Passes", value: (auction.listingId as any).raidPasses },
    { label: "Super Rocket Radar", value: (auction.listingId as any).superRocketRadar },
    { label: "Pokédex Registered #", value: (auction.listingId as any).pokedexRegisteredNumber },
    { label: "Bans Count", value: (auction.listingId as any).bansCount },
  ] as RowType[]).filter((row): row is RowType & { value: string | number } => {
    if (row.value === undefined || row.value === null || row.value === "") {
      return false;
    }
    if (typeof row.value === "number" && row.value === 0) {
      return false;
    }
    if (typeof row.value === "string" && (row.value === "0" || row.value === "NONE")) {
      return false;
    }
    return true;
  });

  const resourceRows: RowType[] = ([
    { label: "Rare Candy", value: auction.listingId.rareCandy },
    { label: "Fast TM", value: auction.listingId.fastTm },
    { label: "Charged TM", value: auction.listingId.chargedTm },
    { label: "Elite Fast TM", value: auction.listingId.eliteFastTm },
    { label: "Elite Charged TM", value: auction.listingId.eliteChargedTm },
    { label: "Incubators", value: auction.listingId.incubators },
    { label: "Lucky Eggs", value: auction.listingId.luckyEggs },
    { label: "Lure Modules", value: auction.listingId.lureModules },
    { label: "Premium Raid Pass", value: auction.listingId.premiumRaidPass },
  ] as RowType[]).filter((row): row is RowType & { value: string | number } => {
    if (row.value === undefined || row.value === null || row.value === "") {
      return false;
    }
    if (typeof row.value === "number" && row.value === 0) {
      return false;
    }
    if (typeof row.value === "string" && (row.value === "0" || row.value === "NONE")) {
      return false;
    }
    return true;
  });

  const keyStats = [
    { label: "Level", value: auction.listingId.level, suffix: "" },
    { label: "Team", value: auction.listingId.team, suffix: "" },
    { label: "Shiny Count", value: auction.listingId.shinyCount, suffix: "✨" },
    { label: "Legendary Count", value: auction.listingId.legendaryCount, suffix: "🏆" },
    { label: "Mythical Count", value: auction.listingId.mythicalCount, suffix: "⭐" },
    { label: "Stardust", value: auction.listingId.stardust, format: (v: number) => v.toLocaleString() },
  ].filter(stat => {
    if (stat.value === undefined || stat.value === null || (stat.value as any) === "") return false;
    if (typeof stat.value === "number" && stat.value === 0) return false;
    if (typeof stat.value === "string" && ((stat.value as any) === "0" || stat.value === "NONE")) return false;
    return true;
  });

  const renderKeyStatsGrid = (className?: string) => {
    if (keyStats.length === 0) return null;
    return (
      <div className={cn("grid gap-2 text-center text-xs", className || "grid-cols-2 md:grid-cols-3")}>
        {keyStats.map((stat, idx) => {
          const display = stat.format && typeof stat.value === "number" ? stat.format(stat.value) : String(stat.value);
          return (
            <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30 p-2.5 shadow-2xs transition-all hover:scale-[1.02] duration-300">
              <div className="text-[9px] text-zinc-550 dark:text-zinc-400 uppercase font-extrabold tracking-wider">{stat.label}</div>
              <div className="font-black text-zinc-800 dark:text-white mt-1 text-sm truncate flex items-center justify-center gap-1">
                {display} {stat.suffix}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGallery = () => {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 sm:p-5 space-y-4 shadow-xs relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[#6133e1]/5 blur-2xl pointer-events-none" />

        {/* Main Viewer */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center group shadow-inner">

          {/* Team Tag Overlay */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <span className="bg-[#6133e1] text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md tracking-wider">
              Verified Asset
            </span>
            {auction.listingId.team !== "NONE" && (
              <span className={cn("text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md border tracking-wider", teamColors[auction.listingId.team])}>
                {auction.listingId.team}
              </span>
            )}
          </div>

          {/* Main Display Image */}
          <img
            src={screenshots[activeImgIndex]}
            alt="Account preview screenshot"
            onClick={() => setIsZoomOpen(true)}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102 cursor-zoom-in"
          />

          {/* Left/Right Controls */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-zinc-700/50 hover:border-zinc-650 transition-all cursor-pointer shadow-md"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-zinc-700/50 hover:border-zinc-650 transition-all cursor-pointer shadow-md"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Row */}
        {screenshots.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {screenshots.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImgIndex(idx)}
                className={cn(
                  "relative h-12 w-16 rounded-lg overflow-hidden border bg-zinc-50 dark:bg-zinc-900 shrink-0 transition-all cursor-pointer",
                  activeImgIndex === idx
                    ? "border-[#6133e1] ring-2 ring-[#6133e1]/30 scale-95"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08080a] text-zinc-900 dark:text-white py-6 pb-24 lg:pb-6 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Home</span>
          <span>&gt;</span>
          <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Auctions</span>
          <span>&gt;</span>
          <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Pokémon GO Accounts</span>
          <span>&gt;</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[200px] sm:max-w-none">{auction.listingId.title}</span>
        </div>

        {/* Real-time connection status overlay/banner */}
        {!isConnected && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-200 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 text-xs text-zinc-600 dark:text-zinc-300 shadow-xs animate-pulse">
            <AlertCircle className="h-4 w-4 text-zinc-400 dark:text-zinc-400" />
            Connecting to real-time bidding engine... Live updates paused.
          </div>
        )}

        {/* Desktop Title & Details Section (Grid: Left 2 cols, Right 1 col) */}
        <div className="hidden lg:grid gap-8 lg:grid-cols-3">

          {/* LEFT CONTAINER (Gallery, Info Tabs, Details lists) */}
          <div className="lg:col-span-2 space-y-6">
            {renderGallery()}

            {/* Quick Guarantees/Trust Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3 shadow-xs">
                <ShieldCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-800 dark:text-white uppercase tracking-wider">100% Safe</h4>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Secure systems</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3 shadow-xs">
                <Award className="h-5 w-5 text-purple-500 dark:text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Instant Delivery</h4>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Credentials transfer</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3 shadow-xs">
                <Coins className="h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Verified Account</h4>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Checked by admin</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 backdrop-blur-sm p-3.5 flex items-center gap-3 shadow-xs">
                <Headset className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-800 dark:text-white uppercase tracking-wider">24/7 Help</h4>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Trade coordination</p>
                </div>
              </div>
            </div>

            {/* Detailed Description, Grid Statistics & Info Tabs */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] backdrop-blur-md overflow-hidden shadow-xs">

              {/* Tab Selector Header */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto bg-zinc-50 dark:bg-black/20">
                {(["overview", "details", "terms"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer bg-transparent border-none",
                      activeTab === tab
                        ? "border-[#6133e1] text-zinc-900 dark:text-white bg-[#6133e1]/5"
                        : "border-transparent text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    {tab === "overview" && "Overview"}
                    {tab === "details" && "Account Details"}
                    {tab === "terms" && "Terms & Conditions"}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="p-6 sm:p-8 space-y-6">

                {activeTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">About This Account</h3>
                      <p className="text-sm text-zinc-655 dark:text-zinc-300 leading-relaxed font-light whitespace-pre-line">
                        {auction.listingId.description}
                      </p>
                    </div>

                    {/* Detailed Specifications Checklist */}
                    {specRows.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Key Features</h3>
                        <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs">
                          {specRows.slice(0, 12).map((row, idx) => {
                            const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                            return (
                              <div key={idx} className="flex items-center gap-2 text-zinc-650 dark:text-zinc-300">
                                <Check className="h-4 w-4 text-[#6133e1] shrink-0" />
                                <span><strong>{row.label}:</strong> {displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Security Notice Warning Box */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4 text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-3">
                      <AlertTriangle className="h-4.5 w-4.5 text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-zinc-850 dark:text-white uppercase tracking-wider text-[10px]">Important Security Coordinates:</strong>
                        <p className="mt-1 leading-relaxed">
                          We handle full email integration transfers. Credential coordinates (passwords/associated codes) are fully changed during secure trade procedures to guarantee permanent account lock protection.
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {activeTab === "details" && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Specifications detail grids */}
                    {specRows.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Account Attributes</h3>
                        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-xs">
                          {specRows.map((row, idx) => {
                            const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                            return (
                              <div key={idx} className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors hover:bg-zinc-50/20">
                                <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                                <span className="font-semibold text-zinc-805 dark:text-white">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Resources detail grids */}
                    {resourceRows.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Items & Inventory</h3>
                        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-xs">
                          {resourceRows.map((row, idx) => {
                            const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                            return (
                              <div key={idx} className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors hover:bg-zinc-50/20">
                                <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                                <span className="font-semibold text-zinc-800 dark:text-white">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "terms" && (
                  <div className="space-y-6 text-xs text-zinc-650 dark:text-zinc-305 leading-relaxed font-light animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Account Handover Terms</h4>
                      <p>
                        We guarantee a secure transfer pipeline. Upon auction finalization, our system admins check the account credentials, link a secure email coordinates list matching your requests, and deliver details within minutes.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Refund Policy</h4>
                      <p>
                        A 7-Day Money Back Guarantee protects you from discrepancies. If the account characteristics do not match the statistics listed on the catalog cards, you are eligible for immediate complete refunds.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Accordion FAQs Panel */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-[#6133e1]" />
                Frequently Asked Questions
              </h3>

              <div className="space-y-2">
                {[
                  { q: "Will I get full access to the account?", a: "Yes. You will receive complete credentials including access keys to the linked Google/PTC account coordinates, allowing you to change passwords instantly." },
                  { q: "Is the account safe from bans?", a: "Absolutely. All listings undergo authentication review by administrators to ensure they are clean, have no active warnings or strikes, and align with global safe play parameters." },
                  { q: "How will I receive the account details?", a: "Admins automate the delivery. You will receive a secure system notification (and Telegram coordination details) as soon as deposit and purchase balances are finalized." },
                  { q: "Can I change the email and password?", a: "Yes. Changing email links is a mandatory step in our secure onboarding handbook to ensure that you are the sole controller of the account asset." }
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between py-2.5 text-left text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <span>{openFaq === idx ? "−" : "+"}</span>
                    </button>
                    {openFaq === idx && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pb-3 leading-relaxed font-light">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Assurance Block */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 flex flex-col sm:flex-row items-center gap-6 justify-between shadow-xs">
              <div className="flex items-center gap-4">
                <ShieldAlert className="h-10 w-10 text-[#6133e1] shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Bid With Complete Confidence</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Your payments are fully protected under our 7-Day Money Back Guarantee structure.</p>
                </div>
              </div>
              <Link
                href="/contact"
                className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Safe Trade Seal
              </Link>
            </div>

          </div>

          {/* RIGHT CONTAINER: Floating Bidding Action Panel & Metadata details */}
          <div className="space-y-6">

            {/* Header Title Metadata Info Panel */}
            <div className="hidden lg:block rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] backdrop-blur-md p-6 space-y-4 shadow-xs">
              <span className="bg-[#6133e1]/10 text-[#6133e1] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-[#6133e1]/20">
                Premium Grade Asset
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
                {auction.listingId.title}
              </h2>

              {/* Actions Row (Watch & Share) */}
              <div className="flex items-center justify-end text-xs pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer text-[10px]">
                    <Heart className="h-3.5 w-3.5" />
                    Watch
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer text-[10px]"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500 animate-in zoom-in-50 duration-200" />
                        <span className="text-emerald-550 dark:text-emerald-450 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Statistical Grid summary */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase">Level</div>
                  <div className="font-extrabold text-zinc-800 dark:text-white mt-0.5">{auction.listingId.level}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase">Team</div>
                  <div className="font-extrabold text-zinc-800 dark:text-white mt-0.5 truncate">{auction.listingId.team}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase">Shiny</div>
                  <div className="font-extrabold text-zinc-800 dark:text-white mt-0.5">{auction.listingId.shinyCount}✨</div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-2.5">
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase">Legendary</div>
                  <div className="font-extrabold text-zinc-800 dark:text-white mt-0.5">{auction.listingId.legendaryCount}🏆</div>
                </div>
              </div>
            </div>

            {/* Desktop Admin Control Panel */}
            <div className="hidden lg:block mb-4">
              {renderAdminControlPanel()}
            </div>

            {/* Desktop Bidding Control Panel */}
            <div className="hidden lg:block">
              {renderBiddingPanel()}
            </div>

            {/* Delivery Specifications & Payment details */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Shipping & Handover details</h4>
              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 font-light">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Instant Delivery via admin transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Full access changeable email coordinates</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Supported Payments</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["PayPal", "Visa", "Mastercard", "UPI"].map((pm, idx) => (
                    <span key={idx} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      {pm}
                    </span>
                  ))}
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-1">and more...</span>
                </div>
              </div>
            </div>

            {/* Support contact panel */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 text-center space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Have Questions?</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">Our technical trade team is available 24/7.</p>
              <Link href="/contact" className="w-full h-10 rounded-xl bg-[#6133e1] hover:bg-[#6133e1]/90 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center">
                Contact Support
              </Link>
            </div>

            {/* Ledger Bids list */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-[#6133e1]" />
                  Recent Live Bids
                </h3>
                <button type="button" onClick={handleViewAllClick} className="text-[9px] text-[#6133e1] dark:text-purple-400 hover:underline font-bold bg-transparent border-none cursor-pointer">View All</button>
              </div>

              <div className="space-y-2">
                {bidHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2 text-center">No bids recorded yet.</p>
                ) : (
                  bidHistory.slice(0, 5).map((bid, idx) => (
                    <div key={bid._id} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-zinc-800 dark:text-white">{bid.bidderName}</span>
                        <div className="text-[9px] text-zinc-500 dark:text-zinc-400">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="font-bold text-zinc-800 dark:text-white"><PriceDisplay amountInUSD={bid.amount} /></span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MOBILE FIRST SYSTEMATIC LAYOUT (Visible only on mobile/tablet) */}
      <div className="lg:hidden space-y-6">

        {/* Title Card always visible at top */}
        <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-3 shadow-xs">
          <span className="inline-block bg-[#6133e1]/10 text-[#6133e1] text-[9px] font-black uppercase px-2 py-0.5 rounded border border-[#6133e1]/20">
            Premium Grade Asset
          </span>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            {auction.listingId.title}
          </h1>
          {renderKeyStatsGrid("grid-cols-3 gap-2 pt-1")}
        </div>

        {/* Admin panel always visible if authorized */}
        {isAuthorizedAdmin && (
          <div className="mt-2">
            {renderAdminControlPanel()}
          </div>
        )}

        {/* Image gallery always visible at the top */}
        {renderGallery()}

        {/* Navigation Tabs Selector */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 mt-4">
          {(["bid", "details", "help"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setMobileActiveView(view)}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer capitalize bg-transparent border-none",
                mobileActiveView === view
                  ? "bg-[#6133e1] text-white shadow-sm font-black"
                  : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
              )}
            >
              {view === "bid" && "Live Bid"}
              {view === "details" && "Specs & Telemetry"}
              {view === "help" && "Help & Terms"}
            </button>
          ))}
        </div>

        {/* Active Mobile View Content */}
        {mobileActiveView === "bid" && (
          <div className="space-y-4 animate-in fade-in duration-200">

            {/* Bidding Timer & Status Panel */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  Auction Ends In
                </span>
                <span className="text-[10px] text-red-500 dark:text-red-400 font-extrabold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-200 dark:border-red-500/20 animate-pulse">
                  {timeLeft}
                </span>
              </div>

              <div className="space-y-1 text-center py-2">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">
                  {highestBidderId ? "Current Bid" : "Starting Bid"}
                </span>
                <motion.h3
                  key={activeBid}
                  initial={{ scale: 0.95 }}
                  animate={{
                    scale: priceFlash ? [0.95, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "text-3xl font-black tracking-tight transition-colors duration-300",
                    priceFlash === "up" ? "text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                      priceFlash === "down" ? "text-red-500 dark:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" :
                        "text-zinc-900 dark:text-white"
                  )}
                >
                  <PriceDisplay amountInUSD={activeBid} />
                </motion.h3>
                {highestBidderId === session?.user?.id ? (
                  <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 mt-1 uppercase tracking-wider">
                    <ShieldCheck className="h-3 w-3" /> You are leading
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[9px] text-zinc-650 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700 mt-1 uppercase tracking-wider">
                    Outbid / Place Bid Below
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-1.5 rounded bg-red-500/10 p-2.5 text-[10px] text-red-500 dark:text-red-400 border border-red-500/20 leading-relaxed">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bidding Controls Form */}
              <div className="pt-2">
                {isConcluded ? (
                  highestBidderName ? (
                    highestBidderId === session?.user?.id ? (
                      isAuctionPaid ? (
                        /* ====== WINNER PAID STATE ====== */
                        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 text-center space-y-3">
                          <Trophy className="h-6 w-6 text-emerald-500 mx-auto animate-bounce" />
                          <div>
                            <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">🎉 Payment Confirmed!</h4>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1">
                              Your payment has been successfully confirmed. You will receive the account details soon!
                            </p>
                          </div>
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60"
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                            Payment Confirmed
                          </button>
                        </div>
                      ) : (
                        /* ====== WINNER SEES PAYMENT BUTTON ====== */
                        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-emerald-500/5 p-4 text-center space-y-3">
                          <Trophy className="h-6 w-6 text-[#6133e1] mx-auto animate-bounce" />
                          <div>
                            <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">🎉 You Won!</h4>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1">
                              You won with <strong className="font-bold text-zinc-900 dark:text-white"><PriceDisplay amountInUSD={activeBid} /></strong>. Complete payment to get the account.
                            </p>
                          </div>
                          <button
                            onClick={() => setIsWinnerPaymentOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition bg-[#6133e1] hover:bg-violet-600 text-white cursor-pointer active:scale-[0.98] shadow-lg"
                          >
                            <CreditCard className="h-4 w-4" />
                            Complete Payment
                          </button>
                        </div>
                      )
                    ) : (
                      /* ====== OBSERVER SEES WINNER ANNOUNCEMENT ====== */
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center space-y-2">
                        <Trophy className="h-6 w-6 text-[#6133e1] mx-auto animate-bounce" />
                        <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Winner Announced!</h4>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                          Won by <strong className="font-bold text-zinc-900 dark:text-white">{highestBidderName}</strong> for <strong className="font-bold text-zinc-900 dark:text-white"><PriceDisplay amountInUSD={activeBid} /></strong>
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 p-4 text-center">
                      <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase">Concluded</h4>
                      <p className="text-[11px] text-zinc-500 mt-1">This auction expired with no bids.</p>
                    </div>
                  )
                ) : isOwner ? (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 p-4 text-center">
                    <h4 className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Owner Console</h4>
                    <p className="text-[11px] text-zinc-500 mt-1">You are the seller of this listing. Self-bidding is disabled.</p>
                  </div>
                ) : !isRegistered ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-800 p-3.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-light text-center">
                      A refundable verification deposit of <PriceDisplay amountInUSD={2.50} /> is required to participate in bidding.
                    </div>
                    <RegisterAuctionButton auctionId={auction._id} onSuccess={() => setIsRegistered(true)} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-center font-bold">
                      Minimum Next Bid: <span className="text-[#6133e1] dark:text-purple-400"><PriceDisplay amountInUSD={nextMinBid} /></span>
                    </div>
                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-2">
                      {[nextMinBid, nextMinBid + (auction.listingId?.minIncrement || 100), nextMinBid + 2 * (auction.listingId?.minIncrement || 100)].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handlePlaceBid(amount)}
                          disabled={!isConnected || isBidding || highestBidderId === session?.user?.id}
                          className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-[#6133e1] hover:text-white text-zinc-800 dark:text-white text-xs font-bold border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center animate-in duration-300"
                        >
                          {isBidding ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#6133e1] dark:text-white" />
                          ) : (
                            <>+<PriceDisplay amountInUSD={amount - activeBid} /></>
                          )}
                        </button>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* Buy Now Option */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 flex flex-col gap-3 shadow-xs">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Buy Now price</h4>
                <p className="text-[10px] text-zinc-500">Skip the live bidding process</p>
              </div>
              <button
                onClick={handleBuyNowClick}
                disabled={isBuyNowDisabled || sessionStatus === "loading"}
                className={cn(
                  "w-full h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer",
                  (isBuyNowDisabled || sessionStatus === "loading")
                    ? "bg-zinc-200 dark:bg-zinc-900 text-zinc-455 dark:text-zinc-500 border-zinc-300 dark:border-zinc-800 cursor-not-allowed opacity-60"
                    : "bg-zinc-900 hover:bg-[#6133e1] text-white border border-zinc-800 hover:border-[#6133e1]"
                )}
              >
                <span>BUY NOW</span>
                <span className={cn("text-[10px] font-bold border-l pl-2", (isBuyNowDisabled || sessionStatus === "loading") ? "border-zinc-300 dark:border-zinc-700/60 text-zinc-455 dark:text-zinc-500" : "border-zinc-700/60 text-zinc-400")}><PriceDisplay amountInUSD={buyNowPrice} /></span>
              </button>
            </div>

            {/* Bids Ledger list */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-[#6133e1]" />
                  Live Bid History
                </h3>
                <button type="button" onClick={handleViewAllClick} className="text-[9px] text-[#6133e1] dark:text-purple-400 hover:underline font-bold bg-transparent border-none cursor-pointer">View All</button>
              </div>
              <div className="space-y-2">
                {bidHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2 text-center">No bids recorded yet.</p>
                ) : (
                  bidHistory.slice(0, 8).map((bid, idx) => (
                    <div key={bid._id} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-zinc-800 dark:text-white">{bid.bidderName}</span>
                        <div className="text-[9px] text-zinc-500 dark:text-zinc-400">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="font-black text-zinc-900 dark:text-white">${bid.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Support Panel */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 text-center space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Have Questions?</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">Our technical trade team is available 24/7.</p>
              <Link href="/contact" className="w-full h-10 rounded-xl bg-[#6133e1] hover:bg-[#6133e1]/90 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center">
                Contact Support
              </Link>
            </div>

          </div>
        )}

        {/* Details tab view */}
        {mobileActiveView === "details" && (
          <div className="space-y-4 animate-in fade-in duration-200">

            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-6 shadow-xs">

              {/* About Account */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6133e1]">About This Account</h3>
                <p className="text-xs text-zinc-655 dark:text-zinc-300 leading-relaxed font-light whitespace-pre-line">
                  {auction.listingId.description}
                </p>
              </div>


              {/* Attributes specs */}
              {specRows.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6133e1]">Account Attributes</h3>
                  <div className="grid gap-y-2 text-[11px]">
                    {specRows.map((row, idx) => {
                      const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                      return (
                        <div key={idx} className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                          <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                          <span className="font-semibold text-zinc-800 dark:text-white">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resources inventory */}
              {resourceRows.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6133e1]">Items & Inventory</h3>
                  <div className="grid gap-y-2 text-[11px]">
                    {resourceRows.map((row, idx) => {
                      const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                      return (
                        <div key={idx} className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                          <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                          <span className="font-semibold text-zinc-800 dark:text-white">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Help & Terms tab view */}
        {mobileActiveView === "help" && (
          <div className="space-y-4 animate-in fade-in duration-200">

            {/* Trust Guarantees */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "100% Safe", desc: "Secure System", icon: ShieldCheck, color: "text-emerald-500" },
                { title: "Fast Delivery", desc: "Credentials Instantly", icon: Award, color: "text-purple-505" },
                { title: "Verified Assets", desc: "Admin Checked", icon: Coins, color: "text-sky-500" },
                { title: "24/7 Helpdesk", desc: "Live Chat Support", icon: Headset, color: "text-indigo-500" }
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/40 p-4 space-y-2 shadow-xs text-center flex flex-col items-center">
                  <item.icon className={cn("h-6 w-6 shrink-0", item.color)} />
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-bold text-zinc-850 dark:text-white uppercase tracking-wider">{item.title}</h4>
                    <p className="text-[8px] text-zinc-500 dark:text-zinc-400 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Specifications & Payment details */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Shipping & Handover details</h4>
              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 font-light">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Instant Delivery via admin transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Full access changeable email coordinates</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Supported Payments</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["PayPal", "Visa", "Mastercard", "UPI"].map((pm, idx) => (
                    <span key={idx} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      {pm}
                    </span>
                  ))}
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-1">and more...</span>
                </div>
              </div>
            </div>

            {/* Handover terms */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-xs text-xs">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800 pb-2">Handover Terms</h4>
              <div className="space-y-3 leading-relaxed text-zinc-650 dark:text-zinc-305 font-light">
                <p>
                  <strong>Secure credentials:</strong> Complete account coordinate logins are shared securely coordinates matching your account requests.
                </p>
                <p>
                  <strong>Refund assurance:</strong> A 7-day money-back safeguard applies automatically if the trainer levels, shinies or levels are discrepancy-filled.
                </p>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 border-b border-zinc-150 dark:border-zinc-800 pb-2">
                <HelpCircle className="h-4 w-4 text-[#6133e1]" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-2">
                {[
                  { q: "Will I get full access to the account?", a: "Yes. You will receive complete credentials including access keys to the linked Google/PTC account coordinates, allowing you to change passwords instantly." },
                  { q: "Is the account safe from bans?", a: "Absolutely. All listings undergo authentication review by administrators to ensure they are clean, have no active warnings or strikes, and align with safe play parameters." }
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between py-2 text-left text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white cursor-pointer bg-transparent border-none"
                    >
                      <span>{item.q}</span>
                      <span>{openFaq === idx ? "−" : "+"}</span>
                    </button>
                    {openFaq === idx && (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pb-2 leading-relaxed font-light">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Support Panel */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 text-center space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Have Questions?</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">Our technical trade team is available 24/7.</p>
              <Link href="/contact" className="w-full h-10 rounded-xl bg-[#6133e1] hover:bg-[#6133e1]/90 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center">
                Contact Support
              </Link>
            </div>

          </div>
        )}

      </div>

      {/* Bid History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
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
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="h-6 w-6 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center justify-center text-xs font-bold bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px] flex flex-col">
                {isHistoryLoading ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-10 space-y-3">
                    <Loader2 className="h-7 w-7 animate-spin text-[#6133e1]" />
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Loading Bid Ledger...</span>
                  </div>
                ) : fullBidHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-6 text-center">No bids placed yet.</p>
                ) : (
                  fullBidHistory.map((bid) => (
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

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {isAdminEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminEditOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-[#6133e1]" />
                  Edit Auction & Listing Details
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdminEditOpen(false)}
                  className="h-6 w-6 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center justify-center text-xs font-bold bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {adminActionError && (
                <div className="text-[10px] text-red-500 bg-red-500/10 p-2.5 rounded border border-red-500/20 leading-relaxed">
                  {adminActionError}
                </div>
              )}

              <div className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-2">
                {/* 1. Core Metadata & Bidding Economics */}
                <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4">
                  <h4 className="font-black text-[#6133e1] uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
                    <Gavel className="h-3.5 w-3.5" />
                    Core Info & Bidding Economics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Listing Title</label>
                      <input
                        type="text"
                        value={adminEditForm.title}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, title: e.target.value })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-zinc-500 font-medium">Trainer Level</label>
                        <input
                          type="number"
                          value={adminEditForm.level}
                          onChange={(e) => setAdminEditForm({ ...adminEditForm, level: parseInt(e.target.value) || 0 })}
                          className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 font-medium">Team Faction</label>
                        <select
                          value={adminEditForm.team}
                          onChange={(e) => setAdminEditForm({ ...adminEditForm, team: e.target.value as any })}
                          className="w-full h-8 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none cursor-pointer"
                        >
                          <option value="NONE">None</option>
                          <option value="MYSTIC">Mystic</option>
                          <option value="VALOR">Valor</option>
                          <option value="INSTINCT">Instinct</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 font-medium">Description</label>
                    <textarea
                      value={adminEditForm.description}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, description: e.target.value })}
                      className="w-full min-h-[60px] p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Starting Bid ($)</label>
                      <input
                        type="number"
                        value={adminEditForm.startingBid}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, startingBid: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Reserve Price ($)</label>
                      <input
                        type="number"
                        value={adminEditForm.reservePrice}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, reservePrice: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Min Increment ($)</label>
                      <input
                        type="number"
                        value={adminEditForm.minIncrement}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, minIncrement: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Entry Deposit ($)</label>
                      <input
                        type="number"
                        value={adminEditForm.registrationFee}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, registrationFee: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Auction Expiration Date/Time</label>
                      <input
                        type="datetime-local"
                        value={new Date(new Date(adminEditForm.endTime).getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 16)}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, endTime: new Date(e.target.value).toISOString() })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Account Region</label>
                      <input
                        type="text"
                        value={adminEditForm.region}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, region: e.target.value })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pokémon Collection Metrics */}
                <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/55 dark:bg-zinc-900/30 p-4">
                  <h4 className="font-black text-[#6133e1] uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pokémon Collection Stats
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shiny Count (Total)</label>
                      <input
                        type="number"
                        value={adminEditForm.shinyCount}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shinyCount: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Legendary Count</label>
                      <input
                        type="number"
                        value={adminEditForm.legendaryCount}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, legendaryCount: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Mythical Count</label>
                      <input
                        type="number"
                        value={adminEditForm.mythicalCount}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, mythicalCount: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Best Buddy Count</label>
                      <input
                        type="number"
                        value={adminEditForm.bestBuddyCount}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, bestBuddyCount: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shiny Pokémon</label>
                      <input
                        type="number"
                        value={adminEditForm.shinyPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shinyPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shiny Mythical</label>
                      <input
                        type="number"
                        value={adminEditForm.shinyMythical}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shinyMythical: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shiny Ultrabeasts</label>
                      <input
                        type="number"
                        value={adminEditForm.shinyUltrabeasts}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shinyUltrabeasts: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shiny Legendaries</label>
                      <input
                        type="number"
                        value={adminEditForm.shinyLegendaries}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shinyLegendaries: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Legendary Pokémon</label>
                      <input
                        type="number"
                        value={adminEditForm.legendaryPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, legendaryPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Ultrabeasts</label>
                      <input
                        type="number"
                        value={adminEditForm.ultrabeasts}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, ultrabeasts: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Mythical Pokémon</label>
                      <input
                        type="number"
                        value={adminEditForm.mythicalPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, mythicalPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Costume Shinies</label>
                      <input
                        type="number"
                        value={adminEditForm.costumeShinies}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, costumeShinies: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Hatched Shinies</label>
                      <input
                        type="number"
                        value={adminEditForm.hatchedShinies}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, hatchedShinies: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Location Bg Shiny Leg</label>
                      <input
                        type="number"
                        value={adminEditForm.locationBackgroundLegendaryShiny}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, locationBackgroundLegendaryShiny: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Special Bg Shiny Leg</label>
                      <input
                        type="number"
                        value={adminEditForm.specialBackgroundLegendaryShiny}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, specialBackgroundLegendaryShiny: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Dual Move Pokémon</label>
                      <input
                        type="number"
                        value={adminEditForm.dualMovePokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, dualMovePokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shadow Shiny Pokémon</label>
                      <input
                        type="number"
                        value={adminEditForm.shadowShinyPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shadowShinyPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 col-span-3">
                      <label className="text-zinc-500 font-medium">Top Pokémon Highlights (Comma Separated)</label>
                      <input
                        type="text"
                        value={adminEditForm.topPokemon}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, topPokemon: e.target.value })}
                        placeholder="Mewtwo(3950), Kyogre(3800)"
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. IV & Lucky Metrics */}
                <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4">
                  <h4 className="font-black text-[#6133e1] uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    IV & Lucky Metrics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Hundo Count (Total)</label>
                      <input
                        type="number"
                        value={adminEditForm.hundoPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, hundoPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shundo Count (Total)</label>
                      <input
                        type="number"
                        value={adminEditForm.shundoPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shundoPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Hundo Myth/Leg/UB</label>
                      <input
                        type="number"
                        value={adminEditForm.hundoMythicalLegendaryUltrabeast}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, hundoMythicalLegendaryUltrabeast: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shundo Myth/Leg/UB</label>
                      <input
                        type="number"
                        value={adminEditForm.shundoLegendaryMythicalUltrabeast}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shundoLegendaryMythicalUltrabeast: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Lucky Pokémon</label>
                      <input
                        type="number"
                        value={adminEditForm.luckyPokemons}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, luckyPokemons: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Lucky Legendaries</label>
                      <input
                        type="number"
                        value={adminEditForm.luckyLegendaries}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, luckyLegendaries: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Shiny Lucky Legendaries</label>
                      <input
                        type="number"
                        value={adminEditForm.shinyLuckyLegendaries}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, shinyLuckyLegendaries: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Legendary Poses</label>
                      <input
                        type="number"
                        value={adminEditForm.legendaryPoses}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, legendaryPoses: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Items & Storage Inventory */}
                <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4">
                  <h4 className="font-black text-[#6133e1] uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" />
                    Items & Storage Inventory
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">PokeCoins</label>
                      <input
                        type="number"
                        value={adminEditForm.pokeCoins}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, pokeCoins: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Rare Candy</label>
                      <input
                        type="number"
                        value={adminEditForm.rareCandy}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, rareCandy: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Fast TM</label>
                      <input
                        type="number"
                        value={adminEditForm.fastTm}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, fastTm: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Charged TM</label>
                      <input
                        type="number"
                        value={adminEditForm.chargedTm}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, chargedTm: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Elite Fast TM</label>
                      <input
                        type="number"
                        value={adminEditForm.eliteFastTm}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, eliteFastTm: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Elite Charged TM</label>
                      <input
                        type="number"
                        value={adminEditForm.eliteChargedTm}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, eliteChargedTm: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Incubators</label>
                      <input
                        type="number"
                        value={adminEditForm.incubators}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, incubators: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Lucky Eggs</label>
                      <input
                        type="number"
                        value={adminEditForm.luckyEggs}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, luckyEggs: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Lure Modules</label>
                      <input
                        type="number"
                        value={adminEditForm.lureModules}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, lureModules: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Premium Raid Pass</label>
                      <input
                        type="number"
                        value={adminEditForm.premiumRaidPass}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, premiumRaidPass: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Master Balls</label>
                      <input
                        type="number"
                        value={adminEditForm.masterBalls}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, masterBalls: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Raid Passes</label>
                      <input
                        type="number"
                        value={adminEditForm.raidPasses}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, raidPasses: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Super Rocket Radar</label>
                      <input
                        type="number"
                        value={adminEditForm.superRocketRadar}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, superRocketRadar: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Pokémon Storage</label>
                      <input
                        type="number"
                        value={adminEditForm.pokemonStorage}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, pokemonStorage: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Item Bag Storage</label>
                      <input
                        type="number"
                        value={adminEditForm.itemBagStorage}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, itemBagStorage: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Telemetry & Administration */}
                <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4">
                  <h4 className="font-black text-[#6133e1] uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Telemetry & Administration
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Total XP</label>
                      <input
                        type="number"
                        value={adminEditForm.xp}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, xp: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Pokedex Completed %</label>
                      <input
                        type="number"
                        value={adminEditForm.pokedexCompleted}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, pokedexCompleted: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Pokedex Reg Number</label>
                      <input
                        type="number"
                        value={adminEditForm.pokedexRegisteredNumber}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, pokedexRegisteredNumber: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Start Date</label>
                      <input
                        type="text"
                        value={adminEditForm.startDate}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, startDate: e.target.value })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Account Type</label>
                      <input
                        type="text"
                        value={adminEditForm.accountType}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, accountType: e.target.value })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Account Status</label>
                      <input
                        type="text"
                        value={adminEditForm.accountStatus}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, accountStatus: e.target.value })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Weekly Distance (km)</label>
                      <input
                        type="number"
                        value={adminEditForm.weeklyDistance}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, weeklyDistance: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Platinum Medals</label>
                      <input
                        type="number"
                        value={adminEditForm.platinumMedals}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, platinumMedals: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 font-medium">Bans/Warnings Count</label>
                      <input
                        type="number"
                        value={adminEditForm.bansCount}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, bansCount: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-1 focus:ring-[#6133e1] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAdminEditOpen(false)}
                  className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdminEdit}
                  disabled={isAdminActionLoading}
                  className="h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isAdminActionLoading ? "Saving..." : "Save Details"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Buy Now Payment Modal */}
      {isBuyNowOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUpiCheckoutData(null);
              setPaypalCheckoutData(null);
              setCryptoCheckoutData(null);
              setWiseCheckoutData(null);
              setPaymentStage("methods");
              setSelectedMethod(null);
              setIsBuyNowOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className="relative w-full max-w-6xl rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#111] p-6 lg:p-8 shadow-2xl text-zinc-900 dark:text-white transition-all duration-300 cursor-default overflow-y-auto max-h-[95vh] scrollbar-thin"
          >
            {/* Ambient background glows */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#6133e1]/5 dark:bg-[#6133e1]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => {
                setUpiCheckoutData(null);
                setPaypalCheckoutData(null);
                setCryptoCheckoutData(null);
                setWiseCheckoutData(null);
                setPaymentStage("methods");
                setSelectedMethod(null);
                setIsBuyNowOpen(false);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-955 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none z-20"
            >
              <X className="h-5.5 w-5.5" />
            </button>

            {/* Main Checkout Container Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 text-left">
              
              {/* Left Column: Interactive Forms (Stages) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                
                {/* STAGE 1: WISE CHECKOUT GATEWAY */}
                {paymentStage === "wise" && wiseCheckoutData ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Globe className="h-4.5 w-4.5 text-emerald-500" />
                        Wise Secure Gate
                      </h3>
                      <button
                        onClick={() => {
                          setWiseCheckoutData(null);
                          setPaymentStage("methods");
                          setSelectedMethod(null);
                        }}
                        className="text-[10px] font-bold text-zinc-550 hover:text-emerald-600 cursor-pointer bg-transparent border-none transition-colors"
                      >
                        Change Method
                      </button>
                    </div>
                    <WisePaymentCheckout
                      orderId={wiseCheckoutData.orderId}
                      amount={wiseCheckoutData.amount}
                      currency={wiseCheckoutData.currency}
                      customerEmail={wiseCheckoutData.email}
                      walletDiscountApplied={Math.min(buyNowPrice, walletCreditAmount)}
                      originalTotalPrice={buyNowPrice}
                    />
                  </div>
                ) : paymentStage === "crypto" && cryptoCheckoutData ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Coins className="h-4.5 w-4.5 text-amber-500" />
                        Crypto Secure Gate
                      </h3>
                      <button
                        onClick={() => {
                          setCryptoCheckoutData(null);
                          setPaymentStage("methods");
                          setSelectedMethod(null);
                        }}
                        className="text-[10px] font-bold text-zinc-550 hover:text-amber-600 cursor-pointer bg-transparent border-none transition-colors"
                      >
                        Change Method
                      </button>
                    </div>
                    <CryptoPaymentCheckout
                      orderId={cryptoCheckoutData.orderId}
                      amount={cryptoCheckoutData.amount}
                      customerEmail={cryptoCheckoutData.email}
                      walletDiscountApplied={Math.min(buyNowPrice, walletCreditAmount)}
                      originalTotalPrice={buyNowPrice}
                    />
                  </div>
                ) : paymentStage === "paypal" && paypalCheckoutData ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <DollarSign className="h-4.5 w-4.5 text-blue-500" />
                        PayPal Secure Gate
                      </h3>
                      <button
                        onClick={() => {
                          setPaypalCheckoutData(null);
                          setPaymentStage("methods");
                          setSelectedMethod(null);
                        }}
                        className="text-[10px] font-bold text-zinc-505 hover:text-blue-550 dark:hover:text-blue-400 cursor-pointer bg-transparent border-none transition-colors"
                      >
                        Change Method
                      </button>
                    </div>
                    <PayPalPaymentCheckout
                      orderId={paypalCheckoutData.orderId}
                      amount={paypalCheckoutData.amount}
                      customerEmail={paypalCheckoutData.email}
                      walletDiscountApplied={Math.min(buyNowPrice, walletCreditAmount)}
                      originalTotalPrice={buyNowPrice}
                    />
                  </div>
                ) : paymentStage === "upi" && upiCheckoutData ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <ScanQrCode className="h-4.5 w-4.5 text-[#6133e1]" />
                        UPI Secure Gate
                      </h3>
                      <button
                        onClick={() => {
                          setUpiCheckoutData(null);
                          setPaymentStage("methods");
                          setSelectedMethod(null);
                        }}
                        className="text-[10px] font-bold text-zinc-505 hover:text-[#6133e1] dark:hover:text-purple-400 cursor-pointer bg-transparent border-none transition-colors"
                      >
                        Change Method
                      </button>
                    </div>
                    <UpiPaymentCheckout
                      orderId={upiCheckoutData.orderId}
                      amount={upiCheckoutData.amount}
                      customerEmail={upiCheckoutData.email}
                      walletDiscountApplied={Math.min(buyNowPrice, walletCreditAmount)}
                      originalTotalPrice={buyNowPrice}
                    />
                  </div>
                ) : (
                  /* STAGE 3: CHOOSE PAYMENT METHOD (6 OPTIONS) */
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="space-y-1.5 text-left pb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h2 className="text-lg font-black tracking-tight flex items-center gap-2 uppercase text-zinc-955 dark:text-white">
                        <Sparkles className="h-5 w-5 text-[#6133e1]" />
                        Select Gateway
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {finalBuyNowPrice === 0 
                          ? "Your wallet balance fully covers this purchase. No external gateway payment is required!"
                          : "Choose your checkout method. Automated validation is available for UPI payments."}
                      </p>
                    </div>

                    {finalBuyNowPrice === 0 ? (
                      <div className="pt-4">
                        <button
                          onClick={async () => {
                            setLoadingMethod("WALLET");
                            try {
                              const res = await createBuyNowOrderAction(auction._id);
                              if (res.success && res.orderId) {
                                const orderId = res.orderId;
                                const userId = (session?.user as any)?.id as string || "N/A";
                                const username = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "User";
                                const db = getDb();
                                const chatId = `order-${orderId}`;
                                const chatRef = doc(db, "supportChats", chatId);

                                const messageText = `📦 ORDER COMPLETED (Paid via Wallet)
----------------------------------
Order ID: ${orderId}
Auction/Listing: ${auction.listingId.title}
Subtotal Price: $${buyNowPrice.toFixed(2)} USD
Wallet Balance Applied: $${buyNowPrice.toFixed(2)} USD
Remaining Amount Paid: $0.00 USD
Payment Method: Wallet Balance (Full Credit)

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${session?.user?.email || "N/A"}
User ID: ${userId}

This Buy Now order has been completed automatically using your wallet balance. Admin will deliver your account shortly!`;

                                await setDoc(chatRef, {
                                  userId,
                                  username,
                                  email: session?.user?.email ?? "",
                                  type: "order",
                                  orderId,
                                  title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
                                  lastMessage: "Paid automatically via wallet credit.",
                                  lastMessageAt: serverTimestamp(),
                                  unreadByAdmin: 1,
                                  unreadByUser: 0,
                                  createdAt: serverTimestamp(),
                                  paymentMethod: "Wallet",
                                });

                                const msgsRef = collection(db, "supportChats", chatId, "messages");
                                await addDoc(msgsRef, {
                                  text: messageText,
                                  sender: "user",
                                  senderName: username,
                                  timestamp: serverTimestamp(),
                                  read: false,
                                });

                                await addDoc(msgsRef, {
                                  text: `System: Buy Now Order #${orderId.substring(0, 8).toUpperCase()} has been successfully created and fully paid via wallet balance. Support representative will deliver your account details soon!`,
                                  sender: "admin",
                                  senderName: "Support Team",
                                  timestamp: serverTimestamp(),
                                  read: false,
                                });

                                setIsBuyNowOpen(false);
                                window.location.href = `/chat?chatId=${chatId}`;
                              } else {
                                alert("Error: " + (res.error || "Failed to complete order"));
                              }
                            } catch (err) {
                              console.error("Wallet Buy Now checkout error:", err);
                              alert("Failed to pay using wallet balance. Please try again.");
                            } finally {
                              setLoadingMethod(null);
                            }
                          }}
                          disabled={loadingMethod !== null}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingMethod === "WALLET" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Confirm Wallet Purchase ($0.00)"
                          )}
                        </button>
                      </div>
                    ) : (
                      /* 6 Payment Methods Grid */
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

                        {/* 1. UPI */}
                        <button
                          onClick={async () => {
                            setLoadingMethod("UPI");
                            try {
                              const res = await createBuyNowOrderAction(auction._id);
                              if (res.success && res.orderId) {
                                const inrRate = useCurrencyStore.getState().rates.INR || 83.5;
                                const amountInINR = Math.round(finalBuyNowPrice * inrRate);

                                setUpiCheckoutData({
                                  orderId: res.orderId,
                                  amount: amountInINR,
                                  email: session?.user?.email || "customer@store.com",
                                });
                                setSelectedMethod("UPI");
                                setPaymentStage("upi");
                              } else {
                              alert("Error: " + (res.error || "Failed to create order"));
                            }
                          } catch (err) {
                            console.error("UPI checkout error:", err);
                            alert("Failed to initiate UPI transaction. Please try again.");
                          } finally {
                            setLoadingMethod(null);
                          }
                        }}
                        disabled={loadingMethod !== null}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                          loadingMethod !== null
                            ? "opacity-55 cursor-not-allowed"
                            : "hover:border-[#6133e1] dark:hover:border-[#6133e1]/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:bg-[#6133e1]/20">
                            {loadingMethod === "UPI" ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <ScanQrCode className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">UPI Transfer</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {loadingMethod === "UPI" ? "Generating UPI Gate..." : "Zero fee instant payments"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase border border-[#6133e1]/10">Instant</span>
                        </div>
                      </button>

                      {/* 2. Credit Card */}
                      <button
                        onClick={async () => {
                          setLoadingMethod("Card");
                          try {
                            await handleManualOrderChat("Card");
                          } finally {
                            setLoadingMethod(null);
                          }
                        }}
                        disabled={loadingMethod !== null}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                          loadingMethod !== null
                            ? "opacity-55 cursor-not-allowed"
                            : "hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                            {loadingMethod === "Card" ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <AnimatedCardIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Card, Cash App, Apple Pay</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {loadingMethod === "Card" ? "Opening support chat..." : "Global card processing"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase border border-blue-500/10">Manual</span>
                        </div>
                      </button>

                      {/* 3. Crypto */}
                      <button
                        onClick={async () => {
                          setLoadingMethod("Crypto");
                          try {
                            const res = await createBuyNowOrderAction(auction._id);
                            if (res.success && res.orderId) {
                              setCryptoCheckoutData({
                                orderId: res.orderId,
                                amount: finalBuyNowPrice,
                                email: session?.user?.email || "customer@store.com",
                              });
                              setSelectedMethod("Crypto");
                              setPaymentStage("crypto");
                            } else {
                              alert("Error: " + (res.error || "Failed to create order"));
                            }
                          } catch (err) {
                            console.error("Crypto checkout error:", err);
                            alert("Failed to initiate Crypto transaction. Please try again.");
                          } finally {
                            setLoadingMethod(null);
                          }
                        }}
                        disabled={loadingMethod !== null}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                          loadingMethod !== null
                            ? "opacity-55 cursor-not-allowed"
                            : "hover:border-amber-500 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                            {loadingMethod === "Crypto" ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <AnimatedCryptoIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Crypto</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {loadingMethod === "Crypto" ? "Generating Crypto Gate..." : "Secure USDT, BTC, ETH"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-500/10">Instant</span>
                        </div>
                      </button>

                      {/* 4. PayPal */}
                      <button
                        onClick={async () => {
                          setLoadingMethod("PayPal");
                          try {
                            const res = await createBuyNowOrderAction(auction._id);
                            if (res.success && res.orderId) {
                              const eurRate = useCurrencyStore.getState().rates.EUR || 0.92;
                              const amountInEUR = Math.round(finalBuyNowPrice * eurRate * 100) / 100;

                              setPaypalCheckoutData({
                                orderId: res.orderId,
                                amount: amountInEUR,
                                email: session?.user?.email || "customer@store.com",
                              });
                              setSelectedMethod("PayPal");
                              setPaymentStage("paypal");
                            } else {
                              alert("Error: " + (res.error || "Failed to create order"));
                            }
                          } catch (err) {
                            console.error("PayPal checkout error:", err);
                            alert("Failed to initiate PayPal transaction. Please try again.");
                          } finally {
                            setLoadingMethod(null);
                          }
                        }}
                        disabled={loadingMethod !== null}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                          loadingMethod !== null
                        ? "opacity-55 cursor-not-allowed"
                        : "hover:border-sky-500 dark:hover:border-sky-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                            {loadingMethod === "PayPal" ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <PaypalIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">PayPal</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {loadingMethod === "PayPal" ? "Generating PayPal Gate..." : "Global instant verification"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-sky-500/10 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full font-bold uppercase border border-sky-500/10">Instant</span>
                        </div>
                      </button>

                      {(() => {
                        const isWiseDisabled = finalBuyNowPrice < 5.00;

                        return (
                          <button
                            onClick={async () => {
                              if (isWiseDisabled) return;
                              setLoadingMethod("Wise");
                              try {
                                const res = await createBuyNowOrderAction(auction._id);
                                if (res.success && res.orderId) {
                                  const selectedCurrency = useCurrencyStore.getState().currency;
                                  const rate = useCurrencyStore.getState().rates[selectedCurrency] || 1.0;
                                  const amountInSelected = Math.round(finalBuyNowPrice * rate * 100) / 100;

                                  setWiseCheckoutData({
                                    orderId: res.orderId,
                                    amount: amountInSelected,
                                    currency: selectedCurrency,
                                    email: session?.user?.email || "customer@store.com",
                                  });
                                  setSelectedMethod("Wise");
                                  setPaymentStage("wise");
                                } else {
                                  alert("Error: " + (res.error || "Failed to create order"));
                                }
                              } catch (err) {
                                console.error("Wise checkout error:", err);
                                alert("Failed to initiate Wise transaction. Please try again.");
                              } finally {
                                setLoadingMethod(null);
                              }
                            }}
                            disabled={isWiseDisabled || loadingMethod !== null}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                              (isWiseDisabled || loadingMethod !== null)
                                ? "opacity-55 cursor-not-allowed"
                                : "hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                                {loadingMethod === "Wise" ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <WiseIcon className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Wise</span>
                                <span className={cn("text-[10px] font-medium block", isWiseDisabled ? "text-red-500" : "text-zinc-500 dark:text-zinc-400")}>
                                  {loadingMethod === "Wise" ? "Generating Wise Gate..." : isWiseDisabled ? "Min $5.00 required" : "Direct international transfer"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border",
                                isWiseDisabled
                                  ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/10"
                                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              )}>
                                {isWiseDisabled ? "Disabled" : "Instant"}
                              </span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* 6. Others */}
                      <button
                        onClick={async () => {
                          setLoadingMethod("Others");
                          try {
                            await handleManualOrderChat("Others");
                          } finally {
                            setLoadingMethod(null);
                          }
                        }}
                        disabled={loadingMethod !== null}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                          loadingMethod !== null
                            ? "opacity-55 cursor-not-allowed"
                            : "hover:border-zinc-400 dark:hover:border-zinc-400/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 dark:bg-zinc-500/20">
                            {loadingMethod === "Others" ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <CircleDot className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Others</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {loadingMethod === "Others" ? "Opening support chat..." : "Payoneer, Alipay, Custom chat"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold uppercase">Manual</span>
                        </div>
                      </button>

                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-center gap-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>🔒 256-bit Secure manual billing protocol</span>
                    </div>
                  </>
                )}
              </div>
            )}

              </div>

              {/* Right Column: SaaS Order Summary Invoice */}
              <div className="lg:col-span-5 xl:col-span-4 bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-5 space-y-5 lg:sticky lg:top-0">
                <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-300 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/60 pb-2 flex items-center justify-between">
                  <span>Order Invoice</span>
                  <span className="font-mono text-[9px] font-normal text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
                    VERIFIED
                  </span>
                </h3>

                {/* Account card preview */}
                <div className="flex gap-3">
                  {screenshots && screenshots[0] ? (
                    <div className="w-14 h-14 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shrink-0 bg-white dark:bg-zinc-900">
                      <img
                        src={screenshots[0]}
                        alt="Account preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shrink-0 bg-zinc-105 dark:bg-zinc-850 flex items-center justify-center text-zinc-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  <div className="space-y-1 text-left min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {auction.listingId.title}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700">
                        LVL {auction.listingId.level}
                      </span>
                      {auction.listingId.team !== "NONE" && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black border uppercase",
                          teamColors[auction.listingId.team]
                        )}>
                          {auction.listingId.team}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-450 dark:text-zinc-500 font-bold pt-0.5">
                      <span>✨ {auction.listingId.shinyCount} Shiny</span>
                      <span>•</span>
                      <span>🏆 {auction.listingId.legendaryCount} Legend</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs border-y border-zinc-200 dark:border-zinc-800/60 py-3 font-medium">
                  <div className="flex justify-between text-zinc-555 dark:text-zinc-400">
                    <span>Listing Buy Now Price</span>
                    <span className="text-zinc-855 dark:text-zinc-200 font-bold">
                      <PriceDisplay amountInUSD={buyNowPrice} />
                    </span>
                  </div>
                  {hasWalletCredit && (
                    <div className="flex justify-between text-zinc-555 dark:text-zinc-400">
                      <span>Wallet Credit Applied</span>
                      <span className="text-emerald-500 font-bold">
                        -<PriceDisplay amountInUSD={buyNowPriceDiscount} />
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-555 dark:text-zinc-400">
                    <span>Secure Protection</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-black uppercase text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Free</span>
                  </div>
                  <div className="flex justify-between text-zinc-555 dark:text-zinc-400">
                    <span>Estimated Tax / VAT</span>
                    <span className="text-zinc-800 dark:text-zinc-300 font-bold">$0.00</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-zinc-805 dark:text-zinc-300">Total Due</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-[#6133e1] dark:text-purple-400 tracking-tight">
                      <PriceDisplay amountInUSD={finalBuyNowPrice} />
                    </div>
                    {/* Show INR amount if UPI selected */}
                    {selectedMethod === "UPI" && (
                      <div className="text-[10px] text-zinc-450 dark:text-zinc-550 font-bold mt-0.5">
                        ≈ ₹{Math.round(finalBuyNowPrice * (useCurrencyStore.getState().rates.INR || 83.5)).toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 space-y-2.5 text-left">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">Buyer Protection Guarantee</p>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-normal">Full protection. Funds are held secure until you verify the account.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">Anti-Recall Warranty</p>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-normal">Every account passes rigorous safety logs and features a recall warrant.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )} 
      {/* ====================================================== */}
      {/* WINNER PAYMENT MODAL */}
      {/* ====================================================== */}
      {isWinnerPaymentOpen && (() => {
        const winAmount = activeBid;
        const winDiscount = hasWalletCredit ? Math.min(winAmount, walletCreditAmount) : 0;
        const finalWinPrice = Math.max(0, winAmount - winDiscount);
        const isWinnerWiseDisabled = finalWinPrice < 5;

        const closeWinnerModal = () => {
          setWinnerUpiCheckoutData(null);
          setWinnerPaypalCheckoutData(null);
          setWinnerCryptoCheckoutData(null);
          setWinnerWiseCheckoutData(null);
          setWinnerPaymentStage("methods");
          setIsWinnerPaymentOpen(false);
        };

        const handleWinnerManualChat = async (method: "Card" | "Others") => {
          const userId = (session?.user as any)?.id as string;
          const username = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "User";
          const country = (session?.user as any)?.country || "N/A";
          try {
            const res = await createAuctionWinnerOrderAction(auction._id);
            if (res.success && res.orderId) {
              const orderId = res.orderId;
              const db = getDb();
              const chatId = `order-${orderId}`;
              const chatRef = doc(db, "supportChats", chatId);
              const methodLabel = method === "Card" ? "Card, Cash App, Apple Pay" : "Others";
              const subtotalText = `\nSubtotal (Winning Bid): ${convert(winAmount).formatted}`;
              const walletText = winDiscount > 0 ? `\nWallet Discount: ${convert(winDiscount).formatted}` : "";
              const finalText = `\nFinal Amount Due: ${convert(finalWinPrice).formatted}`;
              const msgText = `🏆 AUCTION WIN PAYMENT\n----------------------------------\nOrder ID: ${orderId}\nListing: ${auction.listingId.title}${subtotalText}${walletText}${finalText}\nPayment Method: ${methodLabel}\n\n👤 USER DETAILS:\n----------------------------------\nUsername: ${username}\nEmail: ${session?.user?.email || "N/A"}\nUser ID: ${userId}\n🌍 Country: ${country}\n\nPlease guide me on completing my auction payment!`;
              await setDoc(chatRef, {
                userId, username, email: session?.user?.email ?? "", type: "order", orderId,
                title: `Auction Win #${orderId.substring(0, 8).toUpperCase()}`,
                lastMessage: `Auction win payment started via ${methodLabel}.`,
                lastMessageAt: serverTimestamp(), unreadByAdmin: 1, unreadByUser: 0, createdAt: serverTimestamp(),
              });
              const msgsRef = collection(db, "supportChats", chatId, "messages");
              await addDoc(msgsRef, { text: msgText, sender: "user", senderName: username, timestamp: serverTimestamp(), read: false });
              await addDoc(msgsRef, { text: `System: Hi ${username}! We've received your auction win order. A support team member will shortly guide you through the payment.`, sender: "admin", senderName: "Support Team", timestamp: serverTimestamp(), read: false });
              closeWinnerModal();
              window.location.href = `/chat?chatId=${chatId}`;
            } else {
              alert("Error: " + (res.error || "Please try again."));
            }
          } catch (err) {
            console.error("Winner manual chat error:", err);
            alert("Failed to initiate support chat. Please try again.");
          }
        };

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) closeWinnerModal(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
          >
            <div className="relative w-full max-w-lg rounded-2xl border border-violet-500/20 bg-white dark:bg-[#111] p-6 shadow-2xl text-zinc-900 dark:text-white transition-all duration-300 cursor-default overflow-y-auto max-h-[90vh]">
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#6133e1]/5 rounded-full blur-3xl pointer-events-none" />
              <button onClick={closeWinnerModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer bg-transparent border-none z-10">
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-5 relative z-10">
                {/* Header */}
                <div className="space-y-1 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#6133e1]" />
                    <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white">Complete Auction Payment</h2>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {auction.listingId.title} — Winning Bid: <strong className="text-zinc-700 dark:text-zinc-200"><PriceDisplay amountInUSD={winAmount} /></strong>
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Winning Bid</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200"><PriceDisplay amountInUSD={winAmount} /></span>
                  </div>
                  {winDiscount > 0 && (
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Wallet Credit</span>
                      <span className="font-bold text-emerald-500">−<PriceDisplay amountInUSD={winDiscount} /></span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                    <span>Total Due</span>
                    <span className="text-[#6133e1]"><PriceDisplay amountInUSD={finalWinPrice} /></span>
                  </div>
                </div>

                {/* Gateway stages */}
                {winnerPaymentStage === "wise" && winnerWiseCheckoutData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-500" />Wise Gate</h3>
                      <button onClick={() => { setWinnerWiseCheckoutData(null); setWinnerPaymentStage("methods"); }} className="text-[10px] font-bold text-zinc-500 hover:text-emerald-600 cursor-pointer bg-transparent border-none">Change Method</button>
                    </div>
                    <WisePaymentCheckout orderId={winnerWiseCheckoutData.orderId} amount={winnerWiseCheckoutData.amount} currency={winnerWiseCheckoutData.currency} customerEmail={winnerWiseCheckoutData.email} walletDiscountApplied={winDiscount} originalTotalPrice={winAmount} />
                  </div>
                ) : winnerPaymentStage === "crypto" && winnerCryptoCheckoutData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Coins className="h-4 w-4 text-amber-500" />Crypto Gate</h3>
                      <button onClick={() => { setWinnerCryptoCheckoutData(null); setWinnerPaymentStage("methods"); }} className="text-[10px] font-bold text-zinc-500 hover:text-amber-600 cursor-pointer bg-transparent border-none">Change Method</button>
                    </div>
                    <CryptoPaymentCheckout orderId={winnerCryptoCheckoutData.orderId} amount={winnerCryptoCheckoutData.amount} customerEmail={winnerCryptoCheckoutData.email} walletDiscountApplied={winDiscount} originalTotalPrice={winAmount} />
                  </div>
                ) : winnerPaymentStage === "paypal" && winnerPaypalCheckoutData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-blue-500" />PayPal Gate</h3>
                      <button onClick={() => { setWinnerPaypalCheckoutData(null); setWinnerPaymentStage("methods"); }} className="text-[10px] font-bold text-zinc-500 hover:text-blue-600 cursor-pointer bg-transparent border-none">Change Method</button>
                    </div>
                    <PayPalPaymentCheckout orderId={winnerPaypalCheckoutData.orderId} amount={winnerPaypalCheckoutData.amount} customerEmail={winnerPaypalCheckoutData.email} walletDiscountApplied={winDiscount} originalTotalPrice={winAmount} />
                  </div>
                ) : winnerPaymentStage === "upi" && winnerUpiCheckoutData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm flex items-center gap-1.5"><ScanQrCode className="h-4 w-4 text-[#6133e1]" />UPI Gate</h3>
                      <button onClick={() => { setWinnerUpiCheckoutData(null); setWinnerPaymentStage("methods"); }} className="text-[10px] font-bold text-zinc-500 hover:text-violet-600 cursor-pointer bg-transparent border-none">Change Method</button>
                    </div>
                    <UpiPaymentCheckout orderId={winnerUpiCheckoutData.orderId} amount={winnerUpiCheckoutData.amount} customerEmail={winnerUpiCheckoutData.email} walletDiscountApplied={winDiscount} originalTotalPrice={winAmount} />
                  </div>
                ) : finalWinPrice === 0 ? (
                  /* Wallet-fully-covered */
                  <button
                    onClick={async () => {
                      setWinnerLoadingMethod("WALLET");
                      try {
                        const res = await createAuctionWinnerOrderAction(auction._id);
                        if (res.success && res.orderId) {
                          const orderId = res.orderId;
                          const userId = (session?.user as any)?.id as string;
                          const username = (session?.user as any)?.username || session?.user?.name || "User";
                          const db = getDb();
                          const chatId = `order-${orderId}`;
                          await setDoc(doc(db, "supportChats", chatId), {
                            userId, username, email: session?.user?.email ?? "", type: "order", orderId,
                            title: `Auction Win #${orderId.substring(0, 8).toUpperCase()}`,
                            lastMessage: "Paid via wallet balance.",
                            lastMessageAt: serverTimestamp(), unreadByAdmin: 1, unreadByUser: 0, createdAt: serverTimestamp(),
                          });
                          const msgsRef = collection(db, "supportChats", chatId, "messages");
                          await addDoc(msgsRef, { text: `🏆 AUCTION WIN — WALLET PAYMENT\n----------------------------------\nOrder ID: ${orderId}\nListing: ${auction.listingId.title}\nWinning Bid: ${convert(winAmount).formatted}\nWallet Applied: ${convert(winDiscount).formatted}\nFinal Due: $0.00\n\nPaid automatically via wallet balance!`, sender: "user", senderName: username, timestamp: serverTimestamp(), read: false });
                          await addDoc(msgsRef, { text: `System: Your auction win for ${auction.listingId.title} has been fully paid using wallet credit. Account will be delivered shortly!`, sender: "admin", senderName: "Support Team", timestamp: serverTimestamp(), read: false });
                          closeWinnerModal();
                          window.location.href = `/chat?chatId=${chatId}`;
                        } else { alert("Error: " + (res.error || "Failed")); }
                      } catch (err) { console.error(err); alert("Failed. Please try again."); }
                      finally { setWinnerLoadingMethod(null); }
                    }}
                    disabled={winnerLoadingMethod !== null}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-xs tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {winnerLoadingMethod === "WALLET" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Wallet Payment ($0.00)"}
                  </button>
                ) : (
                  /* Payment method selection grid */
                  <div className="grid grid-cols-2 gap-3">
                    {/* UPI */}
                    <button onClick={async () => {
                      setWinnerLoadingMethod("UPI");
                      try {
                        const res = await createAuctionWinnerOrderAction(auction._id);
                        if (res.success && res.orderId) {
                          const inrRate = useCurrencyStore.getState().rates.INR || 83.5;
                          setWinnerUpiCheckoutData({ orderId: res.orderId, amount: Math.round(finalWinPrice * inrRate), email: session?.user?.email || "" });
                          setWinnerPaymentStage("upi");
                        } else { alert(res.error || "Failed"); }
                      } catch (err) { console.error(err); } finally { setWinnerLoadingMethod(null); }
                    }} disabled={winnerLoadingMethod !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-[#6133e1] hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer transition disabled:opacity-50">
                      {winnerLoadingMethod === "UPI" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanQrCode className="h-5 w-5 text-[#6133e1]" />}
                      <span className="text-xs font-black text-zinc-900 dark:text-white">UPI</span>
                    </button>
                    {/* PayPal */}
                    <button onClick={async () => {
                      setWinnerLoadingMethod("PayPal");
                      try {
                        const res = await createAuctionWinnerOrderAction(auction._id);
                        if (res.success && res.orderId) {
                          setWinnerPaypalCheckoutData({ orderId: res.orderId, amount: finalWinPrice, email: session?.user?.email || "" });
                          setWinnerPaymentStage("paypal");
                        } else { alert(res.error || "Failed"); }
                      } catch (err) { console.error(err); } finally { setWinnerLoadingMethod(null); }
                    }} disabled={winnerLoadingMethod !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-blue-500 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer transition disabled:opacity-50">
                      {winnerLoadingMethod === "PayPal" ? <Loader2 className="h-5 w-5 animate-spin" /> : <PaypalIcon className="h-5 w-5" />}
                      <span className="text-xs font-black text-zinc-900 dark:text-white">PayPal</span>
                    </button>
                    {/* Crypto */}
                    <button onClick={async () => {
                      setWinnerLoadingMethod("Crypto");
                      try {
                        const res = await createAuctionWinnerOrderAction(auction._id);
                        if (res.success && res.orderId) {
                          setWinnerCryptoCheckoutData({ orderId: res.orderId, amount: finalWinPrice, email: session?.user?.email || "" });
                          setWinnerPaymentStage("crypto");
                        } else { alert(res.error || "Failed"); }
                      } catch (err) { console.error(err); } finally { setWinnerLoadingMethod(null); }
                    }} disabled={winnerLoadingMethod !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-amber-500 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer transition disabled:opacity-50">
                      {winnerLoadingMethod === "Crypto" ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedCryptoIcon className="h-5 w-5" />}
                      <span className="text-xs font-black text-zinc-900 dark:text-white">Crypto</span>
                    </button>
                    {/* Wise */}
                    <button onClick={async () => {
                      if (isWinnerWiseDisabled) return;
                      setWinnerLoadingMethod("Wise");
                      try {
                        const res = await createAuctionWinnerOrderAction(auction._id);
                        if (res.success && res.orderId) {
                          const cur = useCurrencyStore.getState().currency;
                          const rate = useCurrencyStore.getState().rates[cur] || 1;
                          setWinnerWiseCheckoutData({ orderId: res.orderId, amount: Math.round(finalWinPrice * rate * 100) / 100, currency: cur, email: session?.user?.email || "" });
                          setWinnerPaymentStage("wise");
                        } else { alert(res.error || "Failed"); }
                      } catch (err) { console.error(err); } finally { setWinnerLoadingMethod(null); }
                    }} disabled={isWinnerWiseDisabled || winnerLoadingMethod !== null} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition", isWinnerWiseDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-emerald-500 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer")}>
                      {winnerLoadingMethod === "Wise" ? <Loader2 className="h-5 w-5 animate-spin" /> : <WiseIcon className="h-5 w-5" />}
                      <span className="text-xs font-black text-zinc-900 dark:text-white">{isWinnerWiseDisabled ? "Wise (Min $5)" : "Wise"}</span>
                    </button>
                    {/* Card */}
                    <button onClick={async () => {
                      setWinnerLoadingMethod("Card");
                      try { await handleWinnerManualChat("Card"); } finally { setWinnerLoadingMethod(null); }
                    }} disabled={winnerLoadingMethod !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-400 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer transition disabled:opacity-50">
                      {winnerLoadingMethod === "Card" ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedCardIcon className="h-5 w-5" />}
                      <span className="text-xs font-black text-zinc-900 dark:text-white">Card</span>
                    </button>
                    {/* Others */}
                    <button onClick={async () => {
                      setWinnerLoadingMethod("Others");
                      try { await handleWinnerManualChat("Others"); } finally { setWinnerLoadingMethod(null); }
                    }} disabled={winnerLoadingMethod !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-400 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer transition disabled:opacity-50">
                      {winnerLoadingMethod === "Others" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CircleDot className="h-5 w-5 text-zinc-500" />}
                      <span className="text-xs font-black text-zinc-900 dark:text-white">Others</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>🔒 Secure payment — buyer protected</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Zoom Lightbox Modal */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close button */}
          <button 
            type="button"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            onClick={() => setIsZoomOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Navigation Controls in Zoom Modal if multiple screenshots */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Container with native pinch zoom capability */}
          <div 
            className="relative max-w-[90vw] max-h-[85vh] overflow-auto flex items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[activeImgIndex]}
              alt="Zoomed preview screenshot"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 hover:scale-110 cursor-zoom-out"
              onClick={() => setIsZoomOpen(false)}
            />
          </div>

          {/* Image index indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
            {activeImgIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
