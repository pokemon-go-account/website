import Link from "next/link";
import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import { FeedbackForm } from "./feedback-form";
import { auth } from "@/auth";
import { Star, MessageSquareCode, Award, ShieldAlert, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0; // Dynamic rendering

export default async function FeedbackPage() {
  await connectDB();
  const session = await auth();

  // Fetch logged-in user's existing review if any
  let existingReview = null;
  if (session?.user?.id) {
    const reviewDoc = await Feedback.findOne({ userId: session.user.id }).lean();
    if (reviewDoc) {
      existingReview = {
        rating: reviewDoc.rating,
        comment: reviewDoc.comment,
      };
    }
  }

  // Fetch all feedbacks from newest to oldest
  const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();

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
    const code = username.charCodeAt(0) % 5;
    const colors = [
      "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "bg-orange-500/10 text-orange-500 border-orange-500/20",
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      "bg-pink-500/10 text-pink-500 border-pink-500/20"
    ];
    return colors[code];
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header section */}
      <div className="border-b border-border pb-6 space-y-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
            Client Testimonials & Feedback
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read what other Trainers have to say about our premium scheduled live auctions and secure account recovery service.
          </p>
        </div>

        {/* Stats quick view */}
        <div className="flex items-center gap-6 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.05] p-4 rounded-2xl">
          <div className="text-center">
            <div className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{averageRating}</div>
            <div className="flex items-center justify-center mt-1">
              <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold ml-0.5">Rating</span>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{totalReviews}</div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block mt-1">Reviews</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Feedbacks List */}
        <div className="lg:col-span-2 space-y-6">
          {feedbacks.length === 0 ? (
            <div className="flex h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/25 text-center p-8">
              <MessageSquareCode className="h-8 w-8 text-zinc-400 mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No reviews yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Be the first to submit a review about Pokemon Go Services!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((item: any) => (
                <div
                  key={item._id.toString()}
                  className="rounded-2xl border border-zinc-200/60 dark:border-white/[0.04] bg-white/40 dark:bg-white/[0.01] hover:border-zinc-300 dark:hover:border-white/[0.08] p-5 transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Upper row: User Avatar initials & rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-7 w-7 rounded-lg border text-xs font-black flex items-center justify-center select-none uppercase shadow-xs", getAvatarColorClass(item.username))}>
                          {item.username.substring(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
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
                  <div className="pt-2.5 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    <span className="flex items-center gap-1 text-[9px] text-[#24A1DE] uppercase tracking-wider">
                      <Award className="h-3 w-3" /> Verified User
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

        {/* Right Column: Feedback Form / CTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            
            {session?.user ? (
              <FeedbackForm initialFeedback={existingReview} />
            ) : (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.01] backdrop-blur-md p-6 text-center space-y-4 shadow-xl">
                <MessageSquareCode className="h-8 w-8 text-zinc-400 dark:text-zinc-650 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Have something to say?</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-xs mx-auto">
                    Only verified registered Trainers are allowed to submit testimonials to maintain credibility.
                  </p>
                </div>
                <Link
                  href="/login?callbackUrl=/feedback"
                  className="w-full h-11 inline-flex items-center justify-center font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black transition-all shadow-md active:scale-98"
                >
                  Sign In to Review
                </Link>
              </div>
            )}

            {/* Additional info sidebox */}
            <div className="rounded-2xl border border-zinc-200/50 dark:border-white/[0.03] bg-zinc-50/50 dark:bg-white/[0.005] p-5 space-y-3.5">
              <h4 className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Escrow Safety Policy</h4>
              <div className="space-y-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>Real-time feedback collected only from authenticated accounts.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>Personal identity, emails, and names are fully masked for privacy.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>100% money back guarantee on recovery services if retrieval is unsuccessful.</span>
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
