"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { auth } from "@/auth";

async function checkSuperAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Super-admin privileges required.");
  }
  return session;
}

export async function verifyPayment(paymentId: string) {
  await checkSuperAdminSession();
  await connectDB();
  await Payment.findByIdAndUpdate(paymentId, { status: "Verified" });
  revalidatePath("/console/payments");
}

export async function rejectPayment(paymentId: string) {
  await checkSuperAdminSession();
  await connectDB();
  await Payment.findByIdAndUpdate(paymentId, { status: "Rejected" });
  revalidatePath("/console/payments");
}
