"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";

export async function verifyPayment(paymentId: string) {
  await connectDB();
  await Payment.findByIdAndUpdate(paymentId, { status: "Verified" });
  revalidatePath("/console/payments");
}

export async function rejectPayment(paymentId: string) {
  await connectDB();
  await Payment.findByIdAndUpdate(paymentId, { status: "Rejected" });
  revalidatePath("/console/payments");
}
