"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Listing, { ListingValidationSchema } from "@/models/Listing";
import { revalidatePath } from "next/cache";

export async function createListing(data: unknown) {
  try {
    // 1. Enforce strict session validation
    const session = await auth();
    if (!session?.user || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized. Seller privileges required." };
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
    revalidatePath("/dashboard/seller");

    return { success: true, error: null };
  } catch (error) {
    console.error("Listing submission failure:", error);
    return { success: false, error: "Internal database tracking breakdown." };
  }
}