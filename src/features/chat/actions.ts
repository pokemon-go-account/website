"use server";

import { auth } from "@/auth";

export async function uploadChatImage(base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    const url = await uploadToCloudinary(base64Data);
    return { success: true, url };
  } catch (err: any) {
    console.error("Upload chat image error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

/**
 * Delete an array of Cloudinary chat image URLs.
 * Called by the admin panel when a chat ticket is cleared.
 * Requires SUPER_ADMIN or ADMIN role.
 */
export async function deleteChatImages(imageUrls: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return { success: false, error: "Unauthorized" };
    }

    if (!imageUrls || imageUrls.length === 0) {
      return { success: true };
    }

    const { deleteFromCloudinary } = await import("@/lib/cloudinary");
    await deleteFromCloudinary(imageUrls);
    return { success: true };
  } catch (err: any) {
    console.error("Delete chat images error:", err);
    return { success: false, error: err.message || "Failed to delete images" };
  }
}

/**
 * Server Action: Generate a Firebase Custom Token for the logged-in user session
 */
export async function getFirebaseCustomToken(): Promise<{ success: boolean; customToken?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    const { getAuth } = await import("firebase-admin/auth");
    await import("@/lib/firebase-admin");
    
    const firebaseAuth = getAuth();
    const customToken = await firebaseAuth.createCustomToken(session.user.id, {
      role: (session.user as any).role || "USER",
    });
    return { success: true, customToken };
  } catch (err: any) {
    console.error("Failed to create Firebase custom token:", err);
    return { success: false, error: err.message || "Failed to create token" };
  }
}
