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
      .populate("highestBidderId", "name")
      .lean();
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }

    const session = await auth();
    const userId = session?.user?.id;
    let isRegistered = false;
    if (userId) {
      const reg = await Registration.findOne({ userId, auctionId, status: "PAID" }).lean();
      isRegistered = !!reg;
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
      highestBidderName: (auction.highestBidderId as any)?.username || null,
      status: auction.status,
      isRegistered,
      bids: formattedBids,
    };
  } catch (error) {
    console.error("Realtime fetch failure:", error);
    return { success: false, error: "Internal server error fetching state." };
  }
}

export async function placeAuctionBid(auctionId: string, bidAmount: number) {
  try {
    // 1. Session verification & active status check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in to bid." };
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
    const registration = await Registration.findOne({
      userId: user._id,
      auctionId,
      status: "PAID",
    });

    if (!registration) {
      return { success: false, error: "Access denied. Verification deposit ($2.50) is required to place bids." };
    }

    // 2. Fetch auction and validate listing minIncrement rules
    const auction = await Auction.findById(auctionId).populate<{ listingId: any }>("listingId");
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }

    if (auction.endTime && new Date() >= new Date(auction.endTime)) {
      return { success: false, error: "Bidding is closed. This auction has concluded." };
    }

    if (auction.status !== "LIVE" && auction.status !== "SCHEDULED") {
      return { success: false, error: "Auction is not accepting bids." };
    }

    const minIncrement = auction.listingId?.minIncrement || 100;

    // 3. Concurrency check & atomic transaction update
    const updatedAuction = await Auction.findOneAndUpdate(
      {
        _id: auctionId,
        currentHighestBid: { $lte: bidAmount - minIncrement },
        status: { $in: ["LIVE", "SCHEDULED"] }
      },
      {
        $set: {
          currentHighestBid: bidAmount,
          highestBidderId: user._id,
          status: "LIVE" // Transitions to LIVE when a bid is received
        }
      },
      { new: true }
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

    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    const secureUrl = await uploadToCloudinary(base64Data);
    return { success: true, url: secureUrl, error: null };
  } catch (error: any) {
    console.error("Server image upload failed:", error);
    return { success: false, error: error.message || "Failed to upload image." };
  }
}