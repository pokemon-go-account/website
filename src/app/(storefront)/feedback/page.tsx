import Link from "next/link";
import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import User from "@/models/User";
import { auth } from "@/auth";
import { Star, MessageSquareCode, Award, ShieldAlert, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0; // Dynamic rendering

export default async function FeedbackPage() {
  await connectDB();
  const session = await auth();

  // Fetch logged-in user's existing review if any
  let existingReview = null;
  let hasPurchased = false;
  if (session?.user?.id) {
    const reviewDoc = await Feedback.findOne({ userId: session.user.id }).lean();
    if (reviewDoc) {
      existingReview = {
        rating: reviewDoc.rating,
        comment: reviewDoc.comment,
      };
    }

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

    if (completedOrdersCount > 0 || completedAuctionsCount > 0) {
      hasPurchased = true;
    }
  }

  // Fetch all feedbacks from newest to oldest and format usernames
  const feedbacksDoc = await Feedback.find()
    .populate("userId", "username telegramUsername name")
    .sort({ createdAt: -1 })
    .lean();

  const feedbacks = feedbacksDoc.map((item: any) => {
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
      ...item,
      username: resolvedUsername,
    };
  });

  // Calculate statistics
  const totalReviews = feedbacks.length;
  let averageRating = 0;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (totalReviews > 0) {
    const totalSum = feedbacks.reduce((acc, f) => {
      const rating = Math.min(Math.max(Math.round(f.rating), 1), 5) as 1 | 2 | 3 | 4 | 5;
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      return acc + f.rating;
    }, 0);
    averageRating = Number((totalSum / totalReviews).toFixed(1));
  }

  // Visual helper for rendering star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= Math.round(rating)
                ? "fill-yellow-400 stroke-yellow-400 filter drop-shadow-[0_0_2px_rgba(250,204,21,0.3)]"
                : "stroke-zinc-300 dark:stroke-zinc-700 fill-transparent"
            )}
          />
        ))}
      </div>
    );
  };

  // Helper for generating distinct avatar bg colors based on username
  const getAvatarColorClass = (username: string) => {
    return "bg-zinc-100 dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/[0.08]";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header section */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-6 space-y-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Client Testimonials & Feedback
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Read what other Trainers have to say about our scheduled live auctions, products and secure account recovery service.
          </p>
        </div>

        {/* Stats quick view */}
        <div className="flex items-center gap-6 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] p-4 rounded-lg shadow-xs">
          <div className="text-center">
            <div className="text-xl font-bold text-zinc-900 dark:text-white leading-none">{averageRating}</div>
            <div className="flex items-center justify-center mt-1">
              <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
              <span className="text-[10px] text-zinc-550 dark:text-zinc-400 font-semibold ml-0.5">Rating</span>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:bg-white/[0.06]" />
          <div className="text-center">
            <div className="text-xl font-bold text-zinc-900 dark:text-white leading-none">{totalReviews}</div>
            <span className="text-[10px] text-zinc-550 dark:text-zinc-400 font-semibold block mt-1">Reviews</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="space-y-6">
        {feedbacks.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] text-center p-8">
            <MessageSquareCode className="h-8 w-8 text-zinc-400 mb-2" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No reviews yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
              No reviews have been posted yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbacks.map((item: any) => (
              <div
                key={item._id.toString()}
                className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-white/[0.1] p-5 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Upper row: User Avatar initials & rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-7 w-7 rounded-md border text-[10px] font-semibold flex items-center justify-center select-none uppercase shadow-xs", getAvatarColorClass(item.username))}>
                        {item.username.substring(0, 2)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                        {item.username}
                      </span>
                    </div>
                    {renderStars(item.rating)}
                  </div>

                  {/* Review text */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                    "{item.comment}"
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.08] flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                  <span className="flex items-center gap-1 text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Award className="h-3 w-3 text-zinc-400 dark:text-zinc-500" /> Verified User
                  </span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

