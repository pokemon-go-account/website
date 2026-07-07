"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

/**
 * Called from the client after Firebase confirms emailVerified === true.
 * Syncs that status into MongoDB so the profile page reflects it.
 */
export async function syncEmailVerification() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated." };
    }

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, { isEmailVerified: true });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("syncEmailVerification error:", error);
    return { success: false, error: "Failed to sync verification status." };
  }
}
