"use server";

import connectDB from "@/lib/db";
import RecoveryRequest from "@/models/RecoveryRequest";
import User from "@/models/User";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const RecoveryRequestSchema = z.object({
  trainerName: z.string().optional(),
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

    const trainerName = (formData.get("trainerName") as string) || "";
    const accountLevel = Number(formData.get("accountLevel"));
    const startDate = formData.get("startDate") as string;
    const creationMethod = formData.get("creationMethod") as string;
    const contactMethod = formData.get("contactMethod") as string;
    const contactId = formData.get("contactId") as string;
    const alternateContact = (formData.get("alternateContact") as string) || "";
    const hasEmailAccess = formData.get("hasEmailAccess") === "true";

    // Read screenshots direct URLs or base64 fallback array
    const screenshotUrlsJson = formData.get("screenshotUrlsJson") as string;
    const screenshotsBase64Json = formData.get("screenshotsBase64Json") as string;
    
    let screenshotsInput: string[] = [];
    if (screenshotUrlsJson) {
      try {
        screenshotsInput = JSON.parse(screenshotUrlsJson);
      } catch (err) {
        console.error("Failed to parse screenshotUrls JSON:", err);
      }
    } else if (screenshotsBase64Json) {
      try {
        screenshotsInput = JSON.parse(screenshotsBase64Json);
      } catch (err) {
        console.error("Failed to parse screenshots JSON:", err);
      }
    }

    // Fallback to single screenshot for backwards compatibility
    if (screenshotsInput.length === 0 && formData.get("screenshotBase64")) {
      const single = formData.get("screenshotBase64") as string;
      if (single) screenshotsInput.push(single);
    }

    if (screenshotsInput.length === 0) {
      return { success: false, error: "At least one account screenshot image is required." };
    }

    const validated = RecoveryRequestSchema.safeParse({
      trainerName,
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

    // Upload any fallback base64 screenshot to Cloudinary, keeping already-uploaded URLs
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    const screenshotUrls = await Promise.all(
      screenshotsInput.map(async (item) => {
        if (item.startsWith("data:") || !item.startsWith("http")) {
          return uploadToCloudinary(item);
        }
        return item;
      })
    );

    // Save to Database
    const request = await RecoveryRequest.create({
      userId: session.user.id,
      trainerName: validated.data.trainerName || undefined,
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
      price: null,
      priceStatus: "QUOTE_PENDING",
    });

    // Create Support Chat in Firestore on the server (guaranteed bypass of client auth rules)
    const reqIdStr = String(request._id);
    const chatId = `recovery-${reqIdStr}`;
    const username = (session.user as any)?.username || session.user?.name || session.user?.email || "User";
    const userEmail = session.user?.email || "N/A";
    const country = (session.user as any)?.country || "N/A";

    const userMsgText = `🔑 NEW RECOVERY REQUEST PLACED
----------------------------------
Request ID: ${reqIdStr}
Trainer Name: ${validated.data.trainerName || "Not Provided"}
Account Level: ${validated.data.accountLevel}
Creation Method: ${validated.data.creationMethod ? validated.data.creationMethod.toUpperCase() : "N/A"}
Start Date: ${validated.data.startDate ? new Date(validated.data.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
Contact Method: ${validated.data.contactMethod} (${validated.data.contactId})
Alternate Contact: ${validated.data.alternateContact || "None"}
Email Access: ${validated.data.hasEmailAccess ? "Yes ✓" : "No ✗"}
Screenshots: ${screenshotUrls.length} attached
Status: Price Pending (Awaiting Super Admin Quote)

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${userEmail}
User ID: ${session.user.id}
🌍 Country: ${country}

Our recovery team will review your account details and quote a price shortly!`;

    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const adminDb = getAdminDb();

      if (adminDb) {
        await adminDb.collection("supportChats").doc(chatId).set({
          userId: session.user.id,
          username,
          email: userEmail,
          type: "recovery",
          orderId: reqIdStr,
          title: `Recovery #${reqIdStr.substring(0, 8).toUpperCase()}`,
          lastMessage: `Recovery request placed. Price Pending.`,
          lastMessageAt: new Date(),
          unreadByAdmin: 1,
          unreadByUser: 0,
          createdAt: new Date(),
        }, { merge: true });

        const msgsRef = adminDb.collection("supportChats").doc(chatId).collection("messages");
        await msgsRef.add({
          text: userMsgText,
          sender: "user",
          senderName: username,
          timestamp: new Date(),
          read: false,
        });

        await msgsRef.add({
          text: `System: Thank you for submitting your account recovery request! Super Admin has been notified and will review your details to quote a price in Console soon. You will receive an automated notification message here as soon as the price is set.`,
          sender: "admin",
          senderName: "Support Team",
          timestamp: new Date(),
          read: false,
        });
      } else {
        const { getDb } = await import("@/lib/firestore");
        const { doc, setDoc, collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        const db = getDb();
        const chatRef = doc(db, "supportChats", chatId);

        await setDoc(chatRef, {
          userId: session.user.id,
          username,
          email: userEmail,
          type: "recovery",
          orderId: reqIdStr,
          title: `Recovery #${reqIdStr.substring(0, 8).toUpperCase()}`,
          lastMessage: `Recovery request placed. Price Pending.`,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
        }, { merge: true });

        const msgsRef = collection(db, "supportChats", chatId, "messages");
        await addDoc(msgsRef, {
          text: userMsgText,
          sender: "user",
          senderName: username,
          timestamp: serverTimestamp(),
          read: false,
        });

        await addDoc(msgsRef, {
          text: `System: Thank you for submitting your account recovery request! Super Admin has been notified and will review your details to quote a price in Console soon. You will receive an automated notification message here as soon as the price is set.`,
          sender: "admin",
          senderName: "Support Team",
          timestamp: serverTimestamp(),
          read: false,
        });
      }

      // Trigger Webhook Notification
      const { sendChatWebhookNotification } = await import("@/features/chat/actions");
      sendChatWebhookNotification({
        ticketId: chatId,
        ticketTitle: `Recovery #${reqIdStr.substring(0, 8).toUpperCase()}`,
        senderName: username,
        senderType: "user",
        userEmail,
        text: userMsgText,
      }).catch(() => {});
    } catch (chatErr) {
      console.error("Failed to create recovery support chat on server:", chatErr);
    }

    revalidatePath("/console/recovery");
    revalidatePath("/recovery");
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

export async function getUserRecoveryRequests() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, requests: [], error: "Unauthorized." };
    }

    await connectDB();

    const requests = await RecoveryRequest.find({
      userId: session.user.id,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, requests: JSON.parse(JSON.stringify(requests)), error: null };
  } catch (error: any) {
    console.error("Failed to fetch user recovery requests:", error);
    return { success: false, requests: [], error: error.message || "Failed to fetch recovery requests." };
  }
}

export async function updateRecoveryRequestPrice(requestId: string, price: number) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized. Super Admin access required." };
    }

    if (typeof price !== "number" || price < 0 || isNaN(price)) {
      return { success: false, error: "Please enter a valid non-negative price." };
    }

    await connectDB();

    const updated = await RecoveryRequest.findByIdAndUpdate(
      requestId,
      {
        price,
        priceStatus: "QUOTED",
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return { success: false, error: "Recovery request not found." };
    }

    revalidatePath("/console/recovery");
    return { success: true, error: null, request: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("Failed to update price:", error);
    return { success: false, error: error.message || "Failed to update recovery request price." };
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

export async function markRecoveryAsPaid(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();

    const request = await RecoveryRequest.findOne({ _id: requestId, userId: session.user.id });
    if (!request) {
      return { success: false, error: "Recovery request not found." };
    }

    request.status = "IN_PROGRESS";
    await request.save();

    revalidatePath("/orders");
    revalidatePath("/console/recovery");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark recovery request as paid:", error);
    return { success: false, error: error.message || "Failed to mark recovery request as paid." };
  }
}

export async function deleteRecoveryRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized. Super Admin access required." };
    }

    await connectDB();

    const request = await RecoveryRequest.findById(requestId).lean() as any;
    if (!request) {
      return { success: false, error: "Recovery request not found." };
    }

    // Collect screenshot URLs to clean up from Cloudinary
    const screenshotUrls: string[] = [];
    if (request.screenshotUrl) screenshotUrls.push(request.screenshotUrl);
    if (Array.isArray(request.screenshotUrls)) {
      screenshotUrls.push(...request.screenshotUrls);
    }

    await RecoveryRequest.findByIdAndDelete(requestId);

    // Delete Cloudinary assets after DB cleanup (non-blocking)
    if (screenshotUrls.length > 0) {
      try {
        const { deleteFromCloudinary } = await import("@/lib/cloudinary");
        await deleteFromCloudinary(screenshotUrls);
      } catch (cloudinaryErr) {
        console.error("Failed to delete screenshots from Cloudinary:", cloudinaryErr);
      }
    }

    revalidatePath("/console/recovery");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to delete recovery request:", error);
    return { success: false, error: error.message || "Failed to delete recovery request." };
  }
}

/**
 * Server Action: Generate a secure signed upload signature for direct Cloudinary uploads from the client.
 * Bypasses Vercel execution duration limit by moving heavy upload payload processing directly to Cloudinary.
 */
export async function getCloudinaryUploadSignature() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = 
      !!cloudName && 
      !!apiKey && 
      !!apiSecret && 
      cloudName !== "cloud_placeholder" &&
      apiKey !== "key_placeholder" &&
      apiSecret !== "secret_placeholder";

    if (!isConfigured) {
      return { success: true, isMock: true };
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "pokemon_go_auctions";

    // Parameters to sign must be sorted alphabetically
    const paramsToSign = {
      folder,
      timestamp,
    };

    const { v2: cloudinary } = await import("cloudinary");
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      success: true,
      isMock: false,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    };
  } catch (err: any) {
    console.error("Failed to generate Cloudinary signature:", err);
    return { success: false, error: "Internal signature generation failure." };
  }
}

