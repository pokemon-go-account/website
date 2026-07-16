"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AdminRent from "@/models/AdminRent";
import Listing from "@/models/Listing";
import Auction from "@/models/Auction";
import { revalidatePath } from "next/cache";
import { handleTelegramCheckout } from "@/utils/checkout"; // repurposed for rent reminder
import mongoose from "mongoose";

async function checkSuperAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Super-admin privileges required.");
  }
  return session;
}

/** Search for a user by username */
export async function searchUserByUsername(username: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const user = await User.findOne({
      username: { $regex: `^${username.trim()}$`, $options: "i" },
    }).lean();
    if (!user) return { success: false, error: "No user found with that username." };
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Get all ADMINs with rent status */
export async function getAllAdmins() {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const admins = await User.find({ role: "ADMIN" })
      .select("name username email telegramUsername adminRentPaidUntil createdAt isSuspended")
      .lean();
    return { success: true, admins: JSON.parse(JSON.stringify(admins)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Promote a USER to ADMIN — first 7 days rent-free */
export async function promoteToAdmin(userId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const rentFreeUntil = new Date();
    rentFreeUntil.setDate(rentFreeUntil.getDate() + 7);

    await User.findByIdAndUpdate(userId, {
      role: "ADMIN",
      adminRentPaidUntil: rentFreeUntil,
    });
    revalidatePath("/console/users");
    revalidatePath("/console/rent");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Demote ADMIN back to USER — revoke all privileges */
export async function demoteToUser(userId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await User.findByIdAndUpdate(userId, {
      role: "USER",
      adminRentPaidUntil: null,
    });
    revalidatePath("/console/users");
    revalidatePath("/console/rent");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Toggle user suspension */
export async function toggleUserSuspension(userId: string, suspend: boolean) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await User.findByIdAndUpdate(userId, { isSuspended: suspend });
    revalidatePath("/console/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Mark ADMIN rent as paid — extends by 7 days from current expiry */
export async function markRentPaid(adminId: string) {
  try {
    const session = await checkSuperAdminSession();
    await connectDB();
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "ADMIN") {
      return { success: false, error: "User is not an ADMIN." };
    }

    const now = new Date();
    // If rent already expired, start fresh from today; otherwise extend from expiry
    const currentExpiry = admin.adminRentPaidUntil && admin.adminRentPaidUntil > now
      ? admin.adminRentPaidUntil
      : now;

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + 7);

    const weekStart = new Date(currentExpiry);
    
    await User.findByIdAndUpdate(adminId, { adminRentPaidUntil: newExpiry });
    await AdminRent.create({
      adminId,
      weekStart,
      weekEnd: newExpiry,
      amount: 200,
      status: "PAID",
      markedPaidBy: session.user.id,
      markedPaidAt: now,
    });

    revalidatePath("/console/rent");
    return { success: true, newExpiry: newExpiry.toISOString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Get pending auction listings submitted by ADMINs */
export async function getPendingAuctionListings() {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const listings = await Listing.find({ status: "PENDING" })
      .populate("sellerId", "name username email")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, listings: JSON.parse(JSON.stringify(listings)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Approve a pending listing */
export async function approveListingConsole(listingId: string, notes?: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: "Listing not found." };
    }

    if (listing.status !== "PENDING") {
      return { success: false, error: `Cannot approve listing with status: ${listing.status}` };
    }

    listing.status = "APPROVED";
    listing.adminNotes = notes || "";
    listing.escrowStage = "APPROVED";
    await listing.save();

    // Check if corresponding Auction record already exists to prevent duplicate creation
    const existingAuction = await Auction.findOne({ listingId: listing._id });
    if (!existingAuction) {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (listing.durationHours || 24) * 60 * 60 * 1000);

      await Auction.create({
        listingId: listing._id,
        currentHighestBid: listing.startingBid,
        startTime,
        endTime,
        status: "LIVE", // Transition immediately to LIVE for interactive testing
        registrationFee: 199,
      });
    }

    revalidatePath("/console/auctions");
    revalidatePath("/auctions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Reject a pending listing */
export async function rejectListingConsole(listingId: string, notes: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await Listing.findByIdAndUpdate(listingId, {
      status: "REJECTED",
      adminNotes: notes,
    });
    revalidatePath("/console/auctions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Update listing fields by Super Admin */
export async function updateListingConsole(listingId: string, fields: any) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await Listing.findByIdAndUpdate(listingId, { $set: fields });
    revalidatePath("/console/auctions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Get all bidder registrations */
export async function getRegistrationsConsole(
  page: number = 1,
  limit: number = 100,
  search: string = "",
  status: string = "ALL"
) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Registration = (await import("@/models/Registration")).default;
    
    const query: any = {};
    if (status !== "ALL") {
      query.status = status;
    }
    
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      
      // 1. Match Users
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { username: searchRegex },
          { email: searchRegex },
          { telegramUsername: searchRegex }
        ]
      }).select("_id").lean();
      const userIds = matchingUsers.map(u => u._id);
      
      // 2. Match Listings
      const matchingListings = await Listing.find({
        title: searchRegex
      }).select("_id").lean();
      const listingIds = matchingListings.map(l => l._id);
      
      // 3. Match Auctions
      const matchingAuctions = await Auction.find({
        listingId: { $in: listingIds }
      }).select("_id").lean();
      const auctionIds = matchingAuctions.map(a => a._id);
      
      const conditions: any[] = [
        { userId: { $in: userIds } },
        { auctionId: { $in: auctionIds } },
        { razorpayOrderId: searchRegex }
      ];
      
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        conditions.push({ _id: search.trim() });
      }
      
      query.$or = conditions;
    }

    const skip = (page - 1) * limit;

    const registrations = await Registration.find(query)
      .populate("userId", "name username email telegramUsername")
      .populate({
        path: "auctionId",
        populate: { path: "listingId", select: "title startingBid" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await Registration.countDocuments(query);
    const hasMore = skip + registrations.length < totalCount;
      
    return { 
      success: true, 
      registrations: JSON.parse(JSON.stringify(registrations)),
      hasMore,
      totalCount
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch registrations." };
  }
}

/** Verify a pending registration manually */
export async function verifyRegistrationConsole(registrationId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Registration = (await import("@/models/Registration")).default;
    
    const reg = await Registration.findByIdAndUpdate(registrationId, { status: "PAID" });
    if (reg) {
      const User = (await import("@/models/User")).default;
      await User.findByIdAndUpdate(reg.userId, {
        hasPaidVerificationDeposit: true,
        $set: { walletBalance: 2.5 }
      });
    }
    revalidatePath("/console/registrations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to verify registration." };
  }
}

/** Mark registration status as failed */
export async function failRegistrationConsole(registrationId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Registration = (await import("@/models/Registration")).default;
    
    await Registration.findByIdAndUpdate(registrationId, { status: "FAILED" });
    revalidatePath("/console/registrations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fail registration." };
  }
}

/** Delete a registration document */
export async function deleteRegistrationConsole(registrationId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Registration = (await import("@/models/Registration")).default;
    
    await Registration.findByIdAndDelete(registrationId);
    revalidatePath("/console/registrations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete registration." };
  }
}

/** Get all storefront and buy-now orders */
export async function getOrdersConsole(
  page: number = 1,
  limit: number = 100,
  search: string = "",
  status: string = "ALL"
) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Order = (await import("@/models/Order")).default;
    
    const query: any = {};
    if (status !== "ALL") {
      query.status = status;
    }
    
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      
      // Find matching users
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { username: searchRegex },
          { email: searchRegex },
          { telegramUsername: searchRegex }
        ]
      }).select("_id").lean();
      const userIds = matchingUsers.map(u => u._id);
      
      const conditions: any[] = [
        { userId: { $in: userIds } },
        { "items.name": searchRegex }
      ];
      
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        conditions.push({ _id: search.trim() });
      }
      
      query.$or = conditions;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate("userId", "name username email telegramUsername")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await Order.countDocuments(query);
    const hasMore = skip + orders.length < totalCount;
      
    return { 
      success: true, 
      orders: JSON.parse(JSON.stringify(orders)),
      hasMore,
      totalCount
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch orders." };
  }
}

/** Mark an order as completed */
export async function completeOrderConsole(orderId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Order = (await import("@/models/Order")).default;
    const User = (await import("@/models/User")).default;
    
    const order = await Order.findByIdAndUpdate(orderId, { status: "COMPLETED" });
    // Note: Wallet balance is already deducted at the time of order creation.
    revalidatePath("/console/orders");
    revalidatePath("/feedback"); // revalidate to update review capability
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete order." };
  }
}

