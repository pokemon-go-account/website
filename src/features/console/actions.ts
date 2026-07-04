"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AdminRent from "@/models/AdminRent";
import Listing from "@/models/Listing";
import { revalidatePath } from "next/cache";
import { handleTelegramCheckout } from "@/utils/checkout"; // repurposed for rent reminder

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
    await Listing.findByIdAndUpdate(listingId, {
      status: "APPROVED",
      adminNotes: notes || "",
      escrowStage: "APPROVED",
    });
    revalidatePath("/console/auctions");
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
