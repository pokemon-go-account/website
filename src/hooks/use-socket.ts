import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchAuctionRealtime, placeAuctionBid } from "@/features/auctions/actions";
import { getDb } from "@/lib/firestore";
import { doc, onSnapshot } from "firebase/firestore";

export interface BidHistoryItem {
  _id: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export function useSocket(
  auctionId?: string,
  initialIsRegistered = false,
  initialStatus = "SCHEDULED",
  initialEndTime = "",
  initialHighestBidderName: string | null = null
) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [highestBidderId, setHighestBidderId] = useState<string | null>(null);
  const [highestBidderName, setHighestBidderName] = useState<string | null>(initialHighestBidderName);
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [status, setStatus] = useState<string>(initialStatus);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [hasPendingBuyNow, setHasPendingBuyNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    let isMounted = true;

    // 1. Initial single fetch to populate user registration & initial state
    const fetchInitial = async () => {
      const res = await fetchAuctionRealtime(auctionId);
      if (!isMounted) return;

      if (res.success && res.currentHighestBid !== undefined) {
        setIsConnected(true);
        setCurrentBid(res.currentHighestBid);
        setHighestBidderId(res.highestBidderId ?? null);
        setHighestBidderName(res.highestBidderName ?? null);
        setIsRegistered(!!res.isRegistered);
        setHasPendingBuyNow(!!res.hasPendingBuyNow);
        if (res.status) setStatus(res.status);
        if (res.endTime) setEndTime(res.endTime);
        if (res.bids) setBidHistory(res.bids);
      } else {
        setError(res.error || "Failed to sync auction telemetry.");
      }
    };

    fetchInitial();

    // 2. Client-side Realtime WebSocket stream via Firestore onSnapshot (Zero Vercel Invocations)
    const db = getDb();
    const auctionRef = doc(db, "liveAuctions", auctionId);

    const unsub = onSnapshot(
      auctionRef,
      (snapshot) => {
        if (!isMounted || !snapshot.exists()) return;
        const data = snapshot.data();

        setIsConnected(true);
        if (data.currentHighestBid !== undefined) setCurrentBid(data.currentHighestBid);
        if (data.highestBidderId !== undefined) setHighestBidderId(data.highestBidderId);
        if (data.highestBidderName !== undefined) setHighestBidderName(data.highestBidderName);
        if (data.status) setStatus(data.status);
        if (data.endTime) setEndTime(data.endTime);
        if (Array.isArray(data.bids)) setBidHistory(data.bids);
      },
      (err) => {
        console.warn("[Firestore LiveRoom] Snapshot listener warning:", err.message);
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [auctionId, session?.user?.id]);

  const placeBid = useCallback(async (amount: number) => {
    if (!auctionId) {
      setError("No active auction room context.");
      return;
    }

    setError(null);
    const res = await placeAuctionBid(auctionId, amount);

    if (!res.success) {
      setError(res.error || "Failed to place bid.");
    } else {
      // Optmistic UI updates for ultra-responsive feel
      if (res.currentHighestBid !== undefined) {
        setCurrentBid(res.currentHighestBid);
      }
      if (res.highestBidderId) {
        setHighestBidderId(res.highestBidderId);
      }
    }
  }, [auctionId]);

  return {
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
  };
}
