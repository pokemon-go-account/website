"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { revalidatePath } from "next/cache";
import Listing from "@/models/Listing";
import { ListingValidationSchema } from "@/models/Listing.validation";
import Auction from "@/models/Auction";
import Bid from "@/models/Bid";
import User from "@/models/User";
import Registration from "@/models/Registration";
import { sendChatWebhookNotification } from "@/features/chat/actions";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Syncs MongoDB live auction state to Firestore doc liveAuctions/${auctionId}
 * Allows zero-Vercel-invocation WebSocket streaming for client live rooms
 */
export async function syncAuctionToFirestore(auctionId: string) {
  try {
    const db = getDb();
    const auction = await Auction.findById(auctionId)
      .populate("highestBidderId", "name username")
      .lean();
    if (!auction) return;

    const bids = await Bid.find({ auctionId })
      .populate("bidderId", "username")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formattedBids = bids.map((b: any) => ({
      _id: b._id.toString(),
      bidderName: b.bidderId?.username || "Anonymous",
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    }));

    await setDoc(doc(db, "liveAuctions", auctionId), {
      currentHighestBid: auction.currentHighestBid,
      highestBidderId: auction.highestBidderId ? (auction.highestBidderId as any)._id?.toString() || (auction.highestBidderId as any).toString() : null,
      highestBidderName: (auction.highestBidderId as any)?.username || (auction.highestBidderId as any)?.name || null,
      status: auction.status,
      endTime: auction.endTime ? auction.endTime.toISOString() : null,
      bids: formattedBids,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error(`[Firestore LiveSync] Failed for auction ${auctionId}:`, err);
  }
}

/**
 * Automatically transitions expired auctions to COMPLETED and starts scheduled auctions
 */
export async function expireStaleAuctions() {
  try {
    await connectDB();
    const now = new Date();

    // 1. Transition LIVE/SCHEDULED auctions that have passed their endTime to COMPLETED
    await Auction.updateMany(
      {
        status: { $in: ["LIVE", "SCHEDULED"] },
        endTime: { $lte: now }
      },
      {
        $set: { status: "COMPLETED" }
      }
    );

    // 2. Transition SCHEDULED auctions that have reached their startTime to LIVE
    await Auction.updateMany(
      {
        status: "SCHEDULED",
        startTime: { $lte: now },
        endTime: { $gt: now }
      },
      {
        $set: { status: "LIVE" }
      }
    );
  } catch (error) {
    console.error("Failed to automatically expire/start auctions:", error);
  }
}

export async function createListing(data: unknown) {
  try {
    // 1. Enforce strict session validation
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    await connectDB();

    // 2. Server-side deep parsing via Zod schema defined in Milestone 2
    const validatedFields = ListingValidationSchema.safeParse(data);

    if (!validatedFields.success) {
      return { 
        success: false, 
        error: validatedFields.error.issues[0].message 
      };
    }

    // 3. Inject seller context and persist to MongoDB
    await Listing.create({
      ...validatedFields.data,
      sellerId: session.user.id,
      status: "PENDING", // Enforces platform moderation gate
    });

    // Clear Next.js data cache for the dashboard to show changes
    revalidatePath("/dashboard/admin");

    return { success: true, error: null };
  } catch (error) {
    console.error("Listing submission failure:", error);
    return { success: false, error: "Internal database tracking breakdown." };
  }
}

export async function fetchAuctionRealtime(auctionId: string) {
  try {
    await connectDB();
    const auction = await Auction.findById(auctionId)
      .populate("highestBidderId", "name username")
      .lean();
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }

    const session = await auth();
    const userId = session?.user?.id;
    let isRegistered = false;
    if (userId) {
      const user = await User.findById(userId).lean();
      isRegistered = !!(user && (user as any).hasPaidVerificationDeposit);
    }

    const bids = await Bid.find({ auctionId })
      .populate("bidderId", "username")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formattedBids = bids.map((b: any) => ({
      _id: b._id.toString(),
      bidderName: b.bidderId?.username || "Anonymous",
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    }));

    return {
      success: true,
      currentHighestBid: auction.currentHighestBid,
      highestBidderId: auction.highestBidderId ? (auction.highestBidderId as any)._id?.toString() || (auction.highestBidderId as any).toString() : null,
      highestBidderName: (auction.highestBidderId as any)?.username || (auction.highestBidderId as any)?.name || null,
      status: auction.status,
      endTime: auction.endTime ? auction.endTime.toISOString() : null,
      isRegistered,
      bids: formattedBids,
      hasPendingBuyNow: false,
    };
  } catch (error) {
    console.error("Realtime fetch failure:", error);
    return { success: false, error: "Internal server error fetching state." };
  }
}

const bidLimiter = new Map<string, number[]>();

function checkBidRateLimit(userId: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = bidLimiter.get(userId) || [];
  const activeTimestamps = timestamps.filter((t) => now - t < windowMs);
  if (activeTimestamps.length > 0 && now - activeTimestamps[activeTimestamps.length - 1] < 1000) {
    return true;
  }
  if (activeTimestamps.length >= limit) {
    return true;
  }
  activeTimestamps.push(now);
  bidLimiter.set(userId, activeTimestamps);
  return false;
}

export async function placeAuctionBid(auctionId: string, bidAmount: number) {
  try {
    // 1. Session verification & active status check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in to bid." };
    }

    if (checkBidRateLimit(session.user.id, 30, 60 * 1000)) {
      return { success: false, error: "Rate limit exceeded. Please slow down your bidding." };
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return { success: false, error: "User profile not found." };
    }
    if (user.isSuspended) {
      return { success: false, error: "Your account is suspended." };
    }

    // 1b. Verify user registration status
    if (!user.hasPaidVerificationDeposit) {
      return { success: false, error: "Access denied. Verification deposit ($2.50) is required to place bids." };
    }

    // 2. Fetch auction and validate listing minIncrement rules
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }

    const listing = await Listing.findById(auction.listingId);
    if (!listing) {
      return { success: false, error: "Listing details not found." };
    }

    if (listing.sellerId && listing.sellerId.toString() === user._id.toString()) {
      return { success: false, error: "You cannot bid on your own auction." };
    }

    if (auction.highestBidderId && auction.highestBidderId.toString() === user._id.toString()) {
      return { success: false, error: "You are already the highest bidder. You cannot place another bid until you are outbid." };
    }

    if (auction.endTime && new Date() >= new Date(auction.endTime)) {
      return { success: false, error: "Bidding is closed. This auction has concluded." };
    }

    if (auction.status !== "LIVE") {
      return { success: false, error: "Bidding is only allowed on active, live auctions." };
    }

    const minIncrement = listing.minIncrement || 100;
    const isFirstBid = !auction.highestBidderId;
    const minRequiredBid = isFirstBid ? auction.currentHighestBid : (auction.currentHighestBid + minIncrement);

    if (bidAmount < minRequiredBid) {
      return { 
        success: false, 
        error: isFirstBid 
          ? `The starting bid must be at least $${minRequiredBid}.`
          : `Bid must be at least $${minRequiredBid} (minimum increment of $${minIncrement} required).`
      };
    }

    // 3. Concurrency check & atomic transaction update (verifying status, active time, and bid amount)
    const query: any = {
      _id: auctionId,
      status: "LIVE",
      $or: [
        { endTime: { $exists: false } },
        { endTime: { $gt: new Date() } }
      ]
    };

    if (isFirstBid) {
      // Ensure no bidder has placed a bid yet and amount is at least starting bid
      query.$or.push({ highestBidderId: { $exists: false } }, { highestBidderId: null });
      query.currentHighestBid = { $lte: bidAmount };
    } else {
      // Subsequent bids: must be at least currentHighestBid + minIncrement
      query.highestBidderId = auction.highestBidderId;
      query.currentHighestBid = { $lte: bidAmount - minIncrement };
    }

    const updatedAuction = await Auction.findOneAndUpdate(
      query,
      {
        $set: {
          currentHighestBid: bidAmount,
          highestBidderId: user._id
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedAuction) {
      return { success: false, error: "You were outbid or the increment was invalid. Try a higher amount." };
    }

    // 4. Create Audit Log document in Bid collection
    await Bid.create({
      auctionId,
      bidderId: user._id,
      amount: bidAmount,
    });

    // Trigger Webhook Notification on new auction bid
    sendChatWebhookNotification({
      ticketId: `auction-${auctionId}`,
      ticketTitle: listing.title || "Live Auction",
      senderName: (user as any).username || (user as any).name || "Bidder",
      senderType: "user",
      userEmail: user.email ?? undefined,
      text: `🔨 NEW BID PLACED: $${bidAmount}\nListing: ${listing.title}\nBidder: ${(user as any).username || (user as any).name || "Bidder"}`,
    }).catch(() => {});

    // Sync live telemetry to Firestore for instant WebSocket streaming
    syncAuctionToFirestore(auctionId).catch(() => {});

    revalidatePath(`/auctions/${auctionId}`);

    return { 
      success: true, 
      currentHighestBid: updatedAuction.currentHighestBid,
      highestBidderId: updatedAuction.highestBidderId?.toString() || "",
      error: null 
    };
  } catch (error) {
    console.error("Bid placing failure:", error);
    return { success: false, error: "Internal db tracking failure." };
  }
}

/**
 * Server Action: Upload image base64 data to Cloudinary (or mock sandbox)
 */
export async function uploadImageAction(base64Data: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!base64Data || typeof base64Data !== "string") {
      return { success: false, error: "Invalid image data." };
    }

    // Check size limit: 5MB (approx. 7,000,000 characters for base64)
    if (base64Data.length > 7000000) {
      return { success: false, error: "Image file is too large. Maximum limit is 5MB." };
    }

    // Extract and validate mime type
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!matches) {
      return { success: false, error: "Invalid image encoding format." };
    }

    const mimeType = matches[1];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return { success: false, error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." };
    }

    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    const secureUrl = await uploadToCloudinary(base64Data);
    return { success: true, url: secureUrl, error: null };
  } catch (error: any) {
    console.error("Server image upload failed:", error);
    return { success: false, error: error.message || "Failed to upload image." };
  }
}