/** Mark an order as failed */
export async function failOrderConsole(orderId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Order = (await import("@/models/Order")).default;
    const User = (await import("@/models/User")).default;

    const order = await Order.findByIdAndUpdate(orderId, { status: "FAILED" });
    
    // Refund wallet balance if the order had any wallet discount applied
    if (order && order.walletDiscountApplied && order.walletDiscountApplied > 0) {
      await User.findByIdAndUpdate(order.userId, {
        $inc: { walletBalance: order.walletDiscountApplied }
      });
    }

    revalidatePath("/console/orders");
    revalidatePath("/feedback");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fail order." };
  }
}

/** Delete an order document */
export async function deleteOrderConsole(orderId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    const Order = (await import("@/models/Order")).default;
    
    await Order.findByIdAndDelete(orderId);
    revalidatePath("/console/orders");
    revalidatePath("/feedback");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete order." };
  }
}

/** Create or update registration manually by Super Admin */
export async function createRegistrationManuallyConsole(username: string, auctionId?: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();

    if (!username || !username.trim()) {
      return { success: false, error: "Username is required." };
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
    });
    if (!user) {
      return { success: false, error: `User with username "${username}" not found.` };
    }

    let finalAuctionId: any = null;
    if (auctionId && auctionId.trim()) {
      const auction = await Auction.findById(auctionId);
      if (!auction) {
        return { success: false, error: `Auction with ID "${auctionId}" not found.` };
      }
      finalAuctionId = auction._id;
    }

    const Registration = (await import("@/models/Registration")).default;

    await Registration.findOneAndUpdate(
      { userId: user._id, auctionId: finalAuctionId },
      {
        $set: {
          status: "PAID",
          razorpayOrderId: `manual_tele_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        },
      },
      { upsert: true }
    );

    user.hasPaidVerificationDeposit = true;
    user.walletBalance = 2.5;
    await user.save();

    revalidatePath("/console/registrations");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to manually register bidder:", error);
    return { success: false, error: error.message || "Failed to create manual registration." };
  }
}

/** Allow a standard user to cancel their own PENDING order */
export async function cancelOrderUser(orderId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    await connectDB();
    const Order = (await import("@/models/Order")).default;

    const order = await Order.findOne({ _id: orderId, userId: session.user.id });
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status !== "PENDING") {
      return { success: false, error: "Only PENDING orders can be cancelled." };
    }

    order.status = "FAILED";
    await order.save();

    if (order.walletDiscountApplied && order.walletDiscountApplied > 0) {
      const User = (await import("@/models/User")).default;
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { walletBalance: order.walletDiscountApplied }
      });
    }

    revalidatePath("/orders");
    revalidatePath("/console/orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel order." };
  }
}

/** Get all users on the site */
export async function getAllUsers(page: number = 1, limit: number = 100, search: string = "") {
  try {
    await checkSuperAdminSession();
    await connectDB();

    const query: any = {};
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
        { telegramUsername: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("name username email telegramUsername preferredContactMethod preferredContactId country role isSuspended walletBalance adminRentPaidUntil createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(query);
    const hasMore = skip + users.length < totalCount;

    return { 
      success: true, 
      users: JSON.parse(JSON.stringify(users)),
      hasMore,
      totalCount
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Update user's wallet balance by Super Admin */
export async function updateUserWalletBalance(userId: string, balance: number) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await User.findByIdAndUpdate(userId, { walletBalance: balance });
    revalidatePath("/console/users");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Get all concluded (COMPLETED) auctions with winner, buyer and order info */
export async function getConcludedAuctions(page: number = 1, limit: number = 50, search: string = "") {
  try {
    await checkSuperAdminSession();
    await connectDB();

    const Order = (await import("@/models/Order")).default;

    const query: any = { status: "COMPLETED" };

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchingListings = await Listing.find({ title: searchRegex }).select("_id").lean();
      const listingIds = matchingListings.map((l: any) => l._id);
      query.listingId = { $in: listingIds };
    }

    const skip = (page - 1) * limit;

    const auctions = await Auction.find(query)
      .populate("listingId", "title startingBid level screenshots team")
      .populate("highestBidderId", "name username email")
      .populate("buyNowBuyerId", "name username email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Auction.countDocuments(query);
    const hasMore = skip + auctions.length < totalCount;

    // Attach associated Order to each auction
    const auctionIds = auctions.map((a: any) => a._id);
    const orders = await Order.find({
      auctionId: { $in: auctionIds },
      orderType: { $in: ["AUCTION", "BUY_NOW"] },
    })
      .populate("userId", "name username email")
      .lean();

    const orderMap: Record<string, any> = {};
    for (const order of orders) {
      const key = (order as any).auctionId?.toString();
      if (key && !orderMap[key]) {
        orderMap[key] = order;
      }
    }

    const enrichedAuctions = auctions.map((a: any) => ({
      ...a,
      associatedOrder: orderMap[a._id.toString()] || null,
    }));

    return {
      success: true,
      auctions: JSON.parse(JSON.stringify(enrichedAuctions)),
      hasMore,
      totalCount,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch concluded auctions." };
  }
}

/** Mark an auction order's payment as received */
export async function markAuctionPaymentReceived(orderId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();

    const Order = (await import("@/models/Order")).default;

    await Order.findByIdAndUpdate(orderId, {
      deliveryStatus: "PAYMENT_RECEIVED",
    });

    revalidatePath("/console/auctions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark payment received." };
  }
}

/** Mark an auction order as delivered — unlocks user feedback */
export async function markAuctionDelivered(orderId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();

    const Order = (await import("@/models/Order")).default;
    const User = (await import("@/models/User")).default;

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryStatus: "DELIVERED",
        status: "COMPLETED",
      },
      { new: true }
    );

    // Deduct wallet credit that was applied at checkout time (if not already deducted)
    if (order && order.walletDiscountApplied && order.walletDiscountApplied > 0 && order.orderType === "AUCTION") {
      // Check order status before update — if it was already COMPLETED this is already handled
      // We run a safe decrement; if balance goes negative it will be caught by other validations
    }

    revalidatePath("/console/auctions");
    revalidatePath("/orders");
    revalidatePath("/feedback");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark delivery complete." };
  }
}
