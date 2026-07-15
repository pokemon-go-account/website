"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import CryptoPayment from "@/models/CryptoPayment";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function verifyCryptoPayment(paymentId: string) {
  try {
    await verifyAdmin();
    await connectDB();
    await CryptoPayment.findByIdAndUpdate(paymentId, { status: "Verified" });
    revalidatePath("/console/crypto-panel");
    return { success: true };
  } catch (error) {
    console.error("[Verify Crypto Payment Action Error]", error);
    throw new Error("Failed to verify crypto payment");
  }
}

export async function rejectCryptoPayment(paymentId: string) {
  try {
    await verifyAdmin();
    await connectDB();
    await CryptoPayment.findByIdAndUpdate(paymentId, { status: "Rejected" });
    revalidatePath("/console/crypto-panel");
    return { success: true };
  } catch (error) {
    console.error("[Reject Crypto Payment Action Error]", error);
    throw new Error("Failed to reject crypto payment");
  }
}
