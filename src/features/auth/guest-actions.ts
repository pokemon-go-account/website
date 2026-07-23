"use server";

import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { getAdminDb } from "@/lib/firebase-admin";

export interface GuestSessionData {
  userId: string;
  username: string;
  socialPlatform: string;
  socialId: string;
}

const GUEST_COOKIE_NAME = "guest_session";

/**
 * Creates or updates an anonymous guest user session with emergency contact info.
 */
export async function createGuestSessionAction(data: {
  socialPlatform: string;
  socialId: string;
}) {
  try {
    if (!data.socialPlatform || !data.socialId) {
      return { success: false, error: "Please select a social platform and provide your handle/ID." };
    }

    const socialPlatform = data.socialPlatform.trim();
    const socialId = data.socialId.trim();

    await connectDB();

    // Check if guest_session cookie exists
    const cookieStore = await cookies();
    const existingCookie = cookieStore.get(GUEST_COOKIE_NAME);

    let guestUserId: string | null = null;
    let username = `Guest (${socialPlatform}: ${socialId})`;

    if (existingCookie?.value) {
      try {
        const parsed = JSON.parse(existingCookie.value) as GuestSessionData;
        if (parsed.userId) {
          const existingUser = await User.findById(parsed.userId);
          if (existingUser && existingUser.isGuest) {
            existingUser.guestSocialPlatform = socialPlatform;
            existingUser.guestSocialId = socialId;
            existingUser.username = username;
            await existingUser.save();
            guestUserId = existingUser._id.toString();
          }
        }
      } catch (e) {
        console.warn("Failed to parse existing guest cookie:", e);
      }
    }

    // Create a new guest user record if not existing
    if (!guestUserId) {
      const shortHash = Math.random().toString(36).substring(2, 7);
      const guestUser = await User.create({
        username: `Guest_${shortHash} (${socialPlatform}: ${socialId})`,
        isGuest: true,
        guestSocialPlatform: socialPlatform,
        guestSocialId: socialId,
        preferredContactMethod: socialPlatform,
        preferredContactId: socialId,
        role: "USER",
        isOnboarded: true,
        isEmailVerified: false,
      });

      guestUserId = guestUser._id.toString();
      username = guestUser.username || username;
    }

    const sessionPayload: GuestSessionData = {
      userId: guestUserId,
      username,
      socialPlatform,
      socialId,
    };

    // Set persistent guest cookie for 1 year
    cookieStore.set({
      name: GUEST_COOKIE_NAME,
      value: JSON.stringify(sessionPayload),
      httpOnly: false, // Accessible to client-side JS for chat UI fallback
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return {
      success: true,
      guestSession: sessionPayload,
    };
  } catch (error: any) {
    console.error("Error creating guest session:", error);
    return { success: false, error: error.message || "Failed to create guest session." };
  }
}

/**
 * Retrieves current guest session from cookies if present.
 */
export async function getGuestSessionAction() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GUEST_COOKIE_NAME);
    if (!cookie?.value) return null;

    const parsed = JSON.parse(cookie.value) as GuestSessionData;
    if (parsed.userId && parsed.socialId) {
      return parsed;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Links any existing guest orders & Firestore support chats to a newly logged-in/registered account.
 */
export async function linkGuestOrdersToAccountAction(registeredUserId: string) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GUEST_COOKIE_NAME);
    if (!cookie?.value) return { success: true, count: 0 };

    const parsed = JSON.parse(cookie.value) as GuestSessionData;
    if (!parsed.userId || parsed.userId === registeredUserId) {
      return { success: true, count: 0 };
    }

    const guestUserId = parsed.userId;

    await connectDB();

    // 1. Reassign MongoDB Orders
    const updateResult = await Order.updateMany(
      { userId: guestUserId },
      {
        $set: {
          userId: registeredUserId,
          isGuest: false,
          originalGuestId: guestUserId,
        },
      }
    );

    // 2. Reassign Firestore Support Chats
    try {
      const db = getAdminDb();
      if (db) {
        const chatsSnapshot = await db.collection("supportChats").where("userId", "==", guestUserId).get();

        if (!chatsSnapshot.empty) {
          const batch = db.batch();
          chatsSnapshot.docs.forEach((docSnap: any) => {
            batch.update(docSnap.ref, {
              userId: registeredUserId,
              originalGuestUserId: guestUserId,
            });
          });
          await batch.commit();
        }
      }
    } catch (fsErr) {
      console.error("Error reassigning Firestore chats for guest:", fsErr);
    }

    // 3. Clear guest session cookie
    cookieStore.delete(GUEST_COOKIE_NAME);

    return {
      success: true,
      count: updateResult.modifiedCount || 0,
    };
  } catch (error: any) {
    console.error("Error linking guest orders to registered account:", error);
    return { success: false, error: error.message || "Failed to link guest orders." };
  }
}