/**
 * Server Action: Fetch the complete, un-truncated bid history for an auction
 */
export async function fetchAllAuctionBids(auctionId: string) {
  try {
    await connectDB();
    const bids = await Bid.find({ auctionId })
      .populate("bidderId", "username")
      .sort({ createdAt: -1 })
      .lean();

    const formattedBids = bids.map((b: any) => ({
      _id: b._id.toString(),
      bidderName: b.bidderId?.username || "Anonymous",
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    }));

    return { success: true, bids: formattedBids, error: null };
  } catch (error: any) {
    console.error("Failed to fetch complete bid history:", error);
    return { success: false, error: error.message || "Failed to retrieve bid history." };
  }
}

/**
 * Server Action: Persist a pending Buy Now order when checkout is clicked
 */
export async function createBuyNowOrderAction(auctionId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in first." };
    }

    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }

    const listing = await Listing.findById(auction.listingId);
    if (!listing) {
      return { success: false, error: "Listing details not found." };
    }

    const buyNowPrice = listing.startingBid * 4;

    if (auction.currentHighestBid >= 0.8 * buyNowPrice) {
      return { success: false, error: "Buy Now is disabled because the current bid has reached 80% or more of the Buy Now price." };
    }

    const Order = (await import("@/models/Order")).default;

    // Check if user already initiated buy now for this auction to avoid duplicates
    const existingOrder = await Order.findOne({
      userId: session.user.id,
      auctionId: auction._id,
      orderType: "BUY_NOW",
      status: "PENDING",
    });

    const user = await User.findById(session.user.id);
    const walletBalance = user?.walletBalance || 0;
    const discount = walletBalance > 0 ? Math.min(buyNowPrice, walletBalance) : 0;
    const finalPrice = Math.max(0, buyNowPrice - discount);
    const isCompleted = finalPrice === 0;

    if (existingOrder) {
      existingOrder.totalPrice = finalPrice;
      existingOrder.walletDiscountApplied = discount;
      existingOrder.status = isCompleted ? "COMPLETED" : "PENDING";
      await existingOrder.save();

      if (discount > 0) {
        await User.findByIdAndUpdate(session.user.id, {
          $inc: { walletBalance: -discount }
        });
      }

      if (isCompleted) {
        if (user) {
          await Auction.findByIdAndUpdate(auction._id, {
            status: "COMPLETED",
            buyNowBuyerId: user._id,
            buyNowBuyerName: (user as any).username || (user as any).name || "Unknown",
          });
        } else {
          await Auction.findByIdAndUpdate(auction._id, { status: "COMPLETED" });
        }
      }

      return { success: true, orderId: existingOrder._id.toString(), autoCompleted: isCompleted };
    }

    const order = await Order.create({
      userId: session.user.id,
      items: [
        {
          name: `${listing.title} (Buy Now Account)`,
          price: buyNowPrice,
          quantity: 1,
        },
      ],
      totalPrice: finalPrice,
      walletDiscountApplied: discount,
      status: isCompleted ? "COMPLETED" : "PENDING",
      orderType: "BUY_NOW",
      auctionId: auction._id,
      deliveryStatus: "PENDING",
    });

    if (discount > 0) {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { walletBalance: -discount }
      });
    }

    // Trigger Webhook Notification on Buy Now order creation
    sendChatWebhookNotification({
      ticketId: `order-${order._id.toString()}`,
      ticketTitle: `Buy Now Order #${order._id.toString().substring(0, 8).toUpperCase()}`,
      senderName: (user as any)?.username || session.user.name || session.user.email || "Buyer",
      senderType: "user",
      userEmail: session.user.email ?? undefined,
      text: `⚡ BUY NOW ORDER CREATED\nListing: ${listing.title}\nBuy Now Price: $${buyNowPrice}\nWallet Discount: -$${discount}\nFinal Total: $${finalPrice}`,
    }).catch(() => {});

    // Mark auction as COMPLETED with buy-now buyer info only if auto-completed immediately
    if (isCompleted) {
      if (user) {
        await Auction.findByIdAndUpdate(auction._id, {
          status: "COMPLETED",
          buyNowBuyerId: user._id,
          buyNowBuyerName: (user as any).username || (user as any).name || "Unknown",
        });
      } else {
        await Auction.findByIdAndUpdate(auction._id, { status: "COMPLETED" });
      }
    }

    revalidatePath("/auctions");
    revalidatePath(`/auctions/${auction._id.toString()}`);

    return { success: true, orderId: order._id.toString(), autoCompleted: isCompleted };
  } catch (error: any) {
    console.error("Failed to create Buy Now order:", error);
    return { success: false, error: error.message || "Failed to initiate Buy Now purchase." };
  }
}

