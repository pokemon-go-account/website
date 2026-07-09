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
    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, error: "Not authenticated or email missing." };
    }

    await connectDB();

    // Verify email verification state via Firebase Admin SDK
    const { getApps } = await import("firebase-admin/app");
    if (getApps().length > 0) {
      const { getAuth } = await import("firebase-admin/auth");
      try {
        const firebaseUser = await getAuth().getUserByEmail(session.user.email);
        if (!firebaseUser.emailVerified) {
          return { success: false, error: "Your email has not been verified yet on the server." };
        }
      } catch (fbErr: any) {
        console.error("Firebase Admin getUserByEmail error:", fbErr);
        return { success: false, error: "Could not retrieve verification status from identity provider." };
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        return { success: false, error: "Security services are not configured." };
      }
      console.warn("[Sandbox Mode] Skipping Firebase Admin verification in syncEmailVerification.");
    }

    await User.findByIdAndUpdate(session.user.id, { isEmailVerified: true });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("syncEmailVerification error:", error);
    return { success: false, error: "Failed to sync verification status." };
  }
}
