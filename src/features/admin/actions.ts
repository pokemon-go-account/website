"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import Auction from "@/models/Auction";
import User from "@/models/User";
import Bid from "@/models/Bid";
import WebhookLog from "@/models/WebhookLog";
import Registration from "@/models/Registration";
import Category from "@/models/Category";
import Product from "@/models/Product";
import PokemonRequest from "@/models/PokemonRequest";
import CustomRequest from "@/models/CustomRequest";
import { revalidatePath } from "next/cache";

/**
 * Helper to enforce strict admin validation
 */
async function checkAdminSession() {
  const session = await auth();
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new Error('Unauthorized. Administrative privileges required.');
  }
  if (session.user.role === 'ADMIN') {
    const rentPaidUntil = (session.user as any).adminRentPaidUntil;
    if (!rentPaidUntil) {
      throw new Error('Administrative rent has expired or is invalid.');
    }
    const rentExpired = new Date(rentPaidUntil) < new Date();
    if (rentExpired) {
      throw new Error('Administrative rent has expired. Access suspended.');
    }
  }
  return session;
}

/**
 * Helper to enforce SUPER_ADMIN only access
 */
async function checkSuperAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized. Super Administrator privileges required.');
  }
  return session;
}

/**
 * Helper to validate if user can control the auction (SUPER_ADMIN or the ADMIN who created it)
 */
async function checkAuctionControlSession(auctionId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized. Please log in.");
  }

  if (session.user.role === "SUPER_ADMIN") {
    return session;
  }

  if (session.user.role === "ADMIN") {
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new Error("Auction not found.");
    }
    const listing = await Listing.findById(auction.listingId);
    if (!listing) {
      throw new Error("Listing details not found.");
    }
    if (listing.sellerId.toString() !== session.user.id) {
      throw new Error("Unauthorized. You can only control auctions that you started.");
    }
    return session;
  }

  throw new Error("Unauthorized. Administrative privileges required.");
}

/**
 * Approve a pending listing with optional metadata overwrites, and schedule its auction block
 */
export async function approveListing(
  listingId: string,
  overwriteData?: {
    title?: string;
    level?: number;
    stardust?: number;
    shinyCount?: number;
    legendaryCount?: number;
    mythicalCount?: number;
    team?: "MYSTIC" | "VALOR" | "INSTINCT" | "NONE";
  }
) {
  try {
    await checkAdminSession();
    await connectDB();

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: "Listing not found." };
    }

    if (listing.status !== "PENDING") {
      return { success: false, error: `Cannot approve listing with status: ${listing.status}` };
    }

    // Apply metadata overwrites if provided
    if (overwriteData) {
      if (overwriteData.title !== undefined) listing.title = overwriteData.title;
      if (overwriteData.level !== undefined) listing.level = overwriteData.level;
      if (overwriteData.stardust !== undefined) listing.stardust = overwriteData.stardust;
      if (overwriteData.shinyCount !== undefined) listing.shinyCount = overwriteData.shinyCount;
      if (overwriteData.legendaryCount !== undefined) listing.legendaryCount = overwriteData.legendaryCount;
      if (overwriteData.mythicalCount !== undefined) listing.mythicalCount = overwriteData.mythicalCount;
      if (overwriteData.team !== undefined) listing.team = overwriteData.team;
    }

    listing.status = "APPROVED";
    listing.escrowStage = "APPROVED";
    await listing.save();

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + listing.durationHours * 60 * 60 * 1000);

    // Create corresponding Auction record
    await Auction.create({
      listingId: listing._id,
      currentHighestBid: listing.startingBid,
      startTime,
      endTime,
      status: "LIVE", // Transition immediately to LIVE for interactive testing
      registrationFee: 199,
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard/seller");
    revalidatePath("/auctions");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Admin approval engine failure:", error);
    return { success: false, error: error.message || "Internal server error occurred." };
  }
}

/**
 * Reject a pending listing with moderation feedback
 */
