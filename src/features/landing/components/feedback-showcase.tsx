import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import User from "@/models/User"; // Ensure model registration
import { FeedbackMarquee } from "./feedback-marquee";

async function getRealFeedbacks() {
  try {
    await connectDB();
    // Register User model to ensure population ref works
    const _userCheck = User;

    const docs = await Feedback.find()
      .populate("userId", "username telegramUsername name")
      .sort({ createdAt: -1 })
      .limit(30) // fetch up to 30 reviews
      .lean();

    return docs.map((item: any) => {
      let resolvedUsername = item.username || "";
      const user = item.userId;
      if (user && typeof user === "object") {
        if (user.username) {
          resolvedUsername = user.username;
        } else if (user.telegramUsername) {
          resolvedUsername = user.telegramUsername.replace("@", "");
        } else if (user.name) {
          resolvedUsername = user.name.replace(/\s+/g, "");
        }
      }
      
      // Mask raw Mongo ID or empty usernames as Trainer-xxxxxx
      if (/^[0-9a-fA-F]{24}$/.test(resolvedUsername) || !resolvedUsername) {
        const idStr = user?._id?.toString() || item.userId?.toString() || item._id?.toString() || "user";
        resolvedUsername = `Trainer-${idStr.substring(0, 6)}`;
      }

      return {
        _id: item._id.toString(),
        username: resolvedUsername,
        comment: item.comment,
        rating: item.rating,
        createdAt: item.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("Failed to load feedbacks for showcase:", error);
    return [];
  }
}

export async function FeedbackShowcase() {
  const feedbacks = await getRealFeedbacks();

  return (
    <section className="relative w-full overflow-hidden border-t border-zinc-200 dark:border-white/[0.06] py-16">
      <div className="absolute inset-0 bg-white dark:bg-[#09090B] z-[-2] pointer-events-none" />
      <FeedbackMarquee feedbacks={feedbacks} />
    </section>
  );
}
