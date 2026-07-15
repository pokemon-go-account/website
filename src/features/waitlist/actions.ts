"use server";

import connectDB from "@/lib/db";
import Waitlist from "@/models/Waitlist";
import { auth } from "@/auth";

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    await connectDB();

    const existing = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return { success: false, error: "This email is already on the waitlist." };
    }

    await Waitlist.create({ email: email.toLowerCase().trim() });
    return { success: true };
  } catch (err: any) {
    console.error("Waitlist join error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function getWaitlistEmails(): Promise<{
  success: boolean;
  emails?: { email: string; createdAt: string }[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();
    const entries = await Waitlist.find().sort({ createdAt: -1 }).lean();
    return {
      success: true,
      emails: entries.map((e: any) => ({
        email: e.email,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  } catch (err: any) {
    console.error("Get waitlist error:", err);
    return { success: false, error: "Failed to fetch waitlist." };
  }
}

export async function deleteWaitlistEntry(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();
    await Waitlist.findOneAndDelete({ email: email.toLowerCase().trim() });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
