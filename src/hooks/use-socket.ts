import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchAuctionRealtime, placeAuctionBid } from "@/features/auctions/actions";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    let isMounted = true;

    // High frequency poll query function
    const pollAuctionState = async () => {
      const res = await fetchAuctionRealtime(auctionId);
      if (!isMounted) return;

      if (res.success && res.currentHighestBid !== undefined) {
        setIsConnected(true);
        setCurrentBid(res.currentHighestBid);
        // Server returns a boolean (isCurrentUserHighestBidder) instead of the raw ObjectId.
        // We use the current user's session ID as a sentinel so comparisons like
        // `highestBidderId === session?.user?.id` in the UI continue to work correctly.
        if (res.isCurrentUserHighestBidder !== undefined) {
          setHighestBidderId(res.isCurrentUserHighestBidder ? (session?.user?.id ?? null) : null);
        } else if ("highestBidderId" in res) {
          // Legacy fallback for old response shape
          setHighestBidderId((res as any).highestBidderId ?? null);
        }
        setHighestBidderName(res.highestBidderName ?? null);
        setIsRegistered(!!res.isRegistered);
        if (res.status) setStatus(res.status);
        if (res.endTime) setEndTime(res.endTime);
        if (res.bids) {
          setBidHistory(res.bids);
        }
      } else {
        // Soft error reporting to prevent console clutter during connection drops
        setError(res.error || "Failed to sync auction telemetry.");
      }
    };

    // Initial query
    pollAuctionState();

    // Setup polling interval (5 seconds to prevent server overload)
    const interval = setInterval(pollAuctionState, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
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
      // Server confirms caller is now the highest bidder — set sentinel to current user's ID
      if ((res as any).isNowHighestBidder || (res as any).highestBidderId) {
        setHighestBidderId(session?.user?.id ?? null);
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
    error,
    placeBid,
    setError,
    setBidHistory,
    setCurrentBid,
    setHighestBidderId,
    setIsRegistered,
  };
}
