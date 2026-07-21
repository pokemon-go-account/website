import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { placeAuctionBid } from "@/features/auctions/actions";
import { getDb } from "@/lib/firestore";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";

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
  initialHighestBidderName: string | null = null,
  initialBids: BidHistoryItem[] = [],
  initialCurrentBid: number | null = null,
  initialHighestBidderId: string | null = null,
  initialViewers = 1
) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [currentBid, setCurrentBid] = useState<number | null>(initialCurrentBid);
  const [highestBidderId, setHighestBidderId] = useState<string | null>(initialHighestBidderId);
  const [highestBidderName, setHighestBidderName] = useState<string | null>(initialHighestBidderName);
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [status, setStatus] = useState<string>(initialStatus);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>(initialBids);
  const [viewers, setViewers] = useState<number>(initialViewers);
  const [hasPendingBuyNow, setHasPendingBuyNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    let isMounted = true;

    // 1. Client-side Realtime WebSocket stream via Firestore onSnapshot (Zero Vercel Invocations)
    const db = getDb();
    const auctionRef = doc(db, "liveAuctions", auctionId);

    setIsConnected(true);

    // Increment viewer count in Firestore directly on mount (use setDoc with merge in case doc doesn't exist)
    setDoc(auctionRef, { viewers: increment(1) }, { merge: true }).catch((err) => {
      console.warn("[Firestore LiveRoom] Failed to increment viewers:", err.message);
    });

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
        if (data.viewers !== undefined) setViewers(data.viewers);
        if (Array.isArray(data.bids)) setBidHistory(data.bids);
      },
      (err) => {
        console.warn("[Firestore LiveRoom] Snapshot listener warning:", err.message);
      }
    );

    return () => {
      isMounted = false;
      unsub();
      // Decrement viewer count in Firestore directly on unmount (use setDoc with merge in case doc doesn't exist)
      setDoc(auctionRef, { viewers: increment(-1) }, { merge: true }).catch((err) => {
        console.warn("[Firestore LiveRoom] Failed to decrement viewers:", err.message);
      });
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
      // Optimistic UI updates for ultra-responsive feel
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
    viewers,
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
