"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import WisePayment from "@/models/WisePayment";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function verifyWisePayment(paymentId: string) {
  try {
    await verifyAdmin();
    await connectDB();
    await WisePayment.findByIdAndUpdate(paymentId, { status: "Verified" });
    revalidatePath("/console/wise-panel");
    return { success: true };
  } catch (error) {
    console.error("[Verify Wise Payment Action Error]", error);
    throw new Error("Failed to verify wise payment");
  }
}

export async function rejectWisePayment(paymentId: string) {
  try {
    await verifyAdmin();
    await connectDB();
    await WisePayment.findByIdAndUpdate(paymentId, { status: "Rejected" });
    revalidatePath("/console/wise-panel");
    return { success: true };
  } catch (error) {
    console.error("[Reject Wise Payment Action Error]", error);
    throw new Error("Failed to reject wise payment");
  }
}
