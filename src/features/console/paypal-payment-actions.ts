"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import PaypalPayment from "@/models/PaypalPayment";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function verifyPaypalPayment(paymentId: string) {
  try {
    await verifyAdmin();
    await connectDB();
    const payment = await PaypalPayment.findByIdAndUpdate(paymentId, { status: "Verified" });
    
    // In a real app, this is where you would dispatch an event to fulfill the order
    // e.g. update order status to "Paid", send confirmation email, etc.
    
    revalidatePath("/console/paypal-panel");
    return { success: true };
  } catch (error) {
    console.error("[Verify Paypal Payment Action Error]", error);
    throw new Error("Failed to verify paypal payment");
  }
}

export async function rejectPaypalPayment(paymentId: string) {
  try {
    await verifyAdmin();
    await connectDB();
    await PaypalPayment.findByIdAndUpdate(paymentId, { status: "Rejected" });
    
    revalidatePath("/console/paypal-panel");
    return { success: true };
  } catch (error) {
    console.error("[Reject Paypal Payment Action Error]", error);
    throw new Error("Failed to reject paypal payment");
  }
}
