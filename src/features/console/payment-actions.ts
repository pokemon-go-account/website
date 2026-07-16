"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import { auth } from "@/auth";

async function verifySuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function verifyPayment(paymentId: string) {
  await verifySuperAdmin();
  await connectDB();
  await Payment.findByIdAndUpdate(paymentId, { status: "Verified" });
  revalidatePath("/console/payments");
}

export async function rejectPayment(paymentId: string) {
  await verifySuperAdmin();
  await connectDB();
  await Payment.findByIdAndUpdate(paymentId, { status: "Rejected" });
  revalidatePath("/console/payments");
}
