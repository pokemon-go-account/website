"use server";

import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import User from "@/models/User";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const FeedbackSubmissionSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(500, "Comment cannot exceed 500 characters"),
});

export async function submitFeedback(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "You must be signed in to submit feedback." };
    }

    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment") as string;

    const validated = FeedbackSubmissionSchema.safeParse({ rating, comment });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectDB();
    
    // Fetch user details to get username
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return { success: false, error: "User profile not found." };
    }

    if (!user.isOnboarded) {
      return { success: false, error: "Please complete your profile onboarding before submitting feedback." };
    }

    // Verify user has purchased something (either a completed order or won a completed auction)
    const Order = (await import("@/models/Order")).default;
    const Auction = (await import("@/models/Auction")).default;

    const completedOrdersCount = await Order.countDocuments({
      userId: session.user.id,
      status: "COMPLETED",
    });
    const completedAuctionsCount = await Auction.countDocuments({
      highestBidderId: session.user.id,
      status: "COMPLETED",
    });

    if (completedOrdersCount === 0 && completedAuctionsCount === 0) {
      return {
        success: false,
        error: "Only Trainers who have completed a direct storefront purchase or won a live auction are eligible to leave feedback.",
      };
    }

    // Determine display username (expose username, never real name)
    let displayUsername = "";
    if (user.username) {
      displayUsername = user.username;
    } else if (user.telegramUsername) {
      // Strip @ if present
      displayUsername = user.telegramUsername.replace("@", "");
    } else if (user.name) {
      // Fallback to name but make it look like a username (e.g. JohnDoe)
      displayUsername = user.name.replace(/\s+/g, "");
    } else {
      displayUsername = `Trainer_${session.user.id.substring(0, 6)}`;
    }

    // Check if feedback already exists for this user
    const existingFeedback = await Feedback.findOne({ userId: session.user.id });
    if (existingFeedback) {
      existingFeedback.rating = validated.data.rating;
      existingFeedback.comment = validated.data.comment.trim();
      existingFeedback.username = displayUsername;
      await existingFeedback.save();
    } else {
      // Create feedback
      await Feedback.create({
        username: displayUsername,
        rating: validated.data.rating,
        comment: validated.data.comment.trim(),
        userId: session.user.id,
      });
    }

    revalidatePath("/feedback");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    return { success: false, error: "Failed to submit feedback. Please try again." };
  }
}