/**
 * Server Action: Create a pending payment order for the auction winner
 */
export async function createAuctionWinnerOrderAction(auctionId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in first." };
    }

    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }

    // Validate caller is the winner
    const winnerId = auction.highestBidderId?.toString();
    if (winnerId !== session.user.id) {
      return { success: false, error: "You are not the winner of this auction." };
    }

    if (auction.status !== "COMPLETED") {
      return { success: false, error: "Auction is not yet concluded." };
    }

    const listing = await Listing.findById(auction.listingId);
    if (!listing) {
      return { success: false, error: "Listing details not found." };
    }

    const Order = (await import("@/models/Order")).default;

    // Idempotency: return existing order if one was already created
    const existingOrder = await Order.findOne({
      userId: session.user.id,
      auctionId: auction._id,
      orderType: "AUCTION",
    });

    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder._id.toString(),
        autoCompleted: existingOrder.status === "COMPLETED",
        alreadyExists: true,
      };
    }

    const winAmount = auction.currentHighestBid;
    const user = await User.findById(session.user.id);
    const walletBalance = user?.walletBalance || 0;
    const discount = walletBalance > 0 ? Math.min(winAmount, walletBalance) : 0;
    const finalPrice = Math.max(0, winAmount - discount);
    const isCompleted = finalPrice === 0;

    const order = await Order.create({
      userId: session.user.id,
      items: [
        {
          name: `${listing.title} (Auction Win)`,
          price: winAmount,
          quantity: 1,
        },
      ],
      totalPrice: finalPrice,
      walletDiscountApplied: discount,
      status: isCompleted ? "COMPLETED" : "PENDING",
      orderType: "AUCTION",
      auctionId: auction._id,
      deliveryStatus: "PENDING",
    });

    if (discount > 0) {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { walletBalance: -discount },
      });
    }

    // Trigger Webhook Notification on auction winner order creation
    sendChatWebhookNotification({
      ticketId: `order-${order._id.toString()}`,
      ticketTitle: `Auction Winner Order #${order._id.toString().substring(0, 8).toUpperCase()}`,
      senderName: (user as any)?.username || session.user.name || session.user.email || "Winner",
      senderType: "user",
      userEmail: session.user.email ?? undefined,
      text: `🏆 AUCTION WINNER ORDER CREATED\nListing: ${listing.title}\nWinning Bid: $${winAmount}\nWallet Discount: -$${discount}\nFinal Amount: $${finalPrice}`,
    }).catch(() => {});

    return {
      success: true,
      orderId: order._id.toString(),
      autoCompleted: isCompleted,
      winAmount,
      finalPrice,
      walletDiscount: discount,
    };
  } catch (error: any) {
    console.error("Failed to create auction winner order:", error);
    return { success: false, error: error.message || "Failed to initiate payment." };
  }
}

export async function checkAuctionPaymentStatus(auctionId: string) {
  try {
    await connectDB();
    const Order = (await import("@/models/Order")).default;
    const completedOrder = await Order.findOne({ auctionId, status: "COMPLETED" }).lean();
    return { success: true, isPaid: !!completedOrder };
  } catch (error: any) {
    console.error("Failed to check auction payment status:", error);
    return { success: false, isPaid: false };
  }
}