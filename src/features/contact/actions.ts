"use server";

import connectDB from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

export async function submitContactMessage(prevState: any, formData: FormData) {
  try {
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const validated = ContactSchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectDB();
    await ContactMessage.create(validated.data);

    revalidatePath("/console/contact");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Contact form submission error:", error);
    return { success: false, error: "Failed to send message. Please try again." };
  }
}

export async function getContactMessages() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return { success: true, messages: JSON.parse(JSON.stringify(messages)), error: null };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch messages." };
  }
}

export async function updateContactMessageStatus(
  messageId: string,
  status: "UNREAD" | "READ" | "REPLIED"
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();
    await ContactMessage.findByIdAndUpdate(messageId, { status });
    revalidatePath("/console/contact");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update status." };
  }
}