export async function rejectListing(listingId: string, notes: string) {
  try {
    await checkAdminSession();

    if (!notes || notes.trim().length < 5) {
      return { success: false, error: "Rejection notes must be at least 5 characters long." };
    }

    await connectDB();

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: "Listing not found." };
    }

    if (listing.status !== "PENDING") {
      return { success: false, error: `Cannot reject listing with status: ${listing.status}` };
    }

    listing.status = "REJECTED";
    listing.adminNotes = notes.trim();
    await listing.save();

    revalidatePath("/admin");
    revalidatePath("/dashboard/seller");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Admin rejection engine failure:", error);
    return { success: false, error: error.message || "Internal server error occurred." };
  }
}

/**
 * Pause active bidding on an auction (Kill Switch Option A)
 */
export async function pauseAuction(auctionId: string) {
  try {
    await checkAuctionControlSession(auctionId);
    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    auction.status = "PAUSED";
    await auction.save();

    revalidatePath("/admin");
    revalidatePath(`/auctions/${auctionId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Resume active bidding on a paused auction
 */
export async function resumeAuction(auctionId: string) {
  try {
    await checkAuctionControlSession(auctionId);
    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    auction.status = "LIVE";
    await auction.save();

    revalidatePath("/admin");
    revalidatePath(`/auctions/${auctionId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Force End an auction immediately (Kill Switch Option B)
 */
export async function forceEndAuction(auctionId: string) {
  try {
    await checkAuctionControlSession(auctionId);
    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    auction.endTime = new Date();
    auction.status = "COMPLETED";
    await auction.save();

    revalidatePath("/admin");
    revalidatePath(`/auctions/${auctionId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete an auction and its listing (SUPER_ADMIN only)
 */
export async function deleteAuction(auctionId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized. Super Administrator privileges required.");
    }

    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    // Delete associated listing, bids, and registrations
    if (auction.listingId) {
      await Listing.findByIdAndDelete(auction.listingId);
    }
    await Bid.deleteMany({ auctionId: auctionId });
    await Registration.deleteMany({ auctionId: auctionId });
    await Auction.findByIdAndDelete(auctionId);

    revalidatePath("/admin");
    revalidatePath("/auctions");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Rollback the highest bid (Kill Switch Option C)
 */
export async function rollbackAuctionBid(auctionId: string) {
  try {
    await checkAuctionControlSession(auctionId);
    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    // Find and delete the highest bid
    const highestBid = await Bid.findOne({ auctionId }).sort({ amount: -1 });
    if (!highestBid) {
      return { success: false, error: "No bids have been placed on this auction." };
    }

    await Bid.deleteOne({ _id: highestBid._id });

    // Look up the new highest bid
    const nextBid = await Bid.findOne({ auctionId }).sort({ amount: -1 });
    if (nextBid) {
      auction.currentHighestBid = nextBid.amount;
      auction.highestBidderId = nextBid.bidderId;
    } else {
      // Restore starting price from Listing
      const listing = await Listing.findById(auction.listingId);
      auction.currentHighestBid = listing?.startingBid || 0;
      auction.highestBidderId = undefined;
    }

    await auction.save();

    revalidatePath("/admin");
    revalidatePath(`/auctions/${auctionId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update/Edit an Auction and its associated Listing fields (authorized owners/super_admins only)
 */
export async function updateAuction(auctionId: string, fields: any) {
  try {
    await checkAuctionControlSession(auctionId);
    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    const listing = await Listing.findById(auction.listingId);
    if (!listing) return { success: false, error: "Listing details not found." };

    // Group of listing fields that are editable
    const listingFields = [
      "title",
      "description",
      "level",
      "team",
      "shinyCount",
      "legendaryCount",
      "mythicalCount",
      "region",
      "startingBid",
      "reservePrice",
      "minIncrement",
      "durationHours",
      "stardust",
      "xp",
      "pokedexCompleted",
      "bestBuddyCount",
      "pokeCoins",
      "startDate",
      "accountType",
      "accountStatus",
      "weeklyDistance",
      "topPokemon",
      "rareCandy",
      "fastTm",
      "chargedTm",
      "eliteFastTm",
      "eliteChargedTm",
      "incubators",
      "luckyEggs",
      "lureModules",
      "premiumRaidPass"
    ];

    for (const field of listingFields) {
      if (fields[field] !== undefined) {
        (listing as any)[field] = fields[field];
      }
    }
    await listing.save();

    // Update auction fields
    if (fields.endTime !== undefined) {
      auction.endTime = new Date(fields.endTime);
    }
    if (fields.registrationFee !== undefined) {
      auction.registrationFee = fields.registrationFee;
    }
    // Sync starting price if no bids have been placed yet
    if (fields.startingBid !== undefined) {
      const bidCount = await Bid.countDocuments({ auctionId });
      if (bidCount === 0) {
        auction.currentHighestBid = fields.startingBid;
      }
    }
    await auction.save();

    revalidatePath("/admin");
    revalidatePath(`/auctions/${auctionId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update Escrow Stage mapping
 */
export async function updateEscrowStage(listingId: string, stage: any) {
  try {
    await checkAdminSession();
    await connectDB();

    const listing = await Listing.findById(listingId);
    if (!listing) return { success: false, error: "Listing not found." };

    listing.escrowStage = stage;
    await listing.save();

    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Save credentials securely inside the intermediate Escrow Vault
 */
export async function saveListingCredentials(listingId: string, credentialsVault: string) {
  try {
    await checkAdminSession();
    await connectDB();

    const listing = await Listing.findById(listingId);
    if (!listing) return { success: false, error: "Listing not found." };

    listing.credentialsVault = credentialsVault;
    await listing.save();

    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Payout Authorization Switch (split and release funds)
 */
export async function releaseEscrowFunds(listingId: string) {
  try {
    await checkAdminSession();
    await connectDB();

    const listing = await Listing.findById(listingId);
    if (!listing) return { success: false, error: "Listing not found." };

    listing.escrowStage = "FUNDS_RELEASED";
    await listing.save();

    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Automated Forfeit & Runner-Up Cascade Engine
 */
export async function triggerForfeitCascade(auctionId: string) {
  try {
    await checkAdminSession();
    await connectDB();

    const auction = await Auction.findById(auctionId);
    if (!auction) return { success: false, error: "Auction not found." };

    const primaryWinnerId = auction.highestBidderId;
    if (!primaryWinnerId) {
      return { success: false, error: "This auction ended with no winning bidder." };
    }

    // 1. Increment forfeit warning count on primary winner and suspend if >= 3
    const user = await User.findById(primaryWinnerId);
    if (user) {
      user.forfeitCount = (user.forfeitCount || 0) + 1;
      if (user.forfeitCount >= 3) {
        user.isSuspended = true;
      }
      await user.save();
    }

    // 2. Fetch all bids and find second-highest unique bidder
    const bids = await Bid.find({ auctionId }).sort({ amount: -1 }).lean();
    const runnerUpBid = bids.find(
      (b) => b.bidderId.toString() !== primaryWinnerId.toString()
    );

    if (runnerUpBid) {
      // Cascade to runner-up: extend clock 24 hours, restore LIVE status
      auction.highestBidderId = runnerUpBid.bidderId;
      auction.currentHighestBid = runnerUpBid.amount;
      auction.status = "LIVE";
      auction.endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      // No runner-up: reset winner parameters
      auction.highestBidderId = undefined;
      const listing = await Listing.findById(auction.listingId);
      auction.currentHighestBid = listing?.startingBid || 0;
      auction.status = "COMPLETED";
    }

    await auction.save();

    revalidatePath("/admin");
    revalidatePath(`/auctions/${auctionId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Webhook System Logs Fetcher
 */
export async function getWebhookLogs() {
  try {
    await checkAdminSession();
    await connectDB();

    const logs = await WebhookLog.find().sort({ createdAt: -1 }).limit(50).lean();
    return {
      success: true,
      logs: logs.map((l: any) => ({
        _id: l._id.toString(),
        eventId: l.eventId,
        eventType: l.eventType,
        payload: l.payload,
        status: l.status,
        errorMessage: l.errorMessage,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message, logs: [] };
  }
}

/**
 * Manual sync override for stuck registration payment IDs
 */
export async function manualSyncRegistration(orderId: string) {
  try {
    await checkAdminSession();
    await connectDB();

    const registration = await Registration.findOne({ razorpayOrderId: orderId });
    if (!registration) {
      return { success: false, error: `No registration found matching order: ${orderId}` };
    }

    if (registration.status === "PAID") {
      return { success: true };
    }

    registration.status = "PAID";
    await registration.save();

    // Log manual sync hit
    await WebhookLog.create({
      eventId: `manual_sync_${Date.now()}_${orderId.slice(-4)}`,
      eventType: "manual.override",
      payload: JSON.stringify({ registrationId: registration._id, orderId }),
      status: "PROCESSED",
    });

    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Look up a trainer profile's entire detail and transaction history by their username
 */
export async function lookupUserProfile(username: string) {
  try {
    await checkAdminSession();
    await connectDB();

    if (!username || username.trim().length < 3) {
      return { success: false, error: "Username must be at least 3 characters long." };
    }

    const escapedUsername = username.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const user = await User.findOne({ username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } }).lean();
    if (!user) {
      return { success: false, error: `No user found matching username: "${username.trim()}"` };
    }

    // Query all related collections concurrently
    const [listings, bids, registrations] = await Promise.all([
      Listing.find({ sellerId: user._id }).sort({ createdAt: -1 }).lean(),
      Bid.find({ bidderId: user._id })
        .populate({
          path: "auctionId",
          populate: { path: "listingId" }
        })
        .sort({ createdAt: -1 })
        .lean(),
      Registration.find({ userId: user._id })
        .populate({
          path: "auctionId",
          populate: { path: "listingId" }
        })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const serialize = (data: any) => JSON.parse(JSON.stringify(data));

    return {
      success: true,
      user: serialize(user),
      listings: serialize(listings),
      bids: serialize(bids),
      registrations: serialize(registrations),
    };
  } catch (error: any) {
    console.error("Admin lookup user profile engine error:", error);
    return { success: false, error: error.message || "Failed to lookup user profile." };
  }
}

/**
 * CRUD Category Operations
 */
export async function getCategories() {
  try {
    await checkAdminSession();
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(name: string, slug: string, imageUrl?: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const category = await Category.create({ name, slug: slug.toLowerCase(), imageUrl: imageUrl || '' });
    revalidatePath('/admin/categories');
    revalidatePath('/store');
    return { success: true, category: JSON.parse(JSON.stringify(category)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, name: string, slug: string, imageUrl?: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const updateData: Record<string, string> = { name, slug: slug.toLowerCase() };
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    const category = await Category.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
    revalidatePath('/admin/categories');
    revalidatePath('/store');
    return { success: true, category: JSON.parse(JSON.stringify(category)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    
    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return { success: false, error: 'Cannot delete category containing products.' };
    }

    await Category.findByIdAndDelete(id);
    revalidatePath('/admin/categories');
    revalidatePath('/store');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server Action: Upload base64 category image to Cloudinary (SUPER_ADMIN only)
 */
export async function uploadCategoryImageAction(base64Data: string) {
  try {
    await checkSuperAdminSession();
    const { uploadToCloudinary } = await import('@/lib/cloudinary');
    const url = await uploadToCloudinary(base64Data);
    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * CRUD Product Operations
 */
export async function getProducts() {
  try {
    await checkAdminSession();
    await connectDB();
    const products = await Product.find().populate("categoryId", "name slug").sort({ createdAt: -1 }).lean();
    return { success: true, products: JSON.parse(JSON.stringify(products)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: {
  name: string;
  description?: string;
  mrpPrice: number;
  discountedPrice: number;
  isLimitedDeal?: boolean;
  dealExpiry?: string | Date;
  badge?: "MOST_PURCHASED" | "POPULAR" | "";
  categoryId: string;
  imageUrl: string;
  imageUrls?: string[];
}) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const price = data.discountedPrice;
    const product = await Product.create({ ...data, price });
    revalidatePath('/admin/products');
    revalidatePath('/store');
    return { success: true, product: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description?: string;
    mrpPrice: number;
    discountedPrice: number;
    isLimitedDeal?: boolean;
    dealExpiry?: string | Date;
    badge?: "MOST_PURCHASED" | "POPULAR" | "";
    categoryId: string;
    imageUrl: string;
    imageUrls?: string[];
  }
) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const price = data.discountedPrice;
    const product = await Product.findByIdAndUpdate(id, { ...data, price }, { returnDocument: "after" });
    revalidatePath('/admin/products');
    revalidatePath('/store');
    return { success: true, product: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await Product.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    revalidatePath('/store');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server Action: Upload base64 product image to Cloudinary (SUPER_ADMIN only)
 */
export async function uploadProductImageAction(base64Data: string) {
  try {
    await checkSuperAdminSession();
    const { uploadToCloudinary } = await import('@/lib/cloudinary');
    const url = await uploadToCloudinary(base64Data);
    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pokémon Requests Actions
 */
export async function getPokemonRequests() {
  try {
    await checkAdminSession();
    await connectDB();
    const oldRequests = await PokemonRequest.find().sort({ createdAt: -1 }).lean();
    const newRequests = await CustomRequest.find({ requestType: "POKEMON" }).sort({ createdAt: -1 }).lean();

    const normalisedOld = oldRequests.map(r => ({
      ...r,
      requestType: "POKEMON",
      title: (r as any).pokemonName,
      pokemonName: (r as any).pokemonName
    }));

    const normalisedNew = newRequests.map(r => ({
      ...r,
      pokemonName: (r as any).title
    }));

    const combined = [...normalisedOld, ...normalisedNew].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { success: true, requests: JSON.parse(JSON.stringify(combined)) };
  } catch (error: any) {
    return { success: false, error: error.message, requests: [] };
  }
}

export async function updatePokemonRequestStatus(requestId: string, status: "PENDING" | "COMPLETED" | "REJECTED") {
  try {
    await checkAdminSession();
    await connectDB();
    let request = await PokemonRequest.findByIdAndUpdate(requestId, { status }, { new: true });
    if (!request) {
      request = await CustomRequest.findByIdAndUpdate(requestId, { status }, { new: true });
    }
    revalidatePath('/admin/pokemon-requests');
    revalidatePath('/admin/custom-requests');
    return { success: true, request: JSON.parse(JSON.stringify(request)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePokemonRequest(requestId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    const deletedOld = await PokemonRequest.findByIdAndDelete(requestId);
    if (!deletedOld) {
      await CustomRequest.findByIdAndDelete(requestId);
    }
    revalidatePath('/admin/pokemon-requests');
    revalidatePath('/admin/custom-requests');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Custom Service Requests (Accounts, Stardust, XP) Actions
 */
export async function getCustomRequests() {
  try {
    await checkAdminSession();
    await connectDB();
    const requests = await CustomRequest.find().sort({ createdAt: -1 }).lean();
    return { success: true, requests: JSON.parse(JSON.stringify(requests)) };
  } catch (error: any) {
    return { success: false, error: error.message, requests: [] };
  }
}

export async function updateCustomRequestStatus(requestId: string, status: "PENDING" | "COMPLETED" | "REJECTED") {
  try {
    await checkAdminSession();
    await connectDB();
    const request = await CustomRequest.findByIdAndUpdate(requestId, { status }, { new: true });
    revalidatePath('/admin/custom-requests');
    return { success: true, request: JSON.parse(JSON.stringify(request)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomRequest(requestId: string) {
  try {
    await checkSuperAdminSession();
    await connectDB();
    await CustomRequest.findByIdAndDelete(requestId);
    revalidatePath('/admin/custom-requests');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

