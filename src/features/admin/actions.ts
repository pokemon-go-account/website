"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Listing from "@/models/Listing";
import Auction from "@/models/Auction";
import { revalidatePath } from "next/cache";

/**
 * Helper to enforce strict admin validation
 */
async function checkAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized. Administrative privileges required.");
  }
  return session;
}

/**
 * Approve a pending listing and automatically schedule its auction block
 */
export async function approveListing(listingId: string) {
  try {
    await checkAdminSession();
    await connectDB();

    // Retrieve listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: "Listing not found." };
    }

    if (listing.status !== "PENDING") {
      return { success: false, error: `Cannot approve listing with status: ${listing.status}` };
    }

    // Atomically transition listing status to APPROVED
    listing.status = "APPROVED";
    await listing.save();

    // Calculate dates
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + listing.durationHours * 60 * 60 * 1000);

    // Create corresponding Auction record
    await Auction.create({
      listingId: listing._id,
      currentHighestBid: listing.startingBid,
      startTime,
      endTime,
      status: "SCHEDULED",
      registrationFee: 199,
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard/seller");

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

    // Retrieve listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { success: false, error: "Listing not found." };
    }

    if (listing.status !== "PENDING") {
      return { success: false, error: `Cannot reject listing with status: ${listing.status}` };
    }

    // Atomically update listing status to REJECTED and append notes
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
