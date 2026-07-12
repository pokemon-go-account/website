"use server";

import connectDB from "@/lib/db";
import RecoveryRequest from "@/models/RecoveryRequest";
import User from "@/models/User";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const RecoveryRequestSchema = z.object({
  accountLevel: z.number().min(1, "Level must be at least 1").max(100, "Level cannot exceed 100"),
  startDate: z.string().min(1, "Start Date is required"),
  creationMethod: z.string().min(1, "Account creation method is required"),
  contactMethod: z.string().min(1, "Contact method is required"),
  contactId: z.string().min(2, "Social ID must be at least 2 characters"),
  alternateContact: z.string().optional(),
  hasEmailAccess: z.boolean().refine((val) => val === true, {
    message: "You must confirm access to the email",
  }),
});

export async function submitRecoveryRequest(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in to submit a request." };
    }

    const accountLevel = Number(formData.get("accountLevel"));
    const startDate = formData.get("startDate") as string;
    const creationMethod = formData.get("creationMethod") as string;
    const contactMethod = formData.get("contactMethod") as string;
    const contactId = formData.get("contactId") as string;
    const alternateContact = (formData.get("alternateContact") as string) || "";
    const hasEmailAccess = formData.get("hasEmailAccess") === "true";

    // Read screenshots base64 array
    const screenshotsBase64Json = formData.get("screenshotsBase64Json") as string;
    let screenshotsBase64: string[] = [];
    if (screenshotsBase64Json) {
      try {
        screenshotsBase64 = JSON.parse(screenshotsBase64Json);
      } catch (err) {
        console.error("Failed to parse screenshots JSON:", err);
      }
    }

    // Fallback to single screenshot for backwards compatibility
    if (screenshotsBase64.length === 0 && formData.get("screenshotBase64")) {
      const single = formData.get("screenshotBase64") as string;
      if (single) screenshotsBase64.push(single);
    }

    if (screenshotsBase64.length === 0) {
      return { success: false, error: "At least one account screenshot image is required." };
    }

    const validated = RecoveryRequestSchema.safeParse({
      accountLevel,
      startDate,
      creationMethod,
      contactMethod,
      contactId,
      alternateContact,
      hasEmailAccess,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectDB();

    // Upload all to Cloudinary in parallel
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    console.log(`Uploading ${screenshotsBase64.length} recovery screenshot(s) to Cloudinary...`);
    const screenshotUrls = await Promise.all(
      screenshotsBase64.map((base64) => uploadToCloudinary(base64))
    );

    // Save to Database
    const request = await RecoveryRequest.create({
      userId: session.user.id,
      accountLevel: validated.data.accountLevel,
      screenshotUrl: screenshotUrls[0] || "",
      screenshotUrls,
      startDate: new Date(validated.data.startDate),
      creationMethod: validated.data.creationMethod,
      contactMethod: validated.data.contactMethod,
      contactId: validated.data.contactId,
      alternateContact: validated.data.alternateContact || undefined,
      hasEmailAccess: validated.data.hasEmailAccess,
      status: "PENDING",
    });

    revalidatePath("/console/recovery");
    return { success: true, error: null, request: JSON.parse(JSON.stringify(request)) };
  } catch (error: any) {
    console.error("Recovery request submission failure:", error);
    return { success: false, error: error.message || "Failed to submit recovery request." };
  }
}

export async function getRecoveryRequests() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized. Super Admin access required." };
    }

    await connectDB();

    // Populate user email & name
    const requests = await RecoveryRequest.find()
      .populate("userId", "name email username")
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, requests: JSON.parse(JSON.stringify(requests)), error: null };
  } catch (error: any) {
    console.error("Failed to fetch recovery requests:", error);
    return { success: false, error: error.message || "Failed to fetch recovery requests." };
  }
}

export async function updateRecoveryRequestStatus(requestId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED") {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized. Super Admin access required." };
    }

    await connectDB();

    const updated = await RecoveryRequest.findByIdAndUpdate(
      requestId,
      { status },
      { returnDocument: "after" }
    );

    if (!updated) {
      return { success: false, error: "Recovery request not found." };
    }

    revalidatePath("/console/recovery");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to update status:", error);
    return { success: false, error: error.message || "Failed to update recovery request status." };
  }
}
